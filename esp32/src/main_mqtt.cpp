/*
  ESP32 4Relay Controller with MQTT
  Compatible with React Dashboard MQTT System
  
  Features:
  - WiFiManager for easy WiFi setup
  - 4 Relay control via MQTT
  - DHT22 temperature & humidity sensor
  - Real-time MQTT communication
  - Manual button control (offline operation)
  - Serial commands for debugging
*/

#include <WiFi.h>
#include <WiFiManager.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <esp_task_wdt.h>

// --- MQTT Configuration ---
const char* mqtt_server = "192.168.1.28";  // แก้เป็น IP ของคอมพิวเตอร์
const int mqtt_port = 1883;
const char* mqtt_user = "";                 // ว่างไว้ หาก Broker ไม่ต้องการ auth
const char* mqtt_pass = "";                 // ว่างไว้ หาก Broker ไม่ต้องการ auth

// Device ID will be auto-generated from MAC Address
String DEVICE_ID = "";
String DEVICE_NAME = "s";

// --- Pin Definitions ---
// Relay Pins
#define RELAY_PIN_1 25
#define RELAY_PIN_2 26
#define RELAY_PIN_3 27
#define RELAY_PIN_4 14

// Digital Input Pins (Manual Control)
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
// Relay states
bool relay1_State = LOW;
bool relay2_State = LOW;
bool relay3_State = LOW;
bool relay4_State = LOW;

// Button debouncing
long last_debounce_time[4] = {0, 0, 0, 0};
bool last_button_state[4] = {HIGH, HIGH, HIGH, HIGH};
bool button_state_debounced[4] = {HIGH, HIGH, HIGH, HIGH};
const long debounce_delay = 50;

// Timing variables
unsigned long last_status_update = 0;
unsigned long last_sensor_update = 0;
unsigned long last_heartbeat = 0;
const long status_interval = 2000;      // ส่งสถานะทุก 2 วินาที
const long sensor_interval = 5000;      // ส่งข้อมูล sensor ทุก 5 วินาที
const long heartbeat_interval = 30000;  // ส่ง heartbeat ทุก 30 วินาที

// Sensor data
float temperature = 0.0;
float humidity = 0.0;
float heat_index = 0.0;

// Network objects
WiFiClient espClient;
PubSubClient mqtt_client(espClient);
WiFiManager wm;

// MQTT Topics
String topic_command;    // esp32/{DEVICE_ID}/command
String topic_status;     // esp32/{DEVICE_ID}/status
String topic_data;       // esp32/{DEVICE_ID}/data
String topic_heartbeat;  // esp32/{DEVICE_ID}/heartbeat

// Function declarations
void setupPins();
void setupSensors();
void setupWiFiManager();
void setupMQTT();
void connectMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void publishStatus();
void publishSensorData();
void publishHeartbeat();
void handleRelayCommand(JsonObject& command);
void handleSensorRequest();
void readButtons();
void updateRelays();
void readSensors();
void blinkStatusLED(int times, int delayMs = 200);
void printSystemInfo();

void setup() {
  Serial.begin(115200);
  Serial.println("\n🚀 ESP32 4Relay MQTT Controller Starting...");
  
  // Generate Device ID from MAC Address
  String mac = WiFi.macAddress();
  mac.replace(":", "");
  DEVICE_ID = "ESP32_" + mac.substring(6);
  
  Serial.println("📋 Device Info:");
  Serial.println("   ID: " + DEVICE_ID);
  Serial.println("   Name: " + DEVICE_NAME);
  Serial.println("   MAC: " + WiFi.macAddress());
  
  // Setup MQTT Topics
  topic_command = "esp32/" + DEVICE_ID + "/command";
  topic_status = "esp32/" + DEVICE_ID + "/status";
  topic_data = "esp32/" + DEVICE_ID + "/data";
  topic_heartbeat = "esp32/" + DEVICE_ID + "/heartbeat";
  
  // Initialize components
  setupPins();
  setupSensors();
  setupWiFiManager();
  setupMQTT();
  
  Serial.println("✅ ESP32 Setup Complete!");
  Serial.println("📡 MQTT Topics:");
  Serial.println("   Command: " + topic_command);
  Serial.println("   Status: " + topic_status);
  Serial.println("   Data: " + topic_data);
  Serial.println("   Heartbeat: " + topic_heartbeat);
  
  blinkStatusLED(3, 300);
}

