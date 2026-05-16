/*
 * H.E.A.L.E.R - ESP32-CAM Wi-Fi Firmware
 * ========================================
 * 
 * PURPOSE:
 *   This firmware runs on the ESP32-CAM AI-Thinker module mounted on the
 *   far-right side of the 4-compartment medicine dispenser. It captures
 *   images of compartments during dispensing events and uploads them to
 *   the admin dashboard's backend server over Wi-Fi.
 * 
 * COMMUNICATION:
 *   - Serial (RX/TX at 9600 baud) ↔ Arduino Mega (receives capture commands)
 *   - Wi-Fi HTTP POST → Backend server (uploads captured images)
 *   - Wi-Fi HTTP Server → Dashboard (receives session config, status queries)
 * 
 * SERIAL COMMANDS (from Arduino Mega):
 *   TAKE_BEFORE_X   → Capture one "BEFORE" image of compartment X (1-4)
 *   TAKE_AFTER_X    → Capture one "AFTER" image of compartment X (1-4)
 *   START_SESSION_X → Begin continuous 1fps capture for compartment X
 *   END_SESSION_X   → Stop continuous capture for compartment X
 * 
 * HTTP ENDPOINTS (served by ESP32-CAM):
 *   GET  /status       → JSON status (Wi-Fi, camera, session info)
 *   GET  /capture      → On-demand single capture (for testing)
 *   POST /set_session  → Configure patientId and sessionName
 * 
 * BEFORE UPLOADING:
 *   1. Edit "esp32cam_config.h" with your Wi-Fi SSID and server IP
 *   2. In Arduino IDE: Board → "AI Thinker ESP32-CAM"
 *   3. Partition Scheme → "Huge APP (3MB No OTA)"
 *   4. Upload Speed → 115200
 *   5. Connect FTDI programmer (GPIO0 → GND for upload, remove after)
 * 
 * LIBRARIES REQUIRED:
 *   - ESP32 Board Package (by Espressif) — install via Board Manager
 *   - No external libraries needed (all included in ESP32 core)
 */

#include "esp32cam_config.h"   // User configuration (Wi-Fi, server, etc.)
#include "esp_camera.h"
#include "Arduino.h"
#include "WiFi.h"
#include "HTTPClient.h"
#include "WebServer.h"
#include "ESPmDNS.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// =========================================================================
// AI-Thinker ESP32-CAM Pin Definitions (DO NOT CHANGE)
// =========================================================================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// Built-in LED (active LOW on AI-Thinker)
#define LED_BUILTIN_PIN    33

// =========================================================================
// Global State Variables
// =========================================================================

// --- Session State ---
String g_patientId = "";                // Set by dashboard via /set_session
String g_sessionName = "";              // Set by dashboard via /set_session
int    g_activeCompartment = 0;         // Currently active compartment (0 = none)
bool   g_isCapturing = false;           // Continuous capture active flag
unsigned long g_lastCaptureTime = 0;    // Timestamp of last capture (millis)
unsigned long g_captureCount = 0;       // Number of images captured this session

// --- Wi-Fi State ---
bool   g_wifiConnected = false;
unsigned long g_lastWifiAttempt = 0;    // Last reconnect attempt (millis)

// --- Camera State ---
bool   g_cameraReady = false;

// --- Serial Buffer ---
String g_serialBuffer = "";             // Accumulates incoming serial chars

// --- HTTP Server ---
WebServer server(80);                   // Lightweight HTTP server on port 80

// =========================================================================
// SETUP
// =========================================================================
void setup() {
  // Disable brownout detector — prevents random resets on camera power spikes
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  // Initialize Serial — communicates with Arduino Mega at configured baud rate
  Serial.begin(SERIAL_BAUD_RATE);
  g_serialBuffer.reserve(64);

  // Initialize built-in LED
  pinMode(LED_BUILTIN_PIN, OUTPUT);
  digitalWrite(LED_BUILTIN_PIN, HIGH); // HIGH = LED OFF (active low)

  Serial.println();
  Serial.println("====================================");
  Serial.println("  H.E.A.L.E.R ESP32-CAM Starting");
  Serial.println("====================================");

  // --- Initialize Camera ---
  initCamera();

  // --- Connect to Wi-Fi ---
  initWiFi();

  // --- Start HTTP Server ---
  initHTTPServer();

  // --- Start mDNS ---
  if (MDNS.begin(MDNS_HOSTNAME)) {
    Serial.print("[mDNS] Reachable at: http://");
    Serial.print(MDNS_HOSTNAME);
    Serial.println(".local");
  } else {
    Serial.println("[mDNS] Failed to start mDNS");
  }

  Serial.println("====================================");
  Serial.println("  Setup Complete — Listening...");
  Serial.println("====================================");
}

