# 🔄 การเปลี่ยนจาก Home Assistant เป็น MQTT

## 🎯 ภาพรวมการเปลี่ยนแปลง

### Architecture เดิม (Home Assistant)
```
React App → Firebase → Home Assistant API → ESP32/อุปกรณ์
```

### Architecture ใหม่ (MQTT)
```
React App → Firebase → MQTT Broker → ESP32/อุปกรณ์
```

## ✅ ข้อดีของ MQTT

### 🚀 Performance
- **Real-time**: การสื่อสารแบบ instant
- **Low Latency**: < 10ms response time
- **Efficient**: ใช้ bandwidth น้อย

### 💻 Resource Usage
- **MQTT Broker**: ~50MB RAM
- **Home Assistant**: ~500MB+ RAM
- **การประหยัด**: 90% ลดการใช้ทรัพยากร

### 🔧 Flexibility
- **Custom Messages**: ควบคุม format ข้อมูลเอง
- **Direct Communication**: ไม่ผ่าน middleware ซับซ้อน
- **Easy Integration**: รองรับ library หลากหลาย

## 📡 MQTT Topic Structure

### Device Commands
```
company/devices/[type]/[location]/command
```
ตัวอย่าง:
- `company/devices/lights/hr_dept/command`
- `company/devices/airconditioner/it_dept/command`

### Device Status
```
company/devices/[type]/[location]/status
```
ตัวอย่าง:
- `company/devices/lights/hr_dept/status`
- `company/devices/airconditioner/it_dept/status`

### Sensor Data
```
company/sensors/[type]/[location]
```
ตัวอย่าง:
- `company/sensors/temperature/it_dept`
- `company/sensors/humidity/meeting_room_a`

## 📝 Message Formats

### Command Message
```json
{
  "command": "turn_on|turn_off|toggle|set_temperature",
  "device_id": "lights_hr_dept",
  "timestamp": "2025-08-13T10:30:00Z",
  "user": "admin@company.com",
  "temperature": 25
}
```

### Status Message
```json
{
  "device_id": "lights_hr_dept",
  "status": "on|off",
  "timestamp": "2025-08-13T10:30:00Z",
  "online": true,
  "wifi_rssi": -45,
  "free_heap": 200000
}
```

### Sensor Message
```json
{
  "sensor_id": "temperature_it_dept",
  "value": 24.5,
  "unit": "°C",
  "timestamp": "2025-08-13T10:30:00Z",
  "device_id": "lights_hr_dept"
}
```

## 🚀 การติดตั้งและใช้งาน

### 1. ติดตั้ง MQTT Broker
```bash
./install-mqtt.sh
```

### 2. ตั้งค่าใน React App
1. เข้าสู่ระบบ
2. ไปที่ **MQTT Dashboard**
3. กำหนดค่า:
   - Host: `localhost`
   - Port: `9001`
   - Protocol: `ws`

### 3. อัพโหลด ESP32 Code
1. แก้ไข WiFi credentials ใน `esp32-mqtt/mqtt_device.ino`
2. แก้ไข MQTT server IP
3. อัพโหลดไปยัง ESP32

## 🔧 การตั้งค่า ESP32

### Required Libraries
```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
```

### การติดตั้ง Libraries ใน Arduino IDE
1. Tools → Manage Libraries
2. ค้นหาและติดตั้ง:
   - `PubSubClient` by Nick O'Leary
   - `ArduinoJson` by Benoit Blanchon
   - `DHT sensor library` by Adafruit

### การเชื่อมต่อฮาร์ดแวร์
```
ESP32        Device
GPIO 2   →   Built-in LED
GPIO 4   →   Relay Module
GPIO 5   →   DHT22 Sensor
```

## 📊 การเปรียบเทียบ Features

| Feature | Home Assistant | MQTT |
|---------|----------------|------|
| Setup Complexity | ⭐⭐⭐ | ⭐ |
| Resource Usage | ⭐ | ⭐⭐⭐⭐⭐ |
| Real-time Performance | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Customization | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Learning Curve | ⭐⭐⭐ | ⭐⭐ |
| Community Support | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## 🔍 Monitoring และ Debugging

### MQTT Management Dashboard
- URL: http://localhost:8088
- ดู active connections
- Monitor message traffic
- Debug topics และ messages

### React App Debugging
```javascript
// ดู MQTT messages ใน Console
console.log('MQTT Message:', topic, data);
```

### ESP32 Serial Monitor
```
Connecting to WiFi...
WiFi connected
IP address: 192.168.1.150
Attempting MQTT connection...connected
Subscribed to: company/devices/lights/hr_dept/command
Status published: {"device_id":"lights_hr_dept","status":"off",...}
```

## ⚡ Quick Start Commands

### เริ่มต้น MQTT Broker
```bash
docker-compose -f docker-compose-mqtt.yml up -d
```

### ดู MQTT Logs
```bash
docker logs mqtt-broker
```

### ทดสอบ MQTT ด้วย Command Line
```bash
# Subscribe to topics
mosquitto_sub -h localhost -t "company/devices/+/+/status"

# Publish command
mosquitto_pub -h localhost -t "company/devices/lights/hr_dept/command" -m '{"command":"turn_on","device_id":"lights_hr_dept"}'
```

### Stop MQTT Services
```bash
docker-compose -f docker-compose-mqtt.yml down
```

## 🆘 Troubleshooting

### ปัญหาที่พบบ่อย

#### 1. เชื่อมต่อ MQTT ไม่ได้
- ตรวจสอบ Docker containers: `docker ps`
- ตรวจสอบ ports: `netstat -an | grep 9001`
- ตรวจสอบ firewall settings

#### 2. ESP32 เชื่อมต่อไม่ได้
- ตรวจสอบ WiFi credentials
- ตรวจสอบ MQTT broker IP
- ดู Serial Monitor สำหรับ error messages

#### 3. Messages ไม่ได้รับ
- ตรวจสอบ topic names
- ตรวจสอบ JSON format
- ใช้ MQTT Management Dashboard เพื่อ debug

## 🎯 Next Steps

1. **Production Setup**: เพิ่ม authentication และ SSL
2. **Device Management**: สร้างระบบจัดการอุปกรณ์
3. **Data Analytics**: เก็บข้อมูลเซ็นเซอร์ใน database
4. **Mobile App**: สร้าง mobile app สำหรับควบคุม
5. **Cloud Integration**: เชื่อมต่อกับ cloud MQTT brokers