void loop() {
  // รักษาการเชื่อมต่อ MQTT
  if (!mqtt_client.connected()) {
    connectMQTT();
  }
  mqtt_client.loop();
  
  // อ่านปุ่มกด (Manual Control)
  readButtons();
  
  // อัปเดต Relays
  updateRelays();
  
  // ส่งสถานะ Relay
  if (millis() - last_status_update > status_interval) {
    publishStatus();
    last_status_update = millis();
  }
  
  // อ่านและส่งข้อมูล Sensor
  if (millis() - last_sensor_update > sensor_interval) {
    readSensors();
    publishSensorData();
    last_sensor_update = millis();
  }
  
  // ส่ง Heartbeat
  if (millis() - last_heartbeat > heartbeat_interval) {
    publishHeartbeat();
    last_heartbeat = millis();
  }
  
  // ป้องกัน Watchdog Reset
  esp_task_wdt_reset();
  delay(10);
}

void setupPins() {
  Serial.println("🔧 Setting up GPIO pins...");
  
  // Setup Relay pins
  pinMode(RELAY_PIN_1, OUTPUT);
  pinMode(RELAY_PIN_2, OUTPUT);
  pinMode(RELAY_PIN_3, OUTPUT);
  pinMode(RELAY_PIN_4, OUTPUT);
  
  // Setup Input pins
  pinMode(INPUT_PIN_1, INPUT_PULLUP);
  pinMode(INPUT_PIN_2, INPUT_PULLUP);
  pinMode(INPUT_PIN_3, INPUT_PULLUP);
  pinMode(INPUT_PIN_4, INPUT_PULLUP);
  
  // Setup Status LED
  pinMode(STATUS_LED, OUTPUT);
  
  // Initialize all relays to OFF
  digitalWrite(RELAY_PIN_1, LOW);
  digitalWrite(RELAY_PIN_2, LOW);
  digitalWrite(RELAY_PIN_3, LOW);
  digitalWrite(RELAY_PIN_4, LOW);
  
  Serial.println("✅ GPIO pins configured");
}

void setupSensors() {
  Serial.println("🌡️ Initializing DHT22 sensor...");
  dht.begin();
  delay(2000); // DHT22 needs time to stabilize
  Serial.println("✅ DHT22 sensor ready");
}

void setupWiFiManager() {
  Serial.println("📶 Setting up WiFiManager...");
  
  // WiFiManager settings
  wm.setConfigPortalTimeout(300); // 5 minutes timeout
  wm.setAPStaticIPConfig(IPAddress(192,168,4,1), IPAddress(192,168,4,1), IPAddress(255,255,255,0));
  
  // Try to connect with saved credentials
  if (!wm.autoConnect(("ESP32_Setup_" + DEVICE_ID).c_str())) {
    Serial.println("❌ Failed to connect to WiFi");
    ESP.restart();
  }
  
  Serial.println("✅ WiFi connected!");
  Serial.println("   IP: " + WiFi.localIP().toString());
  Serial.println("   SSID: " + WiFi.SSID());
  Serial.println("   RSSI: " + String(WiFi.RSSI()) + " dBm");
}

void setupMQTT() {
  Serial.println("📡 Setting up MQTT...");
  mqtt_client.setServer(mqtt_server, mqtt_port);
  mqtt_client.setCallback(mqttCallback);
  mqtt_client.setKeepAlive(60);
  mqtt_client.setSocketTimeout(30);
  
  Serial.println("✅ MQTT configured");
  Serial.println("   Server: " + String(mqtt_server));
  Serial.println("   Port: " + String(mqtt_port));
}