// =========================================================================
// MAIN LOOP — Non-blocking, runs continuously
// =========================================================================
void loop() {
  // 1. Handle incoming Serial commands from Arduino Mega (non-blocking)
  handleSerialInput();

  // 2. Handle HTTP server requests (non-blocking)
  server.handleClient();

  // 3. Continuous capture loop (1 image/second when active)
  if (g_isCapturing && g_cameraReady) {
    unsigned long now = millis();
    if (now - g_lastCaptureTime >= CAPTURE_INTERVAL_MS) {
      g_lastCaptureTime = now;
      captureAndUpload(g_activeCompartment, "DURING");
    }
  }

  // 4. Wi-Fi auto-reconnect (non-blocking)
  if (!g_wifiConnected) {
    unsigned long now = millis();
    if (now - g_lastWifiAttempt >= WIFI_RECONNECT_MS) {
      g_lastWifiAttempt = now;
      reconnectWiFi();
    }
  }

  // Small yield to prevent WDT reset
  yield();
}

// =========================================================================
// CAMERA INITIALIZATION
// =========================================================================
void initCamera() {
  Serial.println("[CAM] Initializing camera...");

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = CAMERA_XCLK_FREQ;  // Low frequency for stability
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = CAMERA_FRAME_SIZE;
  config.jpeg_quality = JPEG_QUALITY;
  config.fb_count = 1;  // Single frame buffer to minimize memory usage

  // Attempt camera initialization
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("[CAM] ERROR: Camera init failed (0x%x)\n", err);
    Serial.println("[CAM] Check: Camera ribbon cable seated properly?");
    g_cameraReady = false;
    return;
  }

  // Adjust sensor settings for indoor medicine dispenser use
  sensor_t *s = esp_camera_sensor_get();
  if (s) {
    s->set_brightness(s, 1);     // Slightly brighter
    s->set_contrast(s, 1);       // Slightly more contrast
    s->set_whitebal(s, 1);       // Auto white balance ON
    s->set_awb_gain(s, 1);       // AWB gain ON
    s->set_exposure_ctrl(s, 1);  // Auto exposure ON
    s->set_gain_ctrl(s, 1);      // Auto gain ON
  }

  g_cameraReady = true;
  Serial.println("[CAM] Camera initialized successfully");
}

// =========================================================================
// WI-FI INITIALIZATION
// =========================================================================
void initWiFi() {
  Serial.print("[WIFI] Connecting to: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Wait up to 15 seconds for initial connection (blocking only during setup)
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    g_wifiConnected = true;
    Serial.println("[WIFI] Connected!");
    Serial.print("[WIFI] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WIFI] Signal Strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");

    // Blink LED to signal successful connection
    blinkLED(3, 200);
  } else {
    g_wifiConnected = false;
    Serial.println("[WIFI] Connection failed — will retry in background");
  }
}

// =========================================================================
// WI-FI RECONNECT (non-blocking, called from loop)
// =========================================================================
void reconnectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    g_wifiConnected = true;
    return;
  }

  Serial.println("[WIFI] Attempting reconnect...");
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Non-blocking: just start the connection, check next loop cycle
  // WiFi.status() will update asynchronously
  delay(100); // Minimal delay to let WiFi stack start

  if (WiFi.status() == WL_CONNECTED) {
    g_wifiConnected = true;
    Serial.print("[WIFI] Reconnected! IP: ");
    Serial.println(WiFi.localIP());
    blinkLED(2, 150);
  } else {
    g_wifiConnected = false;
    Serial.println("[WIFI] Still disconnected, will retry...");
  }
}

// =========================================================================
// HTTP SERVER INITIALIZATION
// =========================================================================
void initHTTPServer() {
  // GET /status — Returns JSON with device status
  server.on("/status", HTTP_GET, handleStatus);

  // GET /capture — On-demand single capture (for testing)
  server.on("/capture", HTTP_GET, handleCapture);

  // POST /set_session — Configure patient and session info from dashboard
  server.on("/set_session", HTTP_POST, handleSetSession);

  // Handle CORS preflight
  server.on("/set_session", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(204);
  });

  server.begin();
  Serial.println("[HTTP] Server started on port 80");
}

