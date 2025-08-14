# 🚀 MQTT Integration Guide

## 📋 ภาพรวม
Web App นี้ได้เพิ่มความสามารถในการสื่อสารกับ ESP32 ผ่าน MQTT Protocol แล้ว!

## 🔧 การติดตั้งและใช้งาน

### 1. เริ่มต้น MQTT Broker
```bash
# เริ่ม MQTT Broker ด้วย Docker
docker-compose -f docker-compose-mqtt.yml up -d

# ตรวจสอบสถานะ
docker-compose -f docker-compose-mqtt.yml ps
```

### 2. เข้าถึง Web Application
- เปิดเว็บ: `http://localhost:3000`
- เข้าสู่ระบบด้วย Firebase
- คลิกเมนู "MQTT Control"

### 3. เชื่อมต่อ MQTT
- **Broker URL**: `ws://localhost:8083/mqtt`
- **Username**: ว่างไว้ (ถ้าไม่ได้ตั้งค่า)
- **Password**: ว่างไว้ (ถ้าไม่ได้ตั้งค่า)
- คลิก "เชื่อมต่อ"

## 🎛️ การควบคุมอุปกรณ์

### LED Controller (ESP32_001)
- **LED 1** (Pin 2): สำหรับแสงสว่าง
- **LED 2** (Pin 4): สำหรับสถานะ 
- **LED 3** (Pin 5): สำหรับแจ้งเตือน

### Relay Controller (ESP32_002)  
- **Relay 1** (Pin 12): ควบคุมอุปกรณ์ไฟฟ้า
- **Relay 2** (Pin 13): ควบคุมปั๊มน้ำ

### Sensor Module (ESP32_003)
- **อุณหภูมิ**: แสดงค่าในหน่วย °C
- **ความชื้น**: แสดงค่าในหน่วย %
- **แสง**: แสดงค่าในหน่วย lux

## 📡 MQTT Topics Structure

### Command Topics (Web → ESP32)
```
esp32/{device_id}/command
```

#### LED Command Example:
```json
{
  "command": "led",
  "value": {
    "pin": 2,
    "state": "on"
  },
  "timestamp": 1623456789
}
```

#### Relay Command Example:
```json
{
  "command": "relay", 
  "value": {
    "relay": 1,
    "state": "off"
  },
  "timestamp": 1623456789
}
```

### Status Topics (ESP32 → Web)
```
esp32/{device_id}/status
```

#### Status Response Example:
```json
{
  "pin": 2,
  "state": "on",
  "timestamp": 1623456789
}
```

### Sensor Topics (ESP32 → Web)
```
esp32/{device_id}/sensor
```

#### Sensor Data Example:
```json
{
  "device_id": "ESP32_003",
  "temp": 25.6,
  "humidity": 65.2,
  "light": 450,
  "timestamp": 1623456789
}
```

## 🔌 ESP32 Setup

### 1. ติดตั้ง Libraries
- WiFi (Built-in)
- PubSubClient
- ArduinoJson

### 2. แก้ไขโค้ด
```cpp
// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker (IP ของคอมพิวเตอร์ที่รัน Docker)
const char* mqtt_server = "192.168.1.100";

// Device ID (ต้องไม่ซ้ำกัน)
const char* device_id = "ESP32_001";
```

### 3. อัปโหลดโค้ดลง ESP32
```bash
# ใน Arduino IDE
1. เลือก Board: ESP32 Dev Module
2. เลือก Port: COM port ของ ESP32
3. กด Upload
```

## 🐳 Docker Services

### MQTT Broker (Mosquitto)
- **Port 1883**: MQTT Protocol
- **Port 8083**: WebSocket MQTT  
- **Port 9001**: Secure WebSocket

### MQTT Explorer
- **Port 4000**: Web UI สำหรับดู MQTT Messages
- URL: `http://localhost:4000`

## 🔍 การ Debug

### 1. ตรวจสอบ MQTT Broker
```bash
# ดู logs ของ Mosquitto
docker-compose -f docker-compose-mqtt.yml logs mosquitto

# Test MQTT ด้วย mosquitto_pub/sub
docker exec -it mosquitto-broker mosquitto_sub -t "esp32/+/+"
```

### 2. ตรวจสอบการเชื่อมต่อ ESP32
- เปิด Serial Monitor (115200 baud)
- ดูข้อความ "WiFi connected" และ "MQTT connected"

### 3. ตรวจสอบ Web App
- เปิด Browser Developer Tools (F12)
- ดู Console สำหรับ MQTT messages

## 🌐 Network Requirements

### Firewall Ports
- **1883**: MQTT Protocol
- **8083**: WebSocket MQTT
- **3000**: React Web App
- **4000**: MQTT Explorer

### WiFi Network
- ESP32 และ Computer ต้องอยู่ใน Network เดียวกัน
- ใช้ IP Address แทน localhost สำหรับ ESP32

## 🚨 Troubleshooting

### ปัญหาที่พบบ่อย:

1. **MQTT ไม่เชื่อมต่อ**
   - ตรวจสอบ Broker URL
   - ใช้ IP Address แทน localhost
   - ปิด Firewall ชั่วคราว

2. **ESP32 ไม่ส่งข้อมูล**
   - ตรวจสอบ WiFi connection
   - ตรวจสอบ MQTT server IP
   - ดู Serial Monitor

3. **Web App ไม่แสดงข้อมูล**
   - ตรวจสอบ Browser Console
   - Refresh หน้าเว็บ
   - ตรวจสอบ MQTT subscription

## 📊 Performance Tips

1. **ปรับ Sensor Interval**
   ```cpp
   const unsigned long sensorInterval = 10000; // 10 วินาที
   ```

2. **ใช้ QoS ที่เหมาะสม**
   ```cpp
   client.publish(topic, message, 1); // QoS 1
   ```

3. **จำกัดข้อความ**
   - ส่งเฉพาะเมื่อมีการเปลี่ยนแปลง
   - ใช้ JSON ขนาดเล็ก

## 🎯 Next Steps

1. เพิ่มอุปกรณ์ ESP32 ใหม่
2. สร้าง Custom Device Types
3. เพิ่ม Authentication สำหรับ MQTT
4. ทำ SSL/TLS Encryption
5. สร้าง Mobile App

---

🎉 **สนุกกับการควบคุม IoT!** 🎉
