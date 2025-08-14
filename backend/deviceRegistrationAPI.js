// Device Registration API Backend
const express = require('express');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const app = express();
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project.firebaseio.com"
});

const db = admin.firestore();

// Generate unique device serial number
function generateSerialNumber() {
  const prefix = 'ESP32';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}_${timestamp}${random}`;
}

// 1. Manufacturing API - Create new device
app.post('/api/manufacturing/devices', async (req, res) => {
  try {
    const { device_type = '4Relay', firmware_version = '1.0.0' } = req.body;
    
    const serialNumber = generateSerialNumber();
    const deviceId = serialNumber;
    
    // Create device record
    const deviceData = {
      device_id: deviceId,
      serial_number: serialNumber,
      device_type,
      firmware_version,
      status: 'available', // available, registered, active
      manufacturing_date: admin.firestore.FieldValue.serverTimestamp(),
      last_seen: null,
      owner_id: null
    };
    
    await db.collection('devices').doc(deviceId).set(deviceData);
    
    // Generate QR Code
    const setupUrl = `https://yourapp.com/setup?sn=${serialNumber}`;
    const qrCodeDataUrl = await QRCode.toDataURL(setupUrl);
    
    res.json({
      success: true,
      device: deviceData,
      setup_url: setupUrl,
      qr_code: qrCodeDataUrl
    });
    
  } catch (error) {
    console.error('Manufacturing error:', error);
    res.status(500).json({ error: 'Manufacturing failed' });
  }
});

// 2. Customer Registration API - Register device to user
app.post('/api/devices/register', async (req, res) => {
  try {
    const { serial_number, device_name, user_id } = req.body;
    
    // Validate Firebase user
    await admin.auth().getUser(user_id);
    
    // Find device by serial number
    const devicesSnapshot = await db.collection('devices')
      .where('serial_number', '==', serial_number)
      .where('status', '==', 'available')
      .get();
    
    if (devicesSnapshot.empty) {
      return res.status(404).json({ 
        error: 'Device not found or already registered' 
      });
    }
    
    const deviceDoc = devicesSnapshot.docs[0];
    const deviceData = deviceDoc.data();
    
    // Update device status
    await deviceDoc.ref.update({
      status: 'registered',
      owner_id: user_id,
      registered_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create user-device relationship
    const userDeviceData = {
      user_id,
      device_id: deviceData.device_id,
      device_name: device_name || `${deviceData.device_type} ${deviceData.serial_number}`,
      access_level: 'owner',
      permissions: ['read', 'write', 'share', 'delete'],
      added_at: admin.firestore.FieldValue.serverTimestamp(),
      last_accessed: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('user_devices').add(userDeviceData);
    
    res.json({
      success: true,
      device: {
        ...deviceData,
        device_name: userDeviceData.device_name,
        access_level: userDeviceData.access_level
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 3. Get user devices
app.get('/api/users/:user_id/devices', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Get user devices
    const userDevicesSnapshot = await db.collection('user_devices')
      .where('user_id', '==', user_id)
      .get();
    
    const devices = [];
    
    for (const doc of userDevicesSnapshot.docs) {
      const userDeviceData = doc.data();
      
      // Get device details
      const deviceDoc = await db.collection('devices')
        .doc(userDeviceData.device_id)
        .get();
      
      if (deviceDoc.exists) {
        const deviceData = deviceDoc.data();
        devices.push({
          ...deviceData,
          device_name: userDeviceData.device_name,
          access_level: userDeviceData.access_level,
          permissions: userDeviceData.permissions,
          last_accessed: userDeviceData.last_accessed
        });
      }
    }
    
    res.json({ devices });
    
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

// 4. Device control API
app.post('/api/devices/:device_id/control', async (req, res) => {
  try {
    const { device_id } = req.params;
    const { user_id, command, pin, state } = req.body;
    
    // Check user permission
    const userDeviceSnapshot = await db.collection('user_devices')
      .where('user_id', '==', user_id)
      .where('device_id', '==', device_id)
      .where('permissions', 'array-contains', 'write')
      .get();
    
    if (userDeviceSnapshot.empty) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Send MQTT command (implement your MQTT client here)
    const mqttCommand = {
      command,
      value: { pin, state }
    };
    
    // Log the command
    await db.collection('device_logs').add({
      device_id,
      user_id,
      command: mqttCommand,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true, command: mqttCommand });
    
  } catch (error) {
    console.error('Control error:', error);
    res.status(500).json({ error: 'Control failed' });
  }
});

// 5. Device status API
app.get('/api/devices/:device_id/status', async (req, res) => {
  try {
    const { device_id } = req.params;
    const { user_id } = req.query;
    
    // Check user permission
    const userDeviceSnapshot = await db.collection('user_devices')
      .where('user_id', '==', user_id)
      .where('device_id', '==', device_id)
      .where('permissions', 'array-contains', 'read')
      .get();
    
    if (userDeviceSnapshot.empty) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get device status from database or MQTT
    const deviceDoc = await db.collection('devices').doc(device_id).get();
    
    if (!deviceDoc.exists) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    const deviceData = deviceDoc.data();
    
    res.json({
      device_id,
      status: deviceData.status,
      last_seen: deviceData.last_seen,
      // Add real-time status from MQTT here
    });
    
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Device Registration API running on port ${PORT}`);
});

module.exports = app;
