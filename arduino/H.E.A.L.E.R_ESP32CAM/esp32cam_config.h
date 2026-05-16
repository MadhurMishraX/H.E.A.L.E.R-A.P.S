/*
 * H.E.A.L.E.R - ESP32-CAM Configuration File
 * =============================================
 * 
 * This file contains all user-configurable settings for the ESP32-CAM module.
 * Change the values below BEFORE uploading the firmware to your ESP32-CAM.
 * 
 * This file is excluded from version control (.gitignore) so your
 * network credentials stay private.
 * 
 * HOW TO USE:
 * 1. Copy this file or edit it directly.
 * 2. Set your Wi-Fi network name (SSID). Must be an open network (no password).
 * 3. Set the IP address of the laptop running the H.E.A.L.E.R backend server.
 * 4. Upload the sketch to ESP32-CAM via Arduino IDE.
 * 
 * FINDING YOUR LAPTOP'S IP:
 *   Windows: Open CMD → type "ipconfig" → look for "IPv4 Address" under your Wi-Fi adapter
 *   Example: 192.168.1.100
 */

#ifndef ESP32CAM_CONFIG_H
#define ESP32CAM_CONFIG_H

// ===== WI-FI SETTINGS =====
// The name of your open Wi-Fi network (no password required)
#define WIFI_SSID          "YOUR_NETWORK_NAME"

// Leave empty for open networks. Only set if your network has a password.
#define WIFI_PASSWORD      ""

// ===== SERVER SETTINGS =====
// The IP address of the laptop/PC running the H.E.A.L.E.R backend server
// Find this by running "ipconfig" (Windows) or "ifconfig" (Mac/Linux)
#define SERVER_IP          "192.168.1.100"

// The port the backend server is running on (default: 3001)
#define SERVER_PORT        3001

// ===== DEVICE SETTINGS =====
// mDNS hostname — the ESP32-CAM will be reachable at http://healer-cam.local
#define MDNS_HOSTNAME      "healer-cam"

// Device name shown in Serial output
#define DEVICE_NAME        "HEALER-CAM"

// ===== CAMERA SETTINGS =====
// Capture interval during continuous session (milliseconds)
// 1000 = 1 image per second (as required)
#define CAPTURE_INTERVAL_MS  1000

// HTTP upload timeout (milliseconds)
// If upload takes longer than this, it will be aborted
#define HTTP_TIMEOUT_MS      5000

// Wi-Fi reconnect interval (milliseconds)
#define WIFI_RECONNECT_MS    5000

// Serial baud rate — MUST match Arduino Mega's Serial1 baud rate
#define SERIAL_BAUD_RATE     9600

// Camera XCLK frequency (Hz) — Lower = more stable but slower
// 5MHz for ultra-stable mode, 10MHz for faster capture
#define CAMERA_XCLK_FREQ     5000000

// JPEG quality (0-63, lower = better quality but larger file)
// 12 = good quality for medical imaging, ~30-50KB per frame at QVGA
#define JPEG_QUALITY          12

// Frame size: FRAMESIZE_QVGA (320x240), FRAMESIZE_VGA (640x480), FRAMESIZE_SVGA (800x600)
// Use QVGA for stability and speed, VGA for better image quality
#define CAMERA_FRAME_SIZE     FRAMESIZE_VGA

#endif // ESP32CAM_CONFIG_H
