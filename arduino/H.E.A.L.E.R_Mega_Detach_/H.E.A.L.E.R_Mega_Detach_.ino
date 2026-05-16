/*
 * H.E.A.L.E.R - Arduino Mega Firmware
 * ------------------------------------
 * IMPORTANT: In Arduino IDE, go to Tools -> Board and select "Arduino Mega or Mega 2560".
 * REQUIRED LIBRARIES: Servo, SPI, MFRC522 (Install via Library Manager).
 */

#include <Servo.h>
#include <SPI.h>
#include <MFRC522.h>
#include <avr/wdt.h>

// --- Configuration ---
// Individual Angles for each servo [1, 2, 3, 4, FA]
// If a door moves the WRONG way, just swap the OPEN and CLOSE numbers for that door!
// [Door 1, Door 2, Door 3, Door 4, First Aid]
const int OPEN_ANGLES[]  = {40, 40, 155, 155, 40}; //
const int CLOSE_ANGLES[] = {155, 155, 40, 40, 155};

const int BAUD_RATE = 9600;
unsigned long lastRFIDCheck = 0;
const int RFID_INTERVAL = 100; // Check every 100ms

// --- Pin Assignments ---
const int SERVO_PINS[] = {6, 7, 8, 9, 10}; // CP 1, 2, 3, 4, FA (First Aid)
const int CAM_TRIGGER_PIN = 22;
const int RFID_RST_PIN = 5;
const int RFID_SS_PIN = 53; // Mega SS pin
const int LED_PIN = 13;

// --- Global Objects ---
Servo servos[5];
MFRC522 mfrc522(RFID_SS_PIN, RFID_RST_PIN);

// String buffer for serial commands
String inputString = "";

void setup() {
  // 1. Initialize Serial
  Serial.begin(BAUD_RATE);  // For USB Debugging
  Serial1.begin(BAUD_RATE); // For ESP32-CAM (Pins 18/19)
  inputString.reserve(50);

  // 2. Initialize Servos (Pin Grounding for Smart Detach)
  for (int i = 0; i < 5; i++) {
    pinMode(SERVO_PINS[i], OUTPUT);
    digitalWrite(SERVO_PINS[i], LOW); // Keep signal at 0V to prevent startup twitching
  }
  delay(1000); // Wait for power to stabilize

  // 3. Initialize CAM Trigger
  pinMode(CAM_TRIGGER_PIN, OUTPUT);
  digitalWrite(CAM_TRIGGER_PIN, LOW);

  // 4. Initialize LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // 5. Initialize RFID (SPI)
  SPI.begin();
  mfrc522.PCD_Init();

  // 6. Signal Readiness
  Serial.println("ARDUINO_READY");
  blinkLED(3, 100); // 3 quick blinks on start
}

void loop() {
  // A. Check for Serial Commands
  handleSerial();

  // B. Poll for RFID (Throttled)
  if (millis() - lastRFIDCheck >= RFID_INTERVAL) {
    checkRFID();
    lastRFIDCheck = millis();
  }
}

/**
 * Handle incoming serial data
 */
void handleSerial() {
  // Listen to USB (Serial)
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    handleChar(inChar);
  }

  // Listen to Bluetooth (Serial1)
  while (Serial1.available()) {
    char inChar = (char)Serial1.read();
    handleChar(inChar);
  }
}

void handleChar(char inChar) {
  if (inChar == '\n') {
    processCommand(inputString);
    inputString = "";
  } else {
    if (inChar != '\r') {
      inputString += inChar;
    }
  }
}

/**
 * Process received command string
 */
