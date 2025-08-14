# 🚀 MQTT System - วิธีการใช้งาน

## 🔧 **ขั้นตอนการใช้งาน**

### 1. ✅ MQTT Broker ทำงานแล้ว
```bash
# ตรวจสอบสถานะ
docker ps
```

### 2. 🌐 เข้าถึงผ่าน Web Browser

#### **Web Application (React):**
```
http://localhost:3000
```
- เข้าสู่ระบบด้วย Firebase
- คลิกเมนู "MQTT Control"
- ใน MQTT Dashboard จะเชื่อมต่อ: `ws://localhost:8083/mqtt`

#### **MQTT Explorer (Debug Tool):**
```
http://localhost:4000
```
- เครื่องมือดู MQTT Messages
- ตรวจสอบการส่ง-รับข้อมูล

### 3. 📱 ESP32 Setup

#### **สำหรับ ESP32 ใช้:**
```cpp
const char* mqtt_server = "192.168.1.XXX";  // IP ของคอมพิวเตอร์
const int mqtt_port = 1883;                 // Port 1883 สำหรับ ESP32
```

## 🖥️ **Web Interface:**

### **MQTT Dashboard หน้าตาแบบนี้:**
```
📡 MQTT Connection
🟢 เชื่อมต่อแล้ว

Broker URL: ws://localhost:8083/mqtt
Username: [ว่างไว้]
Password: [ว่างไว้]
[🔗 เชื่อมต่อ] [🔌 ตัดการเชื่อมต่อ]

Device Controls:
┌─────────────────────┐
│ 💡 LED Controller 1 │
│ ID: ESP32_001       │
│                     │
│ 🎛️ Controls         │
│ LED 1    [OFF] [ON] │
│ LED 2    [OFF] [ON] │
│ LED 3    [OFF] [ON] │
└─────────────────────┘
```

## 🔍 **การ Debug:**

### **1. ตรวจสอบ MQTT Broker:**
```bash
# เข้าไปใน container
docker exec -it mosquitto-broker sh

# ทดสอบ subscribe
mosquitto_sub -t "esp32/+/+"

# ทดสอบ publish
mosquitto_pub -t "esp32/ESP32_001/command" -m '{"command":"led","value":{"pin":2,"state":"on"}}'
```

### **2. ตรวจสอบ Network:**
```bash
# หา IP ของคอมพิวเตอร์
ifconfig | grep inet
# หรือ
ip addr show
```

### **3. ตรวจสอบใน Web Browser:**
- เปิด Developer Tools (F12)
- ดู Console tab
- มองหา MQTT connection messages

## 📊 **Ports Summary:**

| Port | Protocol | ใช้สำหรับ | URL Example |
|------|----------|-----------|-------------|
| 1883 | MQTT | ESP32 | `mqtt://192.168.1.100:1883` |
| 8083 | WebSocket | Web App | `ws://localhost:8083/mqtt` |
| 3000 | HTTP | React App | `http://localhost:3000` |
| 4000 | HTTP | MQTT Explorer | `http://localhost:4000` |

## ⚡ **Quick Start:**

1. **เปิด Web App:** `http://localhost:3000`
2. **Login** ด้วย Firebase  
3. **คลิก "MQTT Control"** ในเมนู
4. **คลิก "เชื่อมต่อ"** ใน MQTT Dashboard
5. **ควบคุมอุปกรณ์** ผ่าน Web Interface

## 🎮 **การทดสอบ:**

### **ทดสอบโดยไม่มี ESP32:**
- Web App จะแสดงอุปกรณ์จำลอง
- คลิกปุ่ม ON/OFF ดู Console log
- ดู Last Message panel ล่างสุด

### **ทดสอบกับ ESP32 จริง:**
1. แก้ไข WiFi SSID/Password ใน ESP32 code
2. แก้ `mqtt_server` เป็น IP ของคอมพิวเตอร์
3. Upload code ลง ESP32
4. ดู Serial Monitor เพื่อตรวจสอบการเชื่อมต่อ

---

🎉 **ตอนนี้ระบบพร้อมใช้งานแล้ว!** 🎉
