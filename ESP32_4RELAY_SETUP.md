# 🎛️ ESP32 4Relay Controller - คู่มือการใช้งาน

## 📋 **ข้อมูล ESP32 4Relay ของคุณ:**

### **🔌 Pin Configuration:**
```
Relay 1: GPIO 25
Relay 2: GPIO 26  
Relay 3: GPIO 27
Relay 4: GPIO 14

Input 1: GPIO 34 (Manual Control)
Input 2: GPIO 35 (Manual Control)
Input 3: GPIO 32 (Manual Control)
Input 4: GPIO 33 (Manual Control)

DHT22 Sensor: GPIO 4 (Temperature & Humidity)
```

## 🌐 **MQTT Topics สำหรับ ESP32:**

### **📤 ส่งคำสั่งไปยัง ESP32:**
```
esp32/{DEVICE_ID}/command
```

### **📥 รับสถานะจาก ESP32:**
```
esp32/{DEVICE_ID}/status
esp32/{DEVICE_ID}/data
```

## 🎮 **การควบคุมผ่าน Web Dashboard:**

### **1. ควบคุม Relay แต่ละตัว:**
```json
{
  "command": "relay",
  "value": {
    "pin": 25,
    "state": "on"
  }
}
```

### **2. ควบคุม Relay หลายตัวพร้อมกัน:**
```json
{
  "command": "relays",
  "value": {
    "relay1": "on",
    "relay2": "off", 
    "relay3": "on",
    "relay4": "off"
  }
}
```

### **3. อ่านข้อมูล Sensor:**
```json
{
  "command": "read_sensors"
}
```

## 📊 **ข้อมูลที่ ESP32 ส่งกลับ:**

### **สถานะ Relay:**
```json
{
  "type": "relay_status",
  "data": {
    "relay1": true,
    "relay2": false,
    "relay3": true, 
    "relay4": false
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### **ข้อมูล Sensor:**
```json
{
  "type": "sensor_data",
  "data": {
    "temperature": 28.5,
    "humidity": 65.2,
    "heat_index": 30.1
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🎯 **ขั้นตอนการใช้งาน:**

### **Step 1: เปิด Web App**
1. เปิดเบราว์เซอร์ไปที่: `http://localhost:3000`
2. Login ด้วย Firebase
3. คลิกเมนู "MQTT Control"

### **Step 2: เชื่อมต่อ MQTT**
1. ใน MQTT Dashboard
2. Broker URL: `ws://localhost:8083/mqtt`
3. คลิก "เชื่อมต่อ"
4. เมื่อเชื่อมต่อสำเร็จจะเห็น 🟢

### **Step 3: ค้นหา ESP32**
- ระบบจะแสดงอุปกรณ์ที่เชื่อมต่ออยู่
- ควรเห็น ESP32 4Relay ในรายการ

### **Step 4: ควบคุม Relay**
```
┌─────────────────────────────┐
│ 🎛️ ESP32 4Relay Controller │
│ ID: ESP32_XXXXXX            │
│                             │
│ Relay Controls:             │
│ Relay 1  [OFF] [ON]         │
│ Relay 2  [OFF] [ON]         │
│ Relay 3  [OFF] [ON]         │
│ Relay 4  [OFF] [ON]         │
│                             │
│ 🌡️ Temperature: 28.5°C      │
│ 💧 Humidity: 65.2%          │
└─────────────────────────────┘
```

## 🔧 **การทดสอบ:**

### **ทดสอบผ่าน MQTT Explorer:**
1. เปิด: `http://localhost:4000`
2. เชื่อมต่อ: `localhost:1883`
3. Subscribe: `esp32/+/+`
4. Publish test message:
   ```
   Topic: esp32/ESP32_001/command
   Message: {"command":"relay","value":{"pin":25,"state":"on"}}
   ```

### **ทดสอบผ่าน Terminal:**
```bash
# Subscribe ดูข้อความ
mosquitto_sub -h localhost -t "esp32/+/+"

# ส่งคำสั่งควบคุม Relay
mosquitto_pub -h localhost -t "esp32/ESP32_001/command" -m '{"command":"relay","value":{"pin":25,"state":"on"}}'
```

## ⚡ **การแก้ไขปัญหา:**

### **ESP32 ไม่ปรากฏในรายการ:**
1. ตรวจสอบ WiFi connection บน ESP32
2. ตรวจสอบ MQTT Broker IP ใน ESP32 code
3. ดู Serial Monitor ของ ESP32

### **คำสั่งไม่ทำงาน:**
1. ตรวจสอบ JSON format
2. ตรวจสอบ Pin numbers
3. ตรวจสอบ MQTT Topic structure

### **ไม่ได้รับข้อมูล Sensor:**
1. ตรวจสอบการเชื่อมต่อ DHT22
2. ตรวจสอบ Pin GPIO 4
3. ดู Serial Monitor สำหรับ error messages

---

🎉 **ตอนนี้คุณสามารถควบคุม ESP32 4Relay ผ่าน Web Dashboard แล้ว!** 🎉