void processCommand(String cmd) {
  cmd.trim();
  sendResponse("DEBUG_RECV: [" + cmd + "]");
  
  if (cmd == "OPEN_1") { openServo(0); }
  else if (cmd == "OPEN_2") { openServo(1); }
  else if (cmd == "OPEN_3") { openServo(2); }
  else if (cmd == "OPEN_4") { openServo(3); }
  else if (cmd == "OPEN_FA") { openFAServo(); }
  
  else if (cmd == "CLOSE_1") { closeServo(0); }
  else if (cmd == "CLOSE_2") { closeServo(1); }
  else if (cmd == "CLOSE_3") { closeServo(2); }
  else if (cmd == "CLOSE_4") { closeServo(3); }
  else if (cmd == "CLOSE_FA") { closeFAServo(); }
  
  else if (cmd == "CAM_ON") {
    digitalWrite(CAM_TRIGGER_PIN, HIGH);
    sendResponse("ACK_CAM_ON");
  }
  else if (cmd == "CAM_OFF") {
    digitalWrite(CAM_TRIGGER_PIN, LOW);
    sendResponse("ACK_CAM_OFF");
  }
  
  else if (cmd == "OPEN_ALL") {
    for (int i = 0; i < 5; i++) {
      servos[i].attach(SERVO_PINS[i]);
      servos[i].write(OPEN_ANGLES[i]);
      delay(500); 
      servos[i].detach();
    }
    sendResponse("ACK_OPEN_ALL");
  }
  else if (cmd == "CLOSE_ALL") {
    for (int i = 0; i < 5; i++) {
      servos[i].attach(SERVO_PINS[i]);
      servos[i].write(CLOSE_ANGLES[i]);
      delay(500); 
      servos[i].detach();
    }
    sendResponse("ACK_CLOSE_ALL");
  }
  
  else if (cmd == "REBOOT") {
    sendResponse("ACK_REBOOTING...");
    delay(100);
    wdt_enable(WDTO_15MS); // Suicide timer for reboot
    while(1); // Wait for the dog to bite
  }
  
  else if (cmd.length() > 0) {
    sendResponse("ERR_UNKNOWN_CMD");
  }
}

void sendResponse(String msg) {
  Serial.println(msg);  // Send to USB
  Serial1.println(msg); // Send to Bluetooth
}

/**
 * Control logic for single servo open
 */
void openServo(int index) {
  servos[index].attach(SERVO_PINS[index]); 
  servos[index].write(OPEN_ANGLES[index]);
  delay(400); 
  servos[index].detach(); 
  
  // Send camera commands to ESP32-CAM via Serial1
  // TAKE_BEFORE: capture one image before the compartment is fully open
  Serial1.println("TAKE_BEFORE_" + String(index + 1));
  delay(100); // Brief gap so ESP32 can process
  // START_SESSION: begin continuous 1fps capture while compartment is open
  Serial1.println("START_SESSION_" + String(index + 1));
  
  sendResponse("ACK_OPEN_" + String(index + 1));
  blinkLED(2, 200);
}

void closeServo(int index) {
  // END_SESSION: stop continuous capture before closing
  Serial1.println("END_SESSION_" + String(index + 1));
  delay(100); // Brief gap so ESP32 can process
  
  servos[index].attach(SERVO_PINS[index]);
  servos[index].write(CLOSE_ANGLES[index]);
  delay(800); 
  servos[index].detach();
  
  // TAKE_AFTER: capture one image after compartment has closed
  Serial1.println("TAKE_AFTER_" + String(index + 1));
  
  sendResponse("ACK_CLOSE_" + String(index + 1));
  blinkLED(1, 200);
}

/**
 * Control logic for First Aid servo open
 */
void openFAServo() {
  servos[4].attach(SERVO_PINS[4]);
  servos[4].write(OPEN_ANGLES[4]);
  delay(400);
  servos[4].detach();
  sendResponse("ACK_OPEN_FA");
  blinkLED(2, 200); 
}

/**
 * Control logic for First Aid servo close
 */
void closeFAServo() {
  servos[4].attach(SERVO_PINS[4]);
  servos[4].write(CLOSE_ANGLES[4]);
  delay(800);
  servos[4].detach();
  sendResponse("ACK_CLOSE_FA");
  blinkLED(1, 200);
}

/**
 * Poll for RFID card presence
 */
void checkRFID() {
  // Look for new cards
  if ( ! mfrc522.PICC_IsNewCardPresent()) return;
  // Select one of the cards
  if ( ! mfrc522.PICC_ReadCardSerial()) return;

  // Signal detection to both USB and App
  sendResponse("RFID_DETECTED");
  blinkLED(2, 100);

  // Stop crypto on PICC
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}

/**
 * Helper to blink the onboard LED
 */
void blinkLED(int count, int ms) {
  for (int i = 0; i < count; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(ms);
    digitalWrite(LED_PIN, LOW);
    if (i < count - 1) delay(ms);
  }
}