void connectMQTT() {
  while (!mqtt_client.connected()) {
    Serial.println("🔗 Connecting to MQTT Broker...");
    
    String clientId = DEVICE_ID + "_" + String(random(0xffff), HEX);
    
    if (mqtt_client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("✅ MQTT Connected! Client ID: " + clientId);
      
      // Subscribe to command topic
      mqtt_client.subscribe(topic_command.c_str());
      Serial.println("📨 Subscribed to: " + topic_command);
      
      // Publish initial status
      publishHeartbeat();
      publishStatus();
      
      digitalWrite(STATUS_LED, HIGH);
    } else {
      Serial.print("❌ MQTT Connection failed, rc=");
      Serial.print(mqtt_client.state());
      Serial.println(" retrying in 5 seconds");
      
      blinkStatusLED(5, 100);
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.println("📩 MQTT Message received:");
  Serial.println("   Topic: " + String(topic));
  
  // Convert payload to string
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println("   Message: " + message);
  
  // Parse JSON command
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.println("❌ JSON parsing failed: " + String(error.c_str()));
    return;
  }
  
  JsonObject command = doc.as<JsonObject>();
  String cmd = command["command"].as<String>();
  
  if (cmd == "relay" || cmd == "relays") {
    handleRelayCommand(command);
  } else if (cmd == "read_sensors") {
    handleSensorRequest();
  } else if (cmd == "status") {
    publishStatus();
  } else if (cmd == "restart") {
    Serial.println("🔄 Restart command received");
    ESP.restart();
  } else {
    Serial.println("❓ Unknown command: " + cmd);
  }
}

void handleRelayCommand(JsonObject& command) {
  String cmd = command["command"].as<String>();
  
  if (cmd == "relay") {
    // Single relay control
    JsonObject value = command["value"];
    int pin = value["pin"];
    String state = value["state"].as<String>();
    
    bool newState = (state == "on" || state == "1" || state == "true");
    
    Serial.println("🎛️ Relay Command - Pin: " + String(pin) + ", State: " + state);
    
    switch (pin) {
      case RELAY_PIN_1:
        relay1_State = newState;
        break;
      case RELAY_PIN_2:
        relay2_State = newState;
        break;
      case RELAY_PIN_3:
        relay3_State = newState;
        break;
      case RELAY_PIN_4:
        relay4_State = newState;
        break;
      default:
        Serial.println("❌ Invalid relay pin: " + String(pin));
        return;
    }
    
  } else if (cmd == "relays") {
    // Multiple relay control
    JsonObject value = command["value"];
    
    if (value.containsKey("relay1")) {
      relay1_State = value["relay1"].as<String>() == "on";
    }
    if (value.containsKey("relay2")) {
      relay2_State = value["relay2"].as<String>() == "on";
    }
    if (value.containsKey("relay3")) {
      relay3_State = value["relay3"].as<String>() == "on";
    }
    if (value.containsKey("relay4")) {
      relay4_State = value["relay4"].as<String>() == "on";
    }
    
    Serial.println("🎛️ Multiple Relay Command received");
  }
  
  // Apply changes and send status
  updateRelays();
  publishStatus();
}

void handleSensorRequest() {
  Serial.println("🌡️ Sensor data requested");
  readSensors();
  publishSensorData();
}

void readButtons() {
  int pins[] = {INPUT_PIN_1, INPUT_PIN_2, INPUT_PIN_3, INPUT_PIN_4};
  bool* states[] = {&relay1_State, &relay2_State, &relay3_State, &relay4_State};
  
  for (int i = 0; i < 4; i++) {
    bool currentReading = digitalRead(pins[i]);
    
    if (currentReading != last_button_state[i]) {
      last_debounce_time[i] = millis();
    }
    
    if ((millis() - last_debounce_time[i]) > debounce_delay) {
      if (currentReading != button_state_debounced[i]) {
        button_state_debounced[i] = currentReading;
        
        if (currentReading == LOW) { // Button pressed (active low)
          *states[i] = !(*states[i]); // Toggle relay state
          Serial.println("🔘 Button " + String(i+1) + " pressed - Relay " + String(i+1) + ": " + (*states[i] ? "ON" : "OFF"));
          updateRelays();
          publishStatus();
        }
      }
    }
    
    last_button_state[i] = currentReading;
  }
}

void updateRelays() {
  digitalWrite(RELAY_PIN_1, relay1_State ? HIGH : LOW);
  digitalWrite(RELAY_PIN_2, relay2_State ? HIGH : LOW);
  digitalWrite(RELAY_PIN_3, relay3_State ? HIGH : LOW);
  digitalWrite(RELAY_PIN_4, relay4_State ? HIGH : LOW);
}

void readSensors() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  
  if (!isnan(h) && !isnan(t)) {
    humidity = h;
    temperature = t;
    heat_index = dht.computeHeatIndex(t, h, false);
    
    Serial.println("🌡️ Sensor readings - Temp: " + String(temperature) + "°C, Humidity: " + String(humidity) + "%");
  } else {
    Serial.println("❌ Failed to read from DHT sensor");
  }
}

