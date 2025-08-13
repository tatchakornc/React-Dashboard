# ESP32 Dashboard Controller with WiFiManager

Advanced ESP32 controller that combines offline relay control with online Firebase dashboard integration.

## 🌟 Features

### Offline Operation:
- ✅ **4 Physical Inputs** → Toggle 4 Relays (works without WiFi)
- ✅ **Serial Commands** for testing (ON1, OFF1, STATUS, etc.)
- ✅ **Button Debouncing** for reliable input handling
- ✅ **Real-time Status** monitoring via Serial Monitor

### Online Operation:
- 🌐 **WiFiManager** for easy WiFi setup (no hardcoded credentials)
- 📊 **Firebase Integration** with React Dashboard
- 🌡️ **DHT22 Sensor** for temperature & humidity
- 🔄 **Bidirectional Control** (physical inputs + dashboard commands)
- 💚 **Online Status** tracking

## 🔧 Hardware Setup

### Pin Connections:
```
ESP32 Pin | Component              | Notes
----------|------------------------|---------------------------
25        | Relay 1 Control        | 
26        | Relay 2 Control        |
27        | Relay 3 Control        |
14        | Relay 4 Control        |
34        | Digital Input 1        | Requires external pull-up
35        | Digital Input 2        | Requires external pull-up  
32        | Digital Input 3        | Has internal pull-up
33        | Digital Input 4        | Has internal pull-up
4         | DHT22 Data Pin         |
2         | Status LED             |
3.3V      | DHT22 VCC, Pull-ups    |
GND       | Common Ground          |
```

### Pull-up Resistors:
- **GPIO 34 & 35:** Require **10kΩ external pull-up** resistors to 3.3V
- **GPIO 32 & 33:** Can use internal pull-ups (configured in code)

### Relay Module:
- Connect relay module **VCC** to **5V** or **3.3V** (depending on module)
- Connect relay **GND** to **ESP32 GND**
- Connect relay **IN1-IN4** to **GPIO 25,26,27,14**

## 📱 Software Setup

### 1. Firebase Configuration:
```cpp
#define API_KEY "your-firebase-api-key"
#define DATABASE_URL "https://your-project.firebaseio.com/"
#define USER_UID "your-user-uid-from-dashboard"
#define DEVICE_SN "ESP32_001"  // Unique for each device
```

### 2. WiFi Setup (First Boot):
1. **Power on ESP32**
2. **Connect to WiFi network:** `ESP32-Dashboard` (Password: `12345678`)
3. **Open browser:** Go to `192.168.4.1`
4. **Select your WiFi** and enter password
5. **ESP32 will connect** and save credentials

### 3. Installation:
1. **Install PlatformIO** extension in VS Code
2. **Open** `esp32` folder in VS Code
3. **Update Firebase settings** in `main.cpp`
4. **Connect ESP32** via USB
5. **Upload:** `Ctrl+Shift+P` → "PlatformIO: Upload"

## 🎮 Usage

### Serial Commands:
```
ON1, OFF1    - Control Relay 1
ON2, OFF2    - Control Relay 2  
ON3, OFF3    - Control Relay 3
ON4, OFF4    - Control Relay 4
STATUS       - Show current status
RESET_WIFI   - Reset WiFi settings
```

### Physical Operation:
- **Press Input 1** → Toggle Relay 1
- **Press Input 2** → Toggle Relay 2
- **Press Input 3** → Toggle Relay 3
- **Press Input 4** → Toggle Relay 4
- **Works offline** - no WiFi required

### Dashboard Integration:
1. **Add device** in React Dashboard with SN: `ESP32_001`
2. **Device will appear** in Dashboard automatically
3. **Control relays** from web interface
4. **View sensor data** in real-time
5. **Monitor online status**

## 📊 Data Flow

### ESP32 → Dashboard:
- **Temperature & Humidity** (every 5 seconds)
- **Relay States** (when changed)
- **Online Status** (every 30 seconds)

### Dashboard → ESP32:
- **Relay Control Commands**
- **Device Configuration**

## 🔧 Troubleshooting

### WiFi Issues:
- **Can't connect:** Send `RESET_WIFI` via Serial Monitor
- **No internet:** Check router settings, ESP32 will retry
- **Wrong password:** Reset WiFi and reconfigure

### Sensor Issues:
- **No DHT data:** Check wiring, ESP32 will use simulated data
- **Incorrect readings:** Verify DHT22 power supply (3.3V)

### Input Issues:
- **GPIO 34/35 not working:** Add 10kΩ pull-up resistors
- **False triggers:** Check button debouncing delay (50ms default)

### Firebase Issues:
- **Not connecting:** Verify API key and Database URL
- **No data:** Check USER_UID matches Dashboard user
- **Permission denied:** Update Firebase rules

## 📈 Serial Monitor Output:
```
=== ESP32 Dashboard Controller Starting ===
✓ Pins configured
WARNING: GPIO 34 & 35 require external 10k pull-up resistors
✓ DHT22 sensor initialized
Starting WiFiManager...
✓ WiFi connected successfully!
IP address: 192.168.1.100
Setting up Firebase...
✓ Firebase authentication successful
=== Setup Complete ===

Inputs: 1:1, 2:1, 3:1, 4:1 | WiFi:ON
📊 Temperature sent: 25.30°C
📊 Humidity sent: 60.20%
💚 Online status updated
Input 1 Toggled! Relay 1 is now: ON
🔄 Relay 1 state sent to Firebase: ON
🌐 Remote command: Relay 2 -> ON
```

## 🔄 Dual Operation Modes

### Offline Mode:
- All physical inputs work
- Serial commands work
- No cloud connectivity
- Status LED shows WiFi status

### Online Mode:
- Everything from offline mode
- **Plus:** Dashboard integration
- **Plus:** Remote control capability  
- **Plus:** Data logging to Firebase
- **Plus:** Real-time monitoring
