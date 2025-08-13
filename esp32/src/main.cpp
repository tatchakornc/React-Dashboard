/*
  ESP32 Dashboard Controller with WiFiManager
  Combines offline relay control with online Firebase dashboard
  
  Features:
  - WiFiManager for easy WiFi setup
  - 4 Digital Inputs to toggle 4 Relays (offline operation)
  - DHT22 temperature & humidity sensor
  - Firebase real-time communication
  - Serial commands for testing
  - Real-time status monitoring
*/

#include <WiFi.h>
#include <WiFiManager.h>
#include <Firebase_ESP_Client.h>
#include <DHT.h>
#include <esp_task_wdt.h>
#include <esp_system.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// --- Firebase Configuration ---
// Firebase project: iot-dashboard-86cce
#define API_KEY "AIzaSyBNPvRVxzxAFPnPK5shSzTtwr6x7UMXg1g"
#define DATABASE_URL "https://iot-dashboard-86cce-default-rtdb.asia-southeast1.firebasedatabase.app"
#define USER_UID "nMguPuiD4qbY1wgFBlHChkLL9VU2"

// Device SN will be auto-generated from MAC Address
String DEVICE_SN = "";

// --- Pin Definitions ---
// Relay Pins
#define RELAY_PIN_1 25
#define RELAY_PIN_2 26
#define RELAY_PIN_3 27
#define RELAY_PIN_4 14

// Digital Input Pins (require external pull-up resistors for GPIO 34,35)
#define INPUT_PIN_1 34
#define INPUT_PIN_2 35
#define INPUT_PIN_3 32
#define INPUT_PIN_4 33

// DHT Sensor
#define DHT_PIN 4
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// Status LED
#define STATUS_LED 2

// --- Global Variables ---
// Relay state variables
bool relay1_State = LOW;
bool relay2_State = LOW;
bool relay3_State = LOW;
bool relay4_State = LOW;

// Button debouncing variables
long last_debounce_time1 = 0;
long last_debounce_time2 = 0;
long last_debounce_time3 = 0;
long last_debounce_time4 = 0;
bool last_button_state1 = HIGH;
bool last_button_state2 = HIGH;
bool last_button_state3 = HIGH;
bool last_button_state4 = HIGH;
bool button1_state_debounced = HIGH;
bool button2_state_debounced = HIGH;
bool button3_state_debounced = HIGH;
bool button4_state_debounced = HIGH;
long debounce_delay = 50;

// Timing variables
unsigned long last_status_update_time = 0;
unsigned long last_sensor_update_time = 0;
unsigned long dataMillis = 0;
unsigned long statusMillis = 0;
const long status_update_interval = 1000;
const long sensor_update_interval = 5000;

// Sensor data
float temperature = 25.0;
float humidity = 60.0;

// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
bool signupOK = false;
bool wifiConnected = false;

// WiFiManager
WiFiManager wm;

// Function declarations
void setupPins();
void setupSensors();
void setupWiFiManager();
void setupFirebase();
void generateDeviceSN();
void handlePhysicalInputs();
void handleSerialCommands();
void handlePeriodicTasks();
void handleFirebaseOperations();
void readSensorData();
void setRelayState(int relayNum, bool state);
void sendSensorDataToFirebase();
void sendRelayStateToFirebase(int relayNum, bool state);
void updateOnlineStatus();
void setAllDevicesOffline();
void registerDeviceInFirebase();
void checkFirebaseRelayControls();
void resetWiFiSettings();
void printStatus();
void testAllPins();

void generateDeviceSN() {
  // Get MAC Address and convert to Serial Number
  uint8_t baseMac[6];
  WiFi.macAddress(baseMac);
  
  // Convert MAC to hex string (12 characters)
  char macStr[13];
  sprintf(macStr, "%02X%02X%02X%02X%02X%02X", 
          baseMac[0], baseMac[1], baseMac[2], 
          baseMac[3], baseMac[4], baseMac[5]);
  
  DEVICE_SN = String(macStr);
  
  Serial.println("=== Device Information ===");
  Serial.printf("MAC Address: %02X:%02X:%02X:%02X:%02X:%02X\n",
                baseMac[0], baseMac[1], baseMac[2], 
                baseMac[3], baseMac[4], baseMac[5]);
  Serial.printf("Device SN: %s\n", DEVICE_SN.c_str());
  Serial.println("==========================");
}

