#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Configuration
const char* mqtt_server = "192.168.1.100";  // Change to your MQTT broker IP
const int mqtt_port = 1883;
const char* mqtt_client_id = "esp32_device_01";

// Device Configuration
const char* device_id = "lights_hr_dept";
const char* location = "hr_dept";
const char* device_type = "lights";

// Hardware Configuration
#define LED_PIN 2          // Built-in LED
#define RELAY_PIN 4        // Relay control pin
#define DHT_PIN 5          // DHT sensor pin
#define DHT_TYPE DHT22     // DHT sensor type

// Objects
WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHT_PIN, DHT_TYPE);

// Variables
bool device_status = false;
unsigned long lastSensorRead = 0;
const unsigned long sensorInterval = 30000; // Read sensor every 30 seconds
unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 60000; // Send heartbeat every 60 seconds

// MQTT Topics
String command_topic = "company/devices/" + String(device_type) + "/" + String(location) + "/command";
String status_topic = "company/devices/" + String(device_type) + "/" + String(location) + "/status";
String sensor_temp_topic = "company/sensors/temperature/" + String(location);
String sensor_humidity_topic = "company/sensors/humidity/" + String(location);

void setup() {
  Serial.begin(115200);
  
  // Initialize Hardware
  pinMode(LED_PIN, OUTPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  digitalWrite(RELAY_PIN, LOW);
  
  // Initialize DHT sensor
  dht.begin();
  
  // Connect to WiFi
  setupWiFi();
  
  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(onMqttMessage);
  
  Serial.println("ESP32 MQTT Device Ready!");
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
  
  // Read and publish sensor data
  if (millis() - lastSensorRead > sensorInterval) {
    readAndPublishSensors();
    lastSensorRead = millis();
  }
  
  // Send heartbeat
  if (millis() - lastHeartbeat > heartbeatInterval) {
    publishDeviceStatus();
    lastHeartbeat = millis();
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
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    if (client.connect(mqtt_client_id)) {
      Serial.println("connected");
      
      // Subscribe to command topic
      client.subscribe(command_topic.c_str());
      Serial.println("Subscribed to: " + command_topic);
      
      // Publish initial status
      publishDeviceStatus();
      
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println("Message received on topic: " + String(topic));
  Serial.println("Message: " + message);
  
  // Parse JSON command
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.println("JSON parsing failed: " + String(error.c_str()));
    return;
  }
  
  String command = doc["command"];
  String received_device_id = doc["device_id"];
  
  // Verify device ID
  if (received_device_id != device_id) {
    Serial.println("Command not for this device");
    return;
  }
  
  // Execute command
  executeCommand(command);
  
  // Publish updated status
  publishDeviceStatus();
}

void executeCommand(String command) {
  Serial.println("Executing command: " + command);
  
  if (command == "turn_on") {
    device_status = true;
    digitalWrite(LED_PIN, HIGH);
    digitalWrite(RELAY_PIN, HIGH);
    Serial.println("Device turned ON");
    
  } else if (command == "turn_off") {
    device_status = false;
    digitalWrite(LED_PIN, LOW);
    digitalWrite(RELAY_PIN, LOW);
    Serial.println("Device turned OFF");
    
  } else if (command == "toggle") {
    device_status = !device_status;
    digitalWrite(LED_PIN, device_status);
    digitalWrite(RELAY_PIN, device_status);
    Serial.println("Device toggled to: " + String(device_status ? "ON" : "OFF"));
    
  } else {
    Serial.println("Unknown command: " + command);
  }
}

void publishDeviceStatus() {
  DynamicJsonDocument doc(1024);
  
  doc["device_id"] = device_id;
  doc["status"] = device_status ? "on" : "off";
  doc["timestamp"] = WiFi.getTime();
  doc["online"] = true;
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["free_heap"] = ESP.getFreeHeap();
  
  String json_string;
  serializeJson(doc, json_string);
  
  if (client.publish(status_topic.c_str(), json_string.c_str(), true)) {
    Serial.println("Status published: " + json_string);
  } else {
    Serial.println("Failed to publish status");
  }
}

void readAndPublishSensors() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }
  
  // Publish temperature
  DynamicJsonDocument tempDoc(512);
  tempDoc["sensor_id"] = "temperature_" + String(location);
  tempDoc["value"] = temperature;
  tempDoc["unit"] = "°C";
  tempDoc["timestamp"] = WiFi.getTime();
  tempDoc["device_id"] = device_id;
  
  String tempJson;
  serializeJson(tempDoc, tempJson);
  
  if (client.publish(sensor_temp_topic.c_str(), tempJson.c_str())) {
    Serial.println("Temperature published: " + tempJson);
  }
  
  // Publish humidity
  DynamicJsonDocument humidityDoc(512);
  humidityDoc["sensor_id"] = "humidity_" + String(location);
  humidityDoc["value"] = humidity;
  humidityDoc["unit"] = "%";
  humidityDoc["timestamp"] = WiFi.getTime();
  humidityDoc["device_id"] = device_id;
  
  String humidityJson;
  serializeJson(humidityDoc, humidityJson);
  
  if (client.publish(sensor_humidity_topic.c_str(), humidityJson.c_str())) {
    Serial.println("Humidity published: " + humidityJson);
  }
}
