# 🚀 ESP32 Upload Instructions

## 📋 **ขั้นตอนการ Upload โค้ด MQTT:**

### **1. 🔌 เชื่อมต่อ ESP32:**
- เสียบ USB cable เชื่อมต่อ ESP32
- ตรวจสอบว่ามีไฟ LED ติด

### **2. 📂 เปิด PlatformIO Project:**
```
File > Open Folder > เลือก: /Users/tatchakorn/Documents/React-Dashboard/esp32/
```

### **3. ⚡ Upload โค้ด:**

#### **วิธีที่ 1: ใช้ VS Code:**
1. เปิดไฟล์ `src/main_mqtt.cpp`
2. กด `Ctrl+Shift+P` (Windows/Linux) หรือ `Cmd+Shift+P` (Mac)
3. พิมพ์: `PlatformIO: Upload`
4. หรือคลิกปุ่ม Upload (→) ในแถบด้านล่าง

#### **วิธีที่ 2: ใช้ Terminal:**
```bash
cd /Users/tatchakorn/Documents/React-Dashboard/esp32
platformio run --target upload
```

### **4. 📺 ดู Serial Monitor:**
หลังจาก Upload เสร็จ:
1. เปิด Serial Monitor ใน PlatformIO
2. หรือใช้คำสั่ง: `platformio device monitor`
3. ดูข้อความจาก ESP32

## 🔧 **การตั้งค่าแรก:**

### **เมื่อ ESP32 เริ่มทำงานครั้งแรก:**

1. **📶 WiFi Setup:**
   ```
   ESP32 จะสร้าง WiFi Access Point:
   SSID: ESP32_Setup_XXXXXX
   Password: [ไม่มี]
   ```

2. **🌐 การตั้งค่า WiFi:**
   ```
   1. เชื่อมต่อ WiFi: ESP32_Setup_XXXXXX
   2. เปิดเบราว์เซอร์ไปที่: 192.168.4.1
   3. เลือก WiFi network ที่ต้องการ
   4. ใส่ password
   5. คลิก Save
   ```

3. **📡 MQTT Connection:**
   ```
   ESP32 จะเชื่อมต่อ MQTT Broker อัตโนมัติ:
   - Server: 192.168.1.28
   - Port: 1883
   - Device ID: ESP32_XXXXXX (จาก MAC Address)
   ```

## 📊 **สิ่งที่จะเห็นใน Serial Monitor:**

### **การเริ่มต้นระบบ:**
```
🚀 ESP32 4Relay MQTT Controller Starting...
📋 Device Info:
   ID: ESP32_ABCDEF
   Name: ESP32_4Relay
   MAC: AA:BB:CC:DD:EE:FF

🔧 Setting up GPIO pins...
✅ GPIO pins configured
🌡️ Initializing DHT22 sensor...
✅ DHT22 sensor ready
📶 Setting up WiFiManager...
✅ WiFi connected!
   IP: 192.168.1.100
   SSID: YourWiFiName
   RSSI: -45 dBm
📡 Setting up MQTT...
✅ MQTT configured
   Server: 192.168.1.28
   Port: 1883
🔗 Connecting to MQTT Broker...
✅ MQTT Connected! Client ID: ESP32_ABCDEF_A1B2
📨 Subscribed to: esp32/ESP32_ABCDEF/command
💓 Heartbeat sent
📤 Status published
```

### **การทำงานปกติ:**
```
🌡️ Sensor readings - Temp: 28.5°C, Humidity: 65.2%
📤 Sensor data published
📤 Status published
💓 Heartbeat sent
🔘 Button 1 pressed - Relay 1: ON
📤 Status published
📩 MQTT Message received:
   Topic: esp32/ESP32_ABCDEF/command
   Message: {"command":"relay","value":{"pin":25,"state":"on"}}
🎛️ Relay Command - Pin: 25, State: on
📤 Status published
```

## ⚠️ **การแก้ไขปัญหา:**

### **Upload ไม่ได้:**
1. ตรวจสอบ USB cable
2. กดปุ่ม BOOT บน ESP32 ขณะ Upload
3. ตรวจสอบ COM Port ใน Device Manager

### **WiFi เชื่อมต่อไม่ได้:**
1. Reset ESP32 (กดปุ่ม RESET)
2. ตั้งค่า WiFi ใหม่ผ่าน Access Point

### **MQTT เชื่อมต่อไม่ได้:**
1. ตรวจสอบ IP Address ใน `main_mqtt.cpp`
2. ตรวจสอบ MQTT Broker ยังทำงานอยู่:
   ```bash
   docker ps --filter "name=mosquitto"
   ```

---

## 🎉 **หลังจาก Upload เสร็จ:**

1. **ESP32 จะเชื่อมต่อ WiFi อัตโนมัติ**
2. **เชื่อมต่อ MQTT Broker**
3. **ปรากฏใน Web Dashboard**
4. **พร้อมใช้งานผ่าน Web App!**

---

**ต่อไปคือการทดสอบใน Web Application! 🌐**