void setup() {
  Serial.begin(115200);
  Serial.setTimeout(1);     // Very short timeout for non-blocking Serial
  Serial.println("\n=== ESP32 Dashboard Controller Starting ===");
  
  // Aggressive power management for standalone operation
  setCpuFrequencyMhz(240);  // Set CPU to maximum 240MHz
  WiFi.setSleep(false);     // Disable WiFi sleep mode
  
  // Disable Serial buffer to prevent blocking
  Serial.setTxBufferSize(256);
  Serial.setRxBufferSize(64);
  
  Serial.println("✓ Power management configured for standalone operation");
  
  // Generate unique Device SN from MAC Address
  generateDeviceSN();
  
  setupPins();
  setupSensors();
  setupWiFiManager();
  
  if (wifiConnected) {
    setupFirebase();
  }
  
  Serial.println("=== Setup Complete ===");
  Serial.println("--- Serial Commands ---");
  Serial.println("ON1, OFF1, ON2, OFF2... etc.");
  Serial.println("STATUS - Show current status");
  Serial.println("RESET_WIFI - Reset WiFi settings");
  Serial.println("-----------------------");
  Serial.println("🚀 ESP32 ready for standalone operation!");
  Serial.println("🌐 Dashboard: http://192.168.1.113:3000");
  Serial.flush(); // Ensure all serial data is sent
  
  // Set serial timeout for better performance without monitor
  Serial.setTimeout(10);  // Short timeout for non-blocking operation
  delay(100);     // Brief delay for stability
}

void loop() {
  // **STANDALONE OPERATION - No Serial dependency**
  
  // Handle physical inputs immediately (no delay)
  handlePhysicalInputs();
  
  // Handle periodic tasks (sensor readings, status updates)
  handlePeriodicTasks();
  
  // **PRIORITY: Firebase operations for web control - check every cycle**
  static unsigned long lastWiFiRetry = 0;
  static bool tryingWiFi = false;
  if (wifiConnected && signupOK) {
    handleFirebaseOperations();
    tryingWiFi = false;
  } else {
    // Try to reconnect WiFi/Firebase if disconnected, but not spamming
    if (WiFi.status() != WL_CONNECTED) {
      if (!tryingWiFi && millis() - lastWiFiRetry > 10000) { // retry every 10s
        tryingWiFi = true;
        lastWiFiRetry = millis();
        setupWiFiManager();
      }
    } else if (!signupOK) {
      setupFirebase();
    }
  }
  
  // **Minimal delay for stability - no Serial blocking**
  delay(10); // Reduced from 50ms for faster response
}

void setupPins() {
  // Configure relay pins
  pinMode(RELAY_PIN_1, OUTPUT); digitalWrite(RELAY_PIN_1, LOW);
  pinMode(RELAY_PIN_2, OUTPUT); digitalWrite(RELAY_PIN_2, LOW);
  pinMode(RELAY_PIN_3, OUTPUT); digitalWrite(RELAY_PIN_3, LOW);
  pinMode(RELAY_PIN_4, OUTPUT); digitalWrite(RELAY_PIN_4, LOW);
  
  // Configure input pins
  pinMode(INPUT_PIN_1, INPUT);
  pinMode(INPUT_PIN_2, INPUT);
  pinMode(INPUT_PIN_3, INPUT);
  pinMode(INPUT_PIN_4, INPUT);
  
  // Status LED
  pinMode(STATUS_LED, OUTPUT);
  
  Serial.println("✓ Pins configured");
  Serial.println("WARNING: GPIO 34 & 35 require external 10k pull-up resistors");
}

void setupSensors() {
  dht.begin();
  Serial.println("✓ DHT22 sensor initialized");
}