// --- GET /status ---
void handleStatus() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  String json = "{";
  json += "\"device\":\"" + String(DEVICE_NAME) + "\",";
  json += "\"cameraReady\":" + String(g_cameraReady ? "true" : "false") + ",";
  json += "\"wifiConnected\":" + String(g_wifiConnected ? "true" : "false") + ",";
  json += "\"rssi\":" + String(WiFi.RSSI()) + ",";
  json += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
  json += "\"isCapturing\":" + String(g_isCapturing ? "true" : "false") + ",";
  json += "\"activeCompartment\":" + String(g_activeCompartment) + ",";
  json += "\"patientId\":\"" + g_patientId + "\",";
  json += "\"sessionName\":\"" + g_sessionName + "\",";
  json += "\"captureCount\":" + String(g_captureCount) + ",";
  json += "\"freeHeap\":" + String(ESP.getFreeHeap()) + ",";
  json += "\"uptimeMs\":" + String(millis());
  json += "}";

  server.send(200, "application/json", json);
}

// --- GET /capture ---
void handleCapture() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  if (!g_cameraReady) {
    server.send(503, "application/json", "{\"error\":\"Camera not initialized\"}");
    return;
  }

  // Capture a single frame
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    server.send(500, "application/json", "{\"error\":\"Capture failed\"}");
    return;
  }

  // Return the JPEG image directly
  server.sendHeader("Content-Disposition", "inline; filename=capture.jpg");
  server.setContentLength(fb->len);
  server.send(200, "image/jpeg", "");
  server.sendContent((const char *)fb->buf, fb->len);
  esp_camera_fb_return(fb);
}

// --- POST /set_session ---
void handleSetSession() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  // Parse form fields or URL parameters
  if (server.hasArg("patientId")) {
    g_patientId = server.arg("patientId");
  }
  if (server.hasArg("sessionName")) {
    g_sessionName = server.arg("sessionName");
  }

  Serial.println("[SESSION] Configuration updated:");
  Serial.println("  Patient ID: " + g_patientId);
  Serial.println("  Session: " + g_sessionName);

  String json = "{";
  json += "\"success\":true,";
  json += "\"patientId\":\"" + g_patientId + "\",";
  json += "\"sessionName\":\"" + g_sessionName + "\"";
  json += "}";

  server.send(200, "application/json", json);
}

// =========================================================================
// SERIAL INPUT HANDLING (non-blocking)
// =========================================================================
void handleSerialInput() {
  while (Serial.available() > 0) {
    char c = Serial.read();

    if (c == '\n') {
      // Process the complete command
      g_serialBuffer.trim();
      if (g_serialBuffer.length() > 0) {
        processSerialCommand(g_serialBuffer);
      }
      g_serialBuffer = "";
    } else if (c != '\r') {
      // Accumulate characters (ignore carriage return)
      g_serialBuffer += c;

      // Safety: prevent buffer overflow from garbage data
      if (g_serialBuffer.length() > 60) {
        Serial.println("[SERIAL] WARNING: Buffer overflow, clearing");
        g_serialBuffer = "";
      }
    }
  }
}

// =========================================================================
// SERIAL COMMAND PROCESSOR
// =========================================================================
void processSerialCommand(String cmd) {
  cmd.trim();
  if (cmd.length() == 0) return;

  // --- LOOP PREVENTION ---
  // Ignore messages that are not commands (replies from the Mega)
  if (cmd.startsWith("DEBUG") || cmd.startsWith("ACK") || cmd.startsWith("ERR") || cmd.startsWith("[")) {
    return; 
  }

  Serial.println("[CMD] Received: " + cmd);

  // --- TAKE_BEFORE_X ---
  if (cmd.startsWith("TAKE_BEFORE_")) {
    int compartment = cmd.substring(12).toInt();
    if (compartment >= 1 && compartment <= 4) {
      Serial.printf("[CMD] Taking BEFORE image for compartment %d\n", compartment);
      captureAndUpload(compartment, "BEFORE");
    } else {
      Serial.println("[CMD] ERROR: Invalid compartment number");
    }
  }

  // --- TAKE_AFTER_X ---
  else if (cmd.startsWith("TAKE_AFTER_")) {
    int compartment = cmd.substring(11).toInt();
    if (compartment >= 1 && compartment <= 4) {
      Serial.printf("[CMD] Taking AFTER image for compartment %d\n", compartment);
      captureAndUpload(compartment, "AFTER");
    } else {
      Serial.println("[CMD] ERROR: Invalid compartment number");
    }
  }

  // --- START_SESSION_X ---
  else if (cmd.startsWith("START_SESSION_")) {
    int compartment = cmd.substring(14).toInt();
    if (compartment >= 1 && compartment <= 4) {
      Serial.printf("[CMD] Starting continuous capture for compartment %d\n", compartment);
      g_activeCompartment = compartment;
      g_isCapturing = true;
      g_captureCount = 0;
      g_lastCaptureTime = millis() - CAPTURE_INTERVAL_MS; // Capture immediately

      // Auto-generate session name if not set by dashboard
      if (g_sessionName.length() == 0) {
        g_sessionName = generateSessionName();
        Serial.println("[CMD] Auto-generated session: " + g_sessionName);
      }
    } else {
      Serial.println("[CMD] ERROR: Invalid compartment number");
    }
  }

  // --- END_SESSION_X ---
  else if (cmd.startsWith("END_SESSION_")) {
    int compartment = cmd.substring(12).toInt();
    if (compartment >= 1 && compartment <= 4) {
      Serial.printf("[CMD] Ending capture session for compartment %d\n", compartment);
      Serial.printf("[CMD] Total images captured: %lu\n", g_captureCount);
      g_isCapturing = false;
      g_activeCompartment = 0;
      // Don't clear session name yet — TAKE_AFTER will still use it
    } else {
      Serial.println("[CMD] ERROR: Invalid compartment number");
    }
  }

  // --- STATUS (debug command) ---
  else if (cmd == "STATUS") {
    printStatus();
  }

  // --- Unknown command ---
  else {
    Serial.println("[CMD] WARNING: Unknown command: " + cmd);
  }
}

