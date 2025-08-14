# 🔥 ESP32 MQTT Testing - Quick Guide

## 🎯 **สถานการณ์ปัจจุบัน:**
- ✅ ESP32 Upload สำเร็จ
- ✅ MQTT Broker รันอยู่
- ⚠️ Serial Monitor มี garbage characters (ปกติ)
- 🔄 ESP32 กำลังพยายามเชื่อมต่อ WiFi

## 🚀 **ขั้นตอนทดสอบ MQTT:**

### **1. 📱 ตั้งค่า WiFi บน ESP32:**
ESP32 จะสร้าง WiFi Access Point:
```
SSID: ESP32_Setup_AA5510
Password: [ไม่มี]
```

**วิธีตั้งค่า:**
1. ค้นหา WiFi: `ESP32_Setup_AA5510`
2. เชื่อมต่อ (ไม่ต้องใส่ password)
3. เปิดเบราว์เซอร์: `192.168.4.1`
4. เลือก WiFi network ที่ต้องการ
5. ใส่ password
6. คลิก Save

### **2. 🌐 ทดสอบ Web Dashboard:**
หลังจากตั้งค่า WiFi แล้ว:

1. **เปิด Web App:**
   ```
   http://localhost:3000
   ```

2. **Login และเข้า MQTT Control**

3. **เชื่อมต่อ MQTT:**
   ```
   Broker URL: ws://localhost:8083/mqtt
   Username: [ว่างไว้]
   Password: [ว่างไว้]
   ```

4. **ดูรายการอุปกรณ์:**
   - ควรเห็น `ESP32_AA5510` ในรายการ
   - สถานะ: 🟢 Online

### **3. 🎛️ ทดสอบควบคุม Relay:**
เมื่อ ESP32 ปรากฏใน Dashboard:

```
🎛️ ESP32_AA5510
Status: 🟢 Online

Relay Controls:
┌──────────┬──────────┐
│ Relay 1  │ [OFF][ON]│
│ Relay 2  │ [OFF][ON]│  
│ Relay 3  │ [OFF][ON]│
│ Relay 4  │ [OFF][ON]│
└──────────┴──────────┘

🌡️ Temperature: --°C
💧 Humidity: --%
```

**คลิกปุ่ม ON/OFF เพื่อทดสอบ!**

### **4. 🔍 การ Debug:**

#### **ผ่าน MQTT Explorer:**
```
http://localhost:4000
```
- Host: `localhost`
- Port: `1883`
- Subscribe: `esp32/+/+`
- ดู Messages ที่ส่ง-รับ

#### **ผ่าน Terminal:**
```bash
# ดู MQTT Messages
mosquitto_sub -h localhost -t "esp32/+/+"

# ส่งคำสั่งทดสอบ
mosquitto_pub -h localhost -t "esp32/ESP32_AA5510/command" -m '{"command":"relay","value":{"pin":25,"state":"on"}}'
```

## 🎉 **สิ่งที่คาดหวัง:**

### **เมื่อทำงานปกติ:**
1. **ESP32 เชื่อมต่อ WiFi** ✅
2. **เชื่อมต่อ MQTT Broker** ✅
3. **ปรากฏใน Web Dashboard** ✅
4. **ควบคุม Relay ได้** ✅
5. **อ่านข้อมูล Sensor ได้** ✅

### **MQTT Messages ที่จะเห็น:**
```json
// Status Message
{
  "type": "relay_status",
  "device_id": "ESP32_AA5510",
  "device_name": "ESP32_4Relay",
  "data": {
    "relay1": false,
    "relay2": false,
    "relay3": false,
    "relay4": false
  }
}

// Sensor Data
{
  "type": "sensor_data", 
  "device_id": "ESP32_AA5510",
  "data": {
    "temperature": 28.5,
    "humidity": 65.2,
    "heat_index": 30.1
  }
}
```

---

## 🔧 **การแก้ไขปัญหา:**

### **หาก ESP32 ไม่ปรากฏ:**
1. รอ 2-3 นาทีหลัง setup WiFi
2. ตรวจสอบ IP address ใน MQTT code
3. Restart ESP32 (กดปุ่ม RESET)

### **หาก MQTT ไม่เชื่อมต่อ:**
1. ตรวจสอบ Docker MQTT Broker
2. ลอง restart Web App
3. เช็ค Browser Console (F12)

---

🚀 **ไปเริ่มทดสอบกันเลย!** 🚀