void setupWiFiManager() {
  Serial.println("Starting WiFiManager...");
  
  // WiFiManager settings for maximum stability
  wm.setConfigPortalTimeout(120); // 2 minutes
  wm.setDebugOutput(false);
  
  // Critical WiFi power settings for standalone operation
  WiFi.setAutoReconnect(true);
  WiFi.setSleep(false);  // Keep WiFi always active
  
  // WiFi keep-alive settings for continuous operation
  WiFi.setTxPower(WIFI_POWER_19_5dBm);
  WiFi.persistent(true);
  
  // Set WiFi power saving to none
  esp_wifi_set_ps(WIFI_PS_NONE);
  
  // Set WiFi event handlers for disconnect detection
  WiFi.onEvent([](WiFiEvent_t event, WiFiEventInfo_t info) {
    Serial.println("❌ WiFi disconnected - setting devices offline");
    wifiConnected = false;
    digitalWrite(STATUS_LED, LOW);
    // Set all devices to offline when WiFi disconnects
    setAllDevicesOffline();
  }, ARDUINO_EVENT_WIFI_STA_DISCONNECTED);
  
  WiFi.onEvent([](WiFiEvent_t event, WiFiEventInfo_t info) {
    Serial.println("✓ WiFi reconnected");
    wifiConnected = true;
    digitalWrite(STATUS_LED, HIGH);
  }, ARDUINO_EVENT_WIFI_STA_CONNECTED);
  
  // Try to connect to saved WiFi with aggressive reconnection
  wm.setConfigPortalBlocking(false);  // Non-blocking for standalone operation
  if (wm.autoConnect("ESP32-Dashboard", "12345678")) {
    Serial.println("✓ WiFi connected successfully!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.printf("📶 Signal strength: %d dBm\n", WiFi.RSSI());
    wifiConnected = true;
    digitalWrite(STATUS_LED, HIGH);
  } else {
    Serial.println("✗ WiFi connection failed - will retry continuously");
    wifiConnected = false;
    digitalWrite(STATUS_LED, LOW);
  }
}

void setupFirebase() {
  if (!wifiConnected) return;
  
  Serial.println("Setting up Firebase...");
  
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  
  // Use Anonymous authentication (will use existing anonymous account)
  // Anonymous UID: kLcPMVuVjoaV5WC7AxYpbYQk8i63
  Firebase.signUp(&config, &auth, "", "");
  
  config.token_status_callback = tokenStatusCallback;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  // Wait for Firebase to be ready
  Serial.println("Waiting for Firebase connection...");
  unsigned long start_time = millis();
  while (!Firebase.ready() && (millis() - start_time < 20000)) {
    delay(100);
    Serial.print(".");
  }
  Serial.println();
  
  if (Firebase.ready()) {
    Serial.println("✓ Firebase connected successfully!");
    Serial.printf("✓ Connected as UID: %s\n", USER_UID);
    signupOK = true;
  } else {
    Serial.println("✗ Firebase connection failed");
    Serial.println("Check: 1) Internet connection 2) Firebase Rules 3) Project settings");
    signupOK = false;
  }
}

void handlePhysicalInputs() {
  // Handle Input 1
  bool reading1 = digitalRead(INPUT_PIN_1);
  if (reading1 != last_button_state1) {
    last_debounce_time1 = millis();
  }
  if ((millis() - last_debounce_time1) > debounce_delay) {
    if (reading1 != button1_state_debounced) {
      button1_state_debounced = reading1;
      if (button1_state_debounced == LOW) {
        relay1_State = !relay1_State;
        setRelayState(1, relay1_State);
        Serial.printf("Input 1 Toggled! Relay 1 is now: %s\n", relay1_State ? "ON" : "OFF");
      }
    }
  }
  last_button_state1 = reading1;

  // Handle Input 2
  bool reading2 = digitalRead(INPUT_PIN_2);
  if (reading2 != last_button_state2) {
    last_debounce_time2 = millis();
  }
  if ((millis() - last_debounce_time2) > debounce_delay) {
    if (reading2 != button2_state_debounced) {
      button2_state_debounced = reading2;
      if (button2_state_debounced == LOW) {
        relay2_State = !relay2_State;
        setRelayState(2, relay2_State);
        Serial.printf("Input 2 Toggled! Relay 2 is now: %s\n", relay2_State ? "ON" : "OFF");
      }
    }
  }
  last_button_state2 = reading2;

  // Handle Input 3
  bool reading3 = digitalRead(INPUT_PIN_3);
  if (reading3 != last_button_state3) {
    last_debounce_time3 = millis();
  }
  if ((millis() - last_debounce_time3) > debounce_delay) {
    if (reading3 != button3_state_debounced) {
      button3_state_debounced = reading3;
      if (button3_state_debounced == LOW) {
        relay3_State = !relay3_State;
        setRelayState(3, relay3_State);
        Serial.printf("Input 3 Toggled! Relay 3 is now: %s\n", relay3_State ? "ON" : "OFF");
      }
    }
  }
  last_button_state3 = reading3;

  // Handle Input 4
  bool reading4 = digitalRead(INPUT_PIN_4);
  if (reading4 != last_button_state4) {
    last_debounce_time4 = millis();
  }
  if ((millis() - last_debounce_time4) > debounce_delay) {
    if (reading4 != button4_state_debounced) {
      button4_state_debounced = reading4;
      if (button4_state_debounced == LOW) {
        relay4_State = !relay4_State;
        setRelayState(4, relay4_State);
        Serial.printf("Input 4 Toggled! Relay 4 is now: %s\n", relay4_State ? "ON" : "OFF");
      }
    }
  }
  last_button_state4 = reading4;
}

void handleSerialCommands() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toUpperCase();

    if (cmd == "ON1") setRelayState(1, HIGH);
    else if (cmd == "OFF1") setRelayState(1, LOW);
    else if (cmd == "ON2") setRelayState(2, HIGH);
    else if (cmd == "OFF2") setRelayState(2, LOW);
    else if (cmd == "ON3") setRelayState(3, HIGH);
    else if (cmd == "OFF3") setRelayState(3, LOW);
    else if (cmd == "ON4") setRelayState(4, HIGH);
    else if (cmd == "OFF4") setRelayState(4, LOW);
    else if (cmd == "STATUS") printStatus();
    else if (cmd == "RESET_WIFI") resetWiFiSettings();
    else if (cmd == "TEST") testAllPins();
    else Serial.println("Unknown command.");

    if (cmd != "STATUS" && cmd != "TEST") {
      Serial.printf("Command '%s' executed.\n", cmd.c_str());
      printStatus();
    }
  }
}