// =========================================================================
// CAPTURE AND UPLOAD
// =========================================================================
void captureAndUpload(int compartment, String imageType) {
  // --- Pre-flight checks ---
  if (!g_cameraReady) {
    Serial.println("[CAM] ERROR: Camera not ready, skipping capture");
    return;
  }

  // Flash LED briefly during capture (visual feedback)
  digitalWrite(LED_BUILTIN_PIN, LOW); // LED ON (active low)

  // --- Capture image ---
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("[CAM] ERROR: Frame capture failed");
    digitalWrite(LED_BUILTIN_PIN, HIGH); // LED OFF
    return;
  }

  g_captureCount++;
  Serial.printf("[CAM] Captured %s image: %d bytes (total: %lu)\n",
                imageType.c_str(), fb->len, g_captureCount);

  // --- Upload to server ---
  if (g_wifiConnected && WiFi.status() == WL_CONNECTED) {
    uploadImage(fb, compartment, imageType);
  } else {
    Serial.println("[UPLOAD] WARNING: Wi-Fi not connected, image not uploaded");
    g_wifiConnected = false; // Trigger reconnect
  }

  // Release the frame buffer
  esp_camera_fb_return(fb);

  // Turn LED off
  digitalWrite(LED_BUILTIN_PIN, HIGH);
}

