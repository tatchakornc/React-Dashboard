# 🔧 MQTT Broker URL Configuration

## 📍 **Broker URLs สำหรับแต่ละการใช้งาน:**

### **🌐 สำหรับ Web Application (React):**
```
URL: ws://localhost:8083/mqtt
Protocol: WebSocket
Port: 8083
Username: [ว่างไว้]
Password: [ว่างไว้]
```

### **📱 สำหรับ ESP32:**
```
Server: 192.168.1.28
Port: 1883
Protocol: TCP MQTT
Username: [ว่างไว้]
Password: [ว่างไว้]
```

## 🔍 **ตรวจสอบการตั้งค่า:**

### **1. ตรวจสอบ Docker Broker:**
```bash
docker ps --filter "name=mosquitto"
```

### **2. ทดสอบ Connection:**
```bash
# ทดสอบ WebSocket (สำหรับ Web)
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: test" -H "Sec-WebSocket-Version: 13" http://localhost:8083/mqtt

# ทดสอบ TCP MQTT (สำหรับ ESP32)
mosquitto_pub -h localhost -p 1883 -t "test/topic" -m "hello"
```

## 🔧 **หากยังไม่ได้:**

### **แก้ไข Web App Configuration:**

1. **ใน MQTT Dashboard:**
   - Broker URL: `ws://localhost:8083/mqtt`
   - หรือลอง: `ws://127.0.0.1:8083/mqtt`

2. **หาก localhost ไม่ได้:**
   - ใช้ IP จริง: `ws://192.168.1.28:8083/mqtt`

### **ตรวจสอบ Firewall:**
```bash
# macOS - ตรวจสอบ ports
lsof -i :8083
lsof -i :1883
```

## 📋 **ข้อมูลสำคัญ:**

| การใช้งาน | URL | Port | Protocol |
|-----------|-----|------|----------|
| Web App | `ws://localhost:8083/mqtt` | 8083 | WebSocket |
| ESP32 | `192.168.1.28` | 1883 | TCP MQTT |
| Debug Tool | `http://localhost:4000` | 4000 | HTTP |

## 🎯 **วิธีการทดสอบ:**

### **1. ทดสอบใน Web Browser:**
1. เปิด `http://localhost:3000`
2. เข้า MQTT Dashboard
3. URL: `ws://localhost:8083/mqtt`
4. คลิก "เชื่อมต่อ"

### **2. ดู Browser Console:**
- กด F12 เปิด Developer Tools
- ดู Console tab
- มองหา error messages

### **3. ทดสอบด้วย MQTT Explorer:**
- เปิด `http://localhost:4000`
- Host: `localhost`
- Port: `1883`
- Protocol: `mqtt://`

---

## 🚨 **หากยังแก้ไม่ได้:**

ลอง restart Docker containers:
```bash
docker-compose -f docker-compose-mqtt.yml down
docker-compose -f docker-compose-mqtt.yml up -d
```

ตรวจสอบ network connectivity:
```bash
telnet localhost 8083
telnet localhost 1883
```