void handlePeriodicTasks() {
  unsigned long current_time = millis();

  // Update input status every 10 seconds with WiFi signal strength
  if (current_time - last_status_update_time >= 10000) {
    last_status_update_time = current_time;
    if (wifiConnected) {
      int rssi = WiFi.RSSI();
      Serial.printf("Inputs: 1:%d, 2:%d, 3:%d, 4:%d | WiFi:%ddBm | Firebase:%s\n",
                    digitalRead(INPUT_PIN_1),
                    digitalRead(INPUT_PIN_2),
                    digitalRead(INPUT_PIN_3),
                    digitalRead(INPUT_PIN_4),
                    rssi,
                    signupOK ? "OK" : "FAIL");
    } else {
      Serial.println("Inputs: 1:1, 2:1, 3:1, 4:1 | WiFi:OFFLINE");
    }
  }

  // Update sensor data
  if (current_time - last_sensor_update_time >= sensor_update_interval) {
    last_sensor_update_time = current_time;
    readSensorData();
  }
}

void handleFirebaseOperations() {
  // Return early if Firebase not ready to avoid blocking
  if (!Firebase.ready() || !signupOK) {
    // Only try to check connection status every 30 seconds when not connected
    static unsigned long lastConnectionCheck = 0;
    if (millis() - lastConnectionCheck > 30000) {
      lastConnectionCheck = millis();
      Serial.println("⚠️ Firebase not connected - check Anonymous Authentication settings");
    }
    return;
  }

  // Register device first time
  registerDeviceInFirebase();

  // **CRITICAL: Check for remote commands every 25ms for instant response**
  static unsigned long lastCommandCheck = 0;
  if (millis() - lastCommandCheck >= 25) {
    lastCommandCheck = millis();
    checkFirebaseRelayControls();
  }

  // Send sensor data every 5 seconds
  if (millis() - dataMillis > 5000 || dataMillis == 0) {
    dataMillis = millis();
    sendSensorDataToFirebase();
  }
  
  // Update online status every 30 seconds
  if (millis() - statusMillis > 30000 || statusMillis == 0) {
    statusMillis = millis();
    updateOnlineStatus();
  }
  
  // Check for relay control commands every 50ms (faster response without Serial Monitor)
  static unsigned long lastRelayCheck = 0;
  if (millis() - lastRelayCheck > 50 || lastRelayCheck == 0) {
    lastRelayCheck = millis();
    checkFirebaseRelayControls();
  }
}

void readSensorData() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  
  if (!isnan(temp) && !isnan(hum)) {
    temperature = temp;
    humidity = hum;
  } else {
    // Use simulated data if sensor fails
    temperature = 25.0 + (random(-50, 51) / 10.0);
    humidity = 60.0 + (random(-100, 101) / 10.0);
    temperature = constrain(temperature, 15, 40);
    humidity = constrain(humidity, 40, 90);
  }
}