// =========================================================================
// HTTP IMAGE UPLOAD
// =========================================================================
void uploadImage(camera_fb_t *fb, int compartment, String imageType) {
  HTTPClient http;
  
  // Build the upload URL
  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/upload";

  Serial.print("[UPLOAD] Sending to: ");
  Serial.println(url);

  http.begin(url);
  http.setTimeout(HTTP_TIMEOUT_MS);

  // --- Build multipart/form-data body ---
  String boundary = "----HEALERBoundary" + String(millis());
  String contentType = "multipart/form-data; boundary=" + boundary;

  // Generate timestamp in DD-MM-YYYY HH-MM-SS format
  String timestamp = getFormattedTimestamp();

  // Use configured patientId or fallback
  String patientId = g_patientId.length() > 0 ? g_patientId : "unknown";
  String sessionName = g_sessionName.length() > 0 ? g_sessionName : generateSessionName();

  // Build the multipart body parts (text fields)
  String bodyStart = "";
  bodyStart += "--" + boundary + "\r\n";
  bodyStart += "Content-Disposition: form-data; name=\"patientId\"\r\n\r\n";
  bodyStart += patientId + "\r\n";

  bodyStart += "--" + boundary + "\r\n";
  bodyStart += "Content-Disposition: form-data; name=\"compartmentNumber\"\r\n\r\n";
  bodyStart += String(compartment) + "\r\n";

  bodyStart += "--" + boundary + "\r\n";
  bodyStart += "Content-Disposition: form-data; name=\"imageType\"\r\n\r\n";
  bodyStart += imageType + "\r\n";

  bodyStart += "--" + boundary + "\r\n";
  bodyStart += "Content-Disposition: form-data; name=\"sessionName\"\r\n\r\n";
  bodyStart += sessionName + "\r\n";

  bodyStart += "--" + boundary + "\r\n";
  bodyStart += "Content-Disposition: form-data; name=\"timestamp\"\r\n\r\n";
  bodyStart += timestamp + "\r\n";

  // Image file part header
  bodyStart += "--" + boundary + "\r\n";
  bodyStart += "Content-Disposition: form-data; name=\"image\"; filename=\"capture.jpg\"\r\n";
  bodyStart += "Content-Type: image/jpeg\r\n\r\n";

  // Closing boundary
  String bodyEnd = "\r\n--" + boundary + "--\r\n";

  // Calculate total content length
  int totalLen = bodyStart.length() + fb->len + bodyEnd.length();

  // Set headers
  http.addHeader("Content-Type", contentType);
  http.addHeader("Content-Length", String(totalLen));

  // --- Send the request using a stream approach ---
  // We need to send the body in parts because the image is too large for a single String
  
  // Create a buffer with all parts
  uint8_t *payload = (uint8_t *)malloc(totalLen);
  if (!payload) {
    Serial.println("[UPLOAD] ERROR: Not enough memory for upload payload");
    http.end();
    return;
  }

  // Copy parts into the buffer
  int offset = 0;
  memcpy(payload + offset, bodyStart.c_str(), bodyStart.length());
  offset += bodyStart.length();
  memcpy(payload + offset, fb->buf, fb->len);
  offset += fb->len;
  memcpy(payload + offset, bodyEnd.c_str(), bodyEnd.length());

  // Send POST request
  int httpCode = http.POST(payload, totalLen);

  // Free the payload buffer
  free(payload);

  // Handle response
  if (httpCode > 0) {
    if (httpCode == 200 || httpCode == 201) {
      String response = http.getString();
      Serial.println("[UPLOAD] Success: " + response);
    } else {
      Serial.printf("[UPLOAD] ERROR: Server returned HTTP %d\n", httpCode);
      String response = http.getString();
      Serial.println("[UPLOAD] Response: " + response);
    }
  } else {
    Serial.printf("[UPLOAD] ERROR: Connection failed (%s)\n",
                  http.errorToString(httpCode).c_str());
    Serial.println("[UPLOAD] Check: Is the server running? Is the IP correct?");
  }

  http.end();
}

// =========================================================================
// UTILITY FUNCTIONS
// =========================================================================

/**
 * Generate a session name in the format: DIAGNOSIS SESSION DD-MM-YYYY HH-MM-SS
 * Note: ESP32 doesn't have an RTC, so we use millis()-based incrementing time
 *       unless NTP is configured. For now, generates a unique identifier.
 */
String generateSessionName() {
  // Without NTP, we use a millis-based approach for uniqueness
  unsigned long ms = millis();
  unsigned long seconds = ms / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;

  // Format as a readable session name
  String name = "DIAGNOSIS SESSION ";
  name += "00-00-0000 ";  // Date placeholder (set by server if needed)
  name += String(hours % 24) + "-";
  name += String(minutes % 60) + "-";
  name += String(seconds % 60);

  return name;
}

/**
 * Get a formatted timestamp string
 */
String getFormattedTimestamp() {
  unsigned long ms = millis();
  return String(ms);  // Server will use its own clock for proper timestamps
}

/**
 * Print full status to Serial (for debugging)
 */
void printStatus() {
  Serial.println("--- H.E.A.L.E.R ESP32-CAM Status ---");
  Serial.print("  Camera: ");
  Serial.println(g_cameraReady ? "READY" : "NOT READY");
  Serial.print("  Wi-Fi: ");
  Serial.println(g_wifiConnected ? "CONNECTED" : "DISCONNECTED");
  if (g_wifiConnected) {
    Serial.print("  IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("  RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  }
  Serial.print("  Capturing: ");
  Serial.println(g_isCapturing ? "YES" : "NO");
  Serial.print("  Compartment: ");
  Serial.println(g_activeCompartment);
  Serial.print("  Patient: ");
  Serial.println(g_patientId.length() > 0 ? g_patientId : "(not set)");
  Serial.print("  Session: ");
  Serial.println(g_sessionName.length() > 0 ? g_sessionName : "(not set)");
  Serial.print("  Images this session: ");
  Serial.println(g_captureCount);
  Serial.print("  Free Heap: ");
  Serial.println(ESP.getFreeHeap());
  Serial.println("-----------------------------------");
}

/**
 * Blink the built-in LED (active low on AI-Thinker)
 */
void blinkLED(int count, int ms) {
  for (int i = 0; i < count; i++) {
    digitalWrite(LED_BUILTIN_PIN, LOW);   // ON
    delay(ms);
    digitalWrite(LED_BUILTIN_PIN, HIGH);  // OFF
    if (i < count - 1) delay(ms);
  }
}
