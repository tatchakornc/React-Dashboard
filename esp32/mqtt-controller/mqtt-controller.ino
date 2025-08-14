#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";        // ⚠️ แก้เป็นชื่อ WiFi ของคุณ
const char* password = "YOUR_WIFI_PASSWORD"; // ⚠️ แก้เป็นรหัส WiFi ของคุณ

// MQTT Broker settings
const char* mqtt_server = "192.168.1.28";   // ✅ IP ของคอมพิวเตอร์ที่รัน MQTT Broker
const int mqtt_port = 1883;
const char* mqtt_username = "";  // ถ้าไม่มี username ให้เว้นว่าง
const char* mqtt_password = "";  // ถ้าไม่มี password ให้เว้นว่าง

// Device settings
const char* device_id = "ESP32_001";
String command_topic = "esp32/" + String(device_id) + "/command";
String status_topic = "esp32/" + String(device_id) + "/status";
String sensor_topic = "esp32/" + String(device_id) + "/sensor";

// Pin definitions
#define LED1_PIN 2
#define LED2_PIN 4
#define LED3_PIN 5
#define RELAY1_PIN 12
#define RELAY2_PIN 13

// Sensor pins (example)
#define TEMP_SENSOR_PIN A0
#define LIGHT_SENSOR_PIN A1

WiFiClient espClient;
PubSubClient client(espClient);

// Variables
bool led1_state = false;
bool led2_state = false;
bool led3_state = false;
bool relay1_state = false;
bool relay2_state = false;

unsigned long lastSensorRead = 0;
const unsigned long sensorInterval = 5000; // อ่านเซ็นเซอร์ทุก 5 วินาที

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(LED3_PIN, OUTPUT);
  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  
  // Turn off all outputs initially
  digitalWrite(LED1_PIN, LOW);
  digitalWrite(LED2_PIN, LOW);
  digitalWrite(LED3_PIN, LOW);
  digitalWrite(RELAY1_PIN, LOW);
  digitalWrite(RELAY2_PIN, LOW);
  
  // Connect to WiFi
  setupWiFi();
  
  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(onMqttMessage);
  
  Serial.println("ESP32 MQTT Controller Ready!");
  Serial.println("Device ID: " + String(device_id));
  Serial.println("Command Topic: " + command_topic);
  Serial.println("Status Topic: " + status_topic);
}

void loop() {
  // Maintain MQTT connection
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
  
  // Read sensors periodically
  if (millis() - lastSensorRead > sensorInterval) {
    readAndPublishSensors();
    lastSensorRead = millis();
  }
  
  delay(100);
}

void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected!");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    String clientId = "ESP32Client-" + String(device_id);
    
    if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("connected");
      
      // Subscribe to command topic
      client.subscribe(command_topic.c_str());
      Serial.println("Subscribed to: " + command_topic);
      
      // Publish online status
      publishStatus("online");
      
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  // Convert payload to string
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println("Message received: " + String(topic) + " - " + message);
  
  // Parse JSON command
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.println("Failed to parse JSON");
    return;
  }
  
  String command = doc["command"];
  
  if (command == "led") {
    handleLEDCommand(doc);
  } else if (command == "relay") {
    handleRelayCommand(doc);
  } else if (command == "sensor") {
    readAndPublishSensors();
  } else {
    Serial.println("Unknown command: " + command);
  }
}

void handleLEDCommand(DynamicJsonDocument& doc) {
  int pin = doc["value"]["pin"];
  String state = doc["value"]["state"];
  
  bool newState = (state == "on");
  
  switch (pin) {
    case 2:
      led1_state = newState;
      digitalWrite(LED1_PIN, led1_state);
      publishPinStatus(2, led1_state);
      break;
    case 4:
      led2_state = newState;
      digitalWrite(LED2_PIN, led2_state);
      publishPinStatus(4, led2_state);
      break;
    case 5:
      led3_state = newState;
      digitalWrite(LED3_PIN, led3_state);
      publishPinStatus(5, led3_state);
      break;
    default:
      Serial.println("Invalid LED pin: " + String(pin));
  }
  
  Serial.println("LED " + String(pin) + " set to " + state);
}

void handleRelayCommand(DynamicJsonDocument& doc) {
  int relay = doc["value"]["relay"];
  String state = doc["value"]["state"];
  
  bool newState = (state == "on");
  
  switch (relay) {
    case 1:
      relay1_state = newState;
      digitalWrite(RELAY1_PIN, relay1_state);
      publishPinStatus(12, relay1_state);
      break;
    case 2:
      relay2_state = newState;
      digitalWrite(RELAY2_PIN, relay2_state);
      publishPinStatus(13, relay2_state);
      break;
    default:
      Serial.println("Invalid relay number: " + String(relay));
  }
  
  Serial.println("Relay " + String(relay) + " set to " + state);
}

void publishPinStatus(int pin, bool state) {
  DynamicJsonDocument doc(200);
  doc["pin"] = pin;
  doc["state"] = state ? "on" : "off";
  doc["timestamp"] = millis();
  
  String message;
  serializeJson(doc, message);
  
  client.publish(status_topic.c_str(), message.c_str());
  Serial.println("Status published: " + message);
}

void publishStatus(String status) {
  DynamicJsonDocument doc(200);
  doc["device_id"] = device_id;
  doc["status"] = status;
  doc["timestamp"] = millis();
  doc["ip"] = WiFi.localIP().toString();
  
  String message;
  serializeJson(doc, message);
  
  client.publish(status_topic.c_str(), message.c_str());
  Serial.println("Device status: " + status);
}

void readAndPublishSensors() {
  // Read analog sensors (example values)
  float temperature = random(200, 350) / 10.0; // Simulate 20-35°C
  float humidity = random(400, 800) / 10.0;    // Simulate 40-80%
  int light = random(100, 1000);               // Simulate 100-1000 lux
  
  // Create JSON message
  DynamicJsonDocument doc(300);
  doc["device_id"] = device_id;
  doc["temp"] = temperature;
  doc["humidity"] = humidity;
  doc["light"] = light;
  doc["timestamp"] = millis();
  
  String message;
  serializeJson(doc, message);
  
  client.publish(sensor_topic.c_str(), message.c_str());
  Serial.println("Sensors published: " + message);
}