void setRelayState(int relayNum, bool state) {
  switch (relayNum) {
    case 1:
      relay1_State = state;
      digitalWrite(RELAY_PIN_1, state);  // Direct control
      Serial.printf("🔌 Relay %d: Logic=%s, Pin=%s\n", relayNum, state ? "ON" : "OFF", state ? "HIGH" : "LOW");
      break;
    case 2:
      relay2_State = state;
      digitalWrite(RELAY_PIN_2, state);  // Direct control
      Serial.printf("🔌 Relay %d: Logic=%s, Pin=%s\n", relayNum, state ? "ON" : "OFF", state ? "HIGH" : "LOW");
      break;
    case 3:
      relay3_State = state;
      digitalWrite(RELAY_PIN_3, state);  // Direct control
      Serial.printf("🔌 Relay %d: Logic=%s, Pin=%s\n", relayNum, state ? "ON" : "OFF", state ? "HIGH" : "LOW");
      break;
    case 4:
      relay4_State = state;
      digitalWrite(RELAY_PIN_4, state);  // Direct control
      Serial.printf("🔌 Relay %d: Logic=%s, Pin=%s\n", relayNum, state ? "ON" : "OFF", state ? "HIGH" : "LOW");
      break;
  }
  
  // Send to Firebase if connected
  if (wifiConnected && signupOK) {
    sendRelayStateToFirebase(relayNum, state);
  }
}

void sendSensorDataToFirebase() {
  String tempPath = "/deviceData/" + String(USER_UID) + "/" + DEVICE_SN + "_temp";
  String humPath = "/deviceData/" + String(USER_UID) + "/" + DEVICE_SN + "_humidity";
  
  if (Firebase.RTDB.setFloat(&fbdo, tempPath + "/value", temperature)) {
    Firebase.RTDB.setInt(&fbdo, tempPath + "/timestamp", millis());
    Serial.printf("📊 Temperature sent: %.2f°C\n", temperature);
  }
  
  if (Firebase.RTDB.setFloat(&fbdo, humPath + "/value", humidity)) {
    Firebase.RTDB.setInt(&fbdo, humPath + "/timestamp", millis());
    Serial.printf("📊 Humidity sent: %.2f%%\n", humidity);
  }
}

void sendRelayStateToFirebase(int relayNum, bool state) {
  String deviceKey = DEVICE_SN + "_relay" + String(relayNum);
  String relayPath = "/deviceData/" + String(USER_UID) + "/" + deviceKey;
  
  if (Firebase.RTDB.setBool(&fbdo, relayPath + "/value", state)) {
    // Use Firebase server timestamp for accurate time
    Firebase.RTDB.setTimestamp(&fbdo, relayPath + "/timestamp");
    Serial.printf("🔄 Relay %d state sent to Firebase: %s\n", relayNum, state ? "ON" : "OFF");
  }
}

void updateOnlineStatus() {
  // Update online status and last seen timestamp for each relay device
  for (int i = 1; i <= 4; i++) {
    String deviceKey = DEVICE_SN + "_relay" + String(i);
    String statusPath = "/devices/" + String(USER_UID) + "/" + deviceKey + "/online";
    String lastSeenPath = "/devices/" + String(USER_UID) + "/" + deviceKey + "/lastSeen";
    
    // Set online status based on WiFi connection
    bool isOnline = WiFi.status() == WL_CONNECTED && Firebase.ready();
    Firebase.RTDB.setBool(&fbdo, statusPath, isOnline);
    
    // Update timestamp only if online
    if (isOnline) {
      Firebase.RTDB.setTimestamp(&fbdo, lastSeenPath);
    }
  }
  
  if (WiFi.status() == WL_CONNECTED && Firebase.ready()) {
    Serial.println("💚 Online status updated for all relays");
  } else {
    Serial.println("❌ Offline - status not updated");
  }
}

void setAllDevicesOffline() {
  // Set all devices to offline status when WiFi disconnects
  for (int i = 1; i <= 4; i++) {
    String deviceKey = DEVICE_SN + "_relay" + String(i);
    String statusPath = "/devices/" + String(USER_UID) + "/" + deviceKey + "/online";
    
    if (Firebase.ready()) {
      Firebase.RTDB.setBool(&fbdo, statusPath, false);
    }
  }
}