void publishStatus() {
  DynamicJsonDocument doc(512);
  doc["type"] = "relay_status";
  doc["device_id"] = DEVICE_ID;
  doc["device_name"] = DEVICE_NAME;
  doc["timestamp"] = millis();
  
  JsonObject data = doc.createNestedObject("data");
  data["relay1"] = relay1_State;
  data["relay2"] = relay2_State;
  data["relay3"] = relay3_State;
  data["relay4"] = relay4_State;
  
  JsonObject pins = doc.createNestedObject("pins");
  pins["relay1"] = RELAY_PIN_1;
  pins["relay2"] = RELAY_PIN_2;
  pins["relay3"] = RELAY_PIN_3;
  pins["relay4"] = RELAY_PIN_4;
  
  String message;
  serializeJson(doc, message);
  
  if (mqtt_client.publish(topic_status.c_str(), message.c_str())) {
    Serial.println("📤 Status published");
  } else {
    Serial.println("❌ Failed to publish status");
  }
}

void publishSensorData() {
  DynamicJsonDocument doc(512);
  doc["type"] = "sensor_data";
  doc["device_id"] = DEVICE_ID;
  doc["device_name"] = DEVICE_NAME;
  doc["timestamp"] = millis();
  
  JsonObject data = doc.createNestedObject("data");
  data["temperature"] = round(temperature * 10) / 10.0;  // 1 decimal place
  data["humidity"] = round(humidity * 10) / 10.0;
  data["heat_index"] = round(heat_index * 10) / 10.0;
  
  String message;
  serializeJson(doc, message);
  
  if (mqtt_client.publish(topic_data.c_str(), message.c_str())) {
    Serial.println("📤 Sensor data published");
  } else {
    Serial.println("❌ Failed to publish sensor data");
  }
}

void publishHeartbeat() {
  DynamicJsonDocument doc(256);
  doc["type"] = "heartbeat";
  doc["device_id"] = DEVICE_ID;
  doc["device_name"] = DEVICE_NAME;
  doc["timestamp"] = millis();
  doc["uptime"] = millis() / 1000;
  doc["free_heap"] = ESP.getFreeHeap();
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["ip_address"] = WiFi.localIP().toString();
  
  String message;
  serializeJson(doc, message);
  
  if (mqtt_client.publish(topic_heartbeat.c_str(), message.c_str())) {
    Serial.println("💓 Heartbeat sent");
  } else {
    Serial.println("❌ Failed to send heartbeat");
  }
}

void blinkStatusLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(STATUS_LED, HIGH);
    delay(delayMs);
    digitalWrite(STATUS_LED, LOW);
    delay(delayMs);
  }
}

void printSystemInfo() {
  Serial.println("\n📊 System Information:");
  Serial.println("   Chip Model: " + String(ESP.getChipModel()));
  Serial.println("   Chip Revision: " + String(ESP.getChipRevision()));
  Serial.println("   CPU Frequency: " + String(ESP.getCpuFreqMHz()) + " MHz");
  Serial.println("   Flash Size: " + String(ESP.getFlashChipSize() / 1024 / 1024) + " MB");
  Serial.println("   Free Heap: " + String(ESP.getFreeHeap()) + " bytes");
  Serial.println("   Uptime: " + String(millis() / 1000) + " seconds");
}
