# MQTT Architecture Design

## 📋 System Overview

### Current Architecture (Home Assistant)
```
React App → Firebase → Home Assistant API → ESP32/Devices
```

### New Architecture (MQTT)
```
React App → Firebase → MQTT Broker → ESP32/Devices
```

## 🎯 Benefits of MQTT

### Performance
- **Real-time**: Instant communication
- **Lightweight**: Minimal bandwidth usage
- **Efficient**: Optimized for IoT devices

### Simplicity
- **No Home Assistant**: Direct MQTT communication
- **Simple Protocol**: Easy to implement
- **Flexible**: Custom message formats

### Reliability
- **QoS Levels**: Guaranteed message delivery
- **Persistent Sessions**: Automatic reconnection
- **Low Latency**: Near-instant response

## 🏗 Implementation Plan

### 1. MQTT Broker Setup
```bash
# Docker Compose for MQTT Broker
version: '3.8'
services:
  mosquitto:
    image: eclipse-mosquitto:latest
    container_name: mqtt-broker
    ports:
      - "1883:1883"  # MQTT
      - "9001:9001"  # WebSocket
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
    restart: unless-stopped
```

### 2. Topic Structure
```
company/
├── devices/
│   ├── lights/
│   │   ├── hr_dept/command
│   │   ├── hr_dept/status
│   │   ├── meeting_room_a/command
│   │   └── meeting_room_a/status
│   ├── airconditioner/
│   │   ├── it_dept/command
│   │   ├── it_dept/status
│   │   └── it_dept/temperature
│   └── sensors/
│       ├── temperature/
│       │   ├── it_dept
│       │   └── meeting_room_a
│       └── humidity/
│           ├── it_dept
│           └── meeting_room_a
└── system/
    ├── status
    └── config
```

### 3. Message Formats

#### Command Messages
```json
{
  "command": "turn_on|turn_off|toggle",
  "device_id": "lights_hr_dept",
  "timestamp": "2025-08-13T10:30:00Z",
  "user": "admin@company.com"
}
```

#### Status Messages
```json
{
  "device_id": "lights_hr_dept",
  "status": "on|off",
  "timestamp": "2025-08-13T10:30:00Z",
  "online": true
}
```

#### Sensor Data
```json
{
  "sensor_id": "temperature_it_dept",
  "value": 24.5,
  "unit": "°C",
  "timestamp": "2025-08-13T10:30:00Z"
}
```

## 🔧 React App Components

### MQTT Service
- Connection management
- Message publishing
- Subscription handling
- Real-time updates

### Device Controls
- Command sending
- Status monitoring
- Error handling

### Admin Panel
- MQTT configuration
- Device management
- Monitoring dashboard

## 📱 ESP32 Implementation

### Libraries
- PubSubClient (MQTT)
- ArduinoJson (JSON parsing)
- WiFi (Network connection)

### Features
- Auto-reconnection
- Status reporting
- Command execution
- Sensor data publishing

## 🔄 Migration Steps

1. **Setup MQTT Broker**
2. **Create MQTT Service**
3. **Update React Components**
4. **Modify ESP32 Code**
5. **Test Integration**
6. **Replace HA Components**

## 🚀 Advantages Over Home Assistant

### Resource Usage
- **MQTT Broker**: ~50MB RAM
- **Home Assistant**: ~500MB+ RAM

### Complexity
- **MQTT**: Direct protocol
- **HA**: Additional abstraction layer

### Customization
- **MQTT**: Full control over messages
- **HA**: Limited by HA entity model

### Real-time Performance
- **MQTT**: <10ms latency
- **HA**: 100-500ms through REST API