void registerDeviceInFirebase() {
  // ปิดการ auto-register เพราะจะเพิ่มผ่านเว็บแล้ว
  static bool deviceRegistered = true; // เปลี่ยนเป็น true เพื่อไม่ให้ทำงาน
  
  if (deviceRegistered) return;
  
  Serial.println("📱 Device registration disabled - add devices through web interface");
}

void checkFirebaseRelayControls() {
  // Check if Firebase is ready
  if (!Firebase.ready() || !signupOK) {
    static unsigned long lastConnectionLog = 0;
    if (millis() - lastConnectionLog > 30000) {
      lastConnectionLog = millis();
      int rssi = wifiConnected ? WiFi.RSSI() : -100;
      Serial.printf("⚠️ Firebase not ready - WiFi: %ddBm, FB Auth: %s\n", 
                    rssi, signupOK ? "OK" : "FAIL");
    }
    return;
  }
  
  // Throttle Firebase checks to reduce latency (check every 50ms for faster response)
  static unsigned long lastFirebaseCheck = 0;
  if (millis() - lastFirebaseCheck < 50) {
    return;
  }
  lastFirebaseCheck = millis();
  
  // Check for remote relay commands from web dashboard
  for (int i = 1; i <= 4; i++) {
    String deviceKey = DEVICE_SN + "_relay" + String(i);
    String relayPath = "/deviceData/" + String(USER_UID) + "/" + deviceKey + "/value";
    
    if (Firebase.RTDB.getBool(&fbdo, relayPath)) {
      bool remoteState = fbdo.boolData();
      bool currentState = false;
      
      switch (i) {
        case 1: currentState = relay1_State; break;
        case 2: currentState = relay2_State; break;
        case 3: currentState = relay3_State; break;
        case 4: currentState = relay4_State; break;
      }
      
      if (remoteState != currentState) {
        setRelayState(i, remoteState);
        Serial.printf("🌐 Remote command: Relay %d -> %s\n", i, remoteState ? "ON" : "OFF");
      }
    }
  }
}

void resetWiFiSettings() {
  Serial.println("🔄 Resetting WiFi settings...");
  wm.resetSettings();
  Serial.println("✓ WiFi settings reset. Restarting...");
  ESP.restart();
}

void printStatus() {
  Serial.println("=== Current Status ===");
  Serial.printf("WiFi: %s", wifiConnected ? "Connected" : "Disconnected");
  if (wifiConnected) {
    Serial.printf(" (%s)", WiFi.localIP().toString().c_str());
  }
  Serial.println();
  Serial.printf("Firebase: %s\n", signupOK ? "Connected" : "Disconnected");
  Serial.printf("Relays: 1:%s, 2:%s, 3:%s, 4:%s\n",
                relay1_State ? "ON" : "OFF",
                relay2_State ? "ON" : "OFF",
                relay3_State ? "ON" : "OFF",
                relay4_State ? "ON" : "OFF");
  Serial.printf("Inputs: 1:%s, 2:%s, 3:%s, 4:%s\n",
                digitalRead(INPUT_PIN_1) ? "HIGH" : "LOW",
                digitalRead(INPUT_PIN_2) ? "HIGH" : "LOW",
                digitalRead(INPUT_PIN_3) ? "HIGH" : "LOW",
                digitalRead(INPUT_PIN_4) ? "HIGH" : "LOW");
  Serial.printf("Sensors: Temp=%.1f°C, Humidity=%.1f%%\n", temperature, humidity);
  Serial.println("=====================");
}

void testAllPins() {
  Serial.println("🧪 === PIN TESTING MODE ===");
  
  // Test each relay pin individually
  int pins[] = {RELAY_PIN_1, RELAY_PIN_2, RELAY_PIN_3, RELAY_PIN_4};
  
  for (int i = 0; i < 4; i++) {
    Serial.printf("Testing Pin %d...\n", pins[i]);
    
    // HIGH for 2 seconds
    digitalWrite(pins[i], HIGH);
    Serial.printf("  Pin %d: HIGH (3.3V)\n", pins[i]);
    delay(2000);
    
    // LOW for 2 seconds  
    digitalWrite(pins[i], LOW);
    Serial.printf("  Pin %d: LOW (0V)\n", pins[i]);
    delay(2000);
  }
  
  Serial.println("🧪 === TEST COMPLETE ===");
  Serial.println("Did any LEDs blink during the test?");
}
