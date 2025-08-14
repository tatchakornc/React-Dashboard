import React, { useState, useEffect } from 'react';
import { ref, onValue, off, remove } from 'firebase/database';
import { db } from '../firebase';
import { useMQTT } from '../hooks/useMQTT';
import DeviceCard from './DeviceCard';
import './MQTTDashboard.css';

const MQTTDashboard = ({ currentUser, showToast }) => {
  const [brokerConfig, setBrokerConfig] = useState({
    url: 'ws://localhost:8083/mqtt',
    username: '',
    password: ''
  });

  const [notificationShown, setNotificationShown] = useState(false);
  const [loadingPins, setLoadingPins] = useState(new Set());
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(true);

  // Load devices from Firebase
  useEffect(() => {
    if (!currentUser) {
      setLoadingDevices(false);
      return;
    }

    const devicesRef = ref(db, `mqtt_devices/${currentUser.uid}`);
    
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const devicesData = snapshot.val();
        const devicesList = Object.entries(devicesData).map(([key, device]) => ({
          id: key,
          device_id: key,
          ...device
        }));
        setDevices(devicesList);
        console.log('📱 Loaded devices:', devicesList);
      } else {
        setDevices([]);
        console.log('📱 No devices found for user');
      }
      setLoadingDevices(false);
    }, (error) => {
      console.error('❌ Error loading devices:', error);
      showToast('เกิดข้อผิดพลาดในการโหลดอุปกรณ์', 'error');
      setLoadingDevices(false);
    });

    return () => {
      off(devicesRef, 'value', unsubscribe);
    };
  }, [currentUser, showToast]);

  const {
    isConnected,
    connectionStatus,
    error,
    lastMessage,
    connect,
    disconnect,
    subscribe,
    publish,
    controlLED,
    controlRelay,
    requestSensorData
  } = useMQTT(brokerConfig);

  // Subscribe to device status topics
  useEffect(() => {
    if (isConnected) {
      // Subscribe to all ESP32 topics (general patterns)
      subscribe('esp32/+/status', handleDeviceMessage);
      subscribe('esp32/+/sensor', handleDeviceMessage);
      subscribe('esp32/+/heartbeat', handleDeviceMessage);
    }
  }, [isConnected]);

  // Handle connection success notification (only once)
  useEffect(() => {
    if (isConnected && connectionStatus === 'connected' && !notificationShown) {
      showToast('✅ เชื่อมต่อ MQTT สำเร็จ', 'success');
      setNotificationShown(true);
    } else if (!isConnected) {
      setNotificationShown(false);
    }
  }, [connectionStatus, isConnected, notificationShown]);

  // Handle connection errors
  useEffect(() => {
    if (error) {
      showToast(`❌ MQTT Error: ${error}`, 'error');
    }
  }, [error]);

  // Handle all device messages
  const handleDeviceMessage = (topic, message) => {
    try {
      const data = JSON.parse(message);
      const deviceId = data.device_id || topic.split('/')[1];
      
      console.log('MQTT Message:', { topic, data });

      // Update device status based on message type
      setDevices(prevDevices => 
        prevDevices.map(device => {
          if (device.id === deviceId) {
            const updatedDevice = { ...device };
            
            // Handle different message types
            switch (data.type) {
              case 'relay_status':
                if (data.data && updatedDevice.pins) {
                  // Only update if there's a significant change or it's been a while
                  const shouldUpdate = updatedDevice.pins.some((pin, index) => {
                    const relayKey = `relay${index + 1}`;
                    const newState = data.data[relayKey] || false;
                    return pin.state !== newState;
                  });
                  
                  if (shouldUpdate) {
                    updatedDevice.pins = updatedDevice.pins.map((pin, index) => {
                      const relayKey = `relay${index + 1}`;
                      return {
                        ...pin,
                        state: data.data[relayKey] || false
                      };
                    });
                  }
                }
                updatedDevice.status = 'online';
                updatedDevice.lastUpdate = Date.now();
                break;
                
              case 'sensor_data':
                if (data.data && updatedDevice.sensors) {
                  updatedDevice.sensors = updatedDevice.sensors.map(sensor => {
                    switch (sensor.id) {
                      case 'temp':
                        return { ...sensor, value: data.data.temperature || '--' };
                      case 'humidity':
                        return { ...sensor, value: data.data.humidity || '--' };
                      case 'heat_index':
                        return { ...sensor, value: data.data.heat_index || '--' };
                      default:
                        return sensor;
                    }
                  });
                }
                break;
                
              case 'heartbeat':
                updatedDevice.status = 'online';
                updatedDevice.ip = data.ip_address;
                updatedDevice.rssi = data.wifi_rssi;
                updatedDevice.uptime = data.uptime;
                break;
            }
            
            return updatedDevice;
          }
          return device;
        })
      );
    } catch (error) {
      console.error('Error parsing MQTT message:', error, { topic, message });
    }
  };

  // Handle device status updates (legacy)
  const handleDeviceStatus = (topic, message) => {
    try {
      const data = JSON.parse(message);
      const deviceId = topic.split('/')[1];
      
      setDevices(prevDevices => 
        prevDevices.map(device => {
          if (device.id === deviceId && device.pins) {
            const updatedPins = device.pins.map(pin => {
              if (data.pin === pin.pin) {
                return { ...pin, state: data.state === 'on' };
              }
              return pin;
            });
            return { ...device, pins: updatedPins };
          }
          return device;
        })
      );
    } catch (error) {
      console.error('Error parsing device status:', error);
    }
  };

  // Handle sensor data
  const handleSensorData = (topic, message) => {
    try {
      const data = JSON.parse(message);
      const deviceId = topic.split('/')[1];
      
      setDevices(prevDevices => 
        prevDevices.map(device => {
          if (device.id === deviceId && device.sensors) {
            const updatedSensors = device.sensors.map(sensor => {
              if (data[sensor.id] !== undefined) {
                return { ...sensor, value: data[sensor.id] };
              }
              return sensor;
            });
            return { ...device, sensors: updatedSensors };
          }
          return device;
        })
      );
    } catch (error) {
      console.error('Error parsing sensor data:', error);
    }
  };

  // Toggle LED
  const toggleLED = (deviceId, pin) => {
    const device = devices.find(d => d.id === deviceId);
    const pinData = device?.pins?.find(p => p.pin === pin);
    
    if (pinData) {
      const newState = !pinData.state;
      
      // อัพเดท UI ทันที (optimistic update)
      setDevices(prevDevices => 
        prevDevices.map(d => {
          if (d.id === deviceId) {
            return {
              ...d,
              pins: d.pins.map(p => 
                p.pin === pin ? { ...p, state: newState } : p
              )
            };
          }
          return d;
        })
      );
      
      controlLED(deviceId, pin, newState);
      showToast(`${newState ? 'เปิด' : 'ปิด'} LED ${pin}`, 'info');
    }
  };

  // Toggle Relay (ESP32 format)
  const toggleRelay = (deviceId, relayNum) => {
    const device = devices.find(d => d.id === deviceId);
    const relay = device?.pins?.find(p => p.name.includes(relayNum));
    
    if (relay) {
      const pinKey = `${deviceId}_${relay.pin}`;
      const newState = !relay.state;
      
      // เพิ่ม loading state
      setLoadingPins(prev => new Set([...prev, pinKey]));
      
      // อัพเดท UI ทันที (optimistic update)
      setDevices(prevDevices => 
        prevDevices.map(d => {
          if (d.id === deviceId) {
            return {
              ...d,
              pins: d.pins.map(p => 
                p.name.includes(relayNum) ? { ...p, state: newState } : p
              )
            };
          }
          return d;
        })
      );
      
      const command = {
        command: "relay",
        value: {
          pin: relay.pin,
          state: newState ? "on" : "off"
        }
      };
      
      // Send command to ESP32
      publish(`esp32/${deviceId}/command`, JSON.stringify(command));
      showToast(`${newState ? 'เปิด' : 'ปิด'} Relay ${relayNum}`, 'info');
      
      // ลบ loading state หลัง 500ms
      setTimeout(() => {
        setLoadingPins(prev => {
          const newSet = new Set(prev);
          newSet.delete(pinKey);
          return newSet;
        });
      }, 500);
    }
  };

  // Toggle Relay (legacy)
  const toggleRelayLegacy = (deviceId, relayNum) => {
    const device = devices.find(d => d.id === deviceId);
    const relay = device?.pins?.find(p => p.name.includes(relayNum));
    
    if (relay) {
      const newState = !relay.state;
      controlRelay(deviceId, relayNum, newState);
      showToast(`${newState ? 'เปิด' : 'ปิด'} Relay ${relayNum}`, 'info');
    }
  };

  // Request sensor data
  const refreshSensorData = (deviceId) => {
    requestSensorData(deviceId);
    showToast('ขอข้อมูลเซ็นเซอร์แล้ว', 'info');
  };

  // Connect/Disconnect MQTT
  const handleConnectionToggle = () => {
    if (isConnected) {
      disconnect();
      showToast('ตัดการเชื่อมต่อ MQTT', 'info');
    } else {
      if (!brokerConfig.url) {
        showToast('❌ กรุณาระบุ URL ของ MQTT Broker', 'error');
        return;
      }
      connect(brokerConfig);
      showToast('กำลังเชื่อมต่อ MQTT...', 'info');
    }
  };

  // ฟังก์ชันลบ device
  const deleteDevice = async (device) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบอุปกรณ์ "${device.name || device.device_id}" (ID: ${device.device_id})?`)) return;
    try {
      // อ่าน snapshot ทั้งหมดใน mqtt_devices/${currentUser.uid}
      const devicesRef = ref(db, `mqtt_devices/${currentUser.uid}`);
      const snapshot = await import('firebase/database').then(({ get }) => get(devicesRef));
      if (snapshot.exists()) {
        const devicesData = snapshot.val();
        // ลบทุก entry ที่ device_id ตรงกัน
        await Promise.all(Object.entries(devicesData).map(async ([key, value]) => {
          if (value.device_id === device.device_id) {
            await remove(ref(db, `mqtt_devices/${currentUser.uid}/${key}`));
          }
        }));
      }
      // อัปเดต UI ทันที
      setDevices(prev => prev.filter(d => d.device_id !== device.device_id));
      showToast(`✅ ลบอุปกรณ์ "${device.name || device.device_id}" ออกจากระบบแล้ว`, 'success');
    } catch (error) {
      showToast('❌ เกิดข้อผิดพลาดในการลบอุปกรณ์', 'error');
      console.error(error);
    }
  };

  return (
    <div className="mqtt-dashboard">
      {/* MQTT Connection Status */}
      <div className="mqtt-status-panel">
        <div className="status-header">
          <h3>📡 MQTT Connection</h3>
          <div className={`status-indicator ${connectionStatus}`}>
            {connectionStatus === 'connected' && '🟢 เชื่อมต่อแล้ว'}
            {connectionStatus === 'connecting' && '🟡 กำลังเชื่อมต่อ...'}
            {connectionStatus === 'disconnected' && '🔴 ตัดการเชื่อมต่อ'}
            {connectionStatus === 'error' && '❌ เกิดข้อผิดพลาด'}
          </div>
        </div>

        <div className="connection-config">
          <div className="config-row">
            <label>Broker URL:</label>
            <input
              type="text"
              value={brokerConfig.url}
              onChange={(e) => setBrokerConfig({...brokerConfig, url: e.target.value})}
              disabled={isConnected}
              placeholder="ws://localhost:8083/mqtt"
            />
          </div>
          <div className="config-row">
            <label>Username:</label>
            <input
              type="text"
              value={brokerConfig.username}
              onChange={(e) => setBrokerConfig({...brokerConfig, username: e.target.value})}
              disabled={isConnected}
              placeholder="Optional"
            />
          </div>
          <div className="config-row">
            <label>Password:</label>
            <input
              type="password"
              value={brokerConfig.password}
              onChange={(e) => setBrokerConfig({...brokerConfig, password: e.target.value})}
              disabled={isConnected}
              placeholder="Optional"
            />
          </div>
        </div>

        <button 
          onClick={handleConnectionToggle}
          className={`connection-btn ${isConnected ? 'disconnect' : 'connect'}`}
        >
          {isConnected ? '🔌 ตัดการเชื่อมต่อ' : '🔗 เชื่อมต่อ'}
        </button>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}
      </div>

      {/* Device Controls */}
      <div className="devices-grid">
        {loadingDevices ? (
          <div className="loading-devices">
            <span className="loading-spinner"></span>
          </div>
        ) : devices.length === 0 ? (
          <div className="no-devices">
            <div className="no-devices-icon">📱</div>
            <h3>ยังไม่มีอุปกรณ์</h3>
            <p>กรุณาเพิ่มอุปกรณ์ใหม่เพื่อเริ่มใช้งาน</p>
            <p>หรือไปที่หน้า "เพิ่มอุปกรณ์" เพื่อลงทะเบียนอุปกรณ์ ESP32</p>
          </div>
        ) : (
          Array.from(new Map(devices.map(d => [d.device_id, d])).values()).map((device, index) => (
          <div key={`${device.device_id}_${index}`} className="device-card">
            <div className="device-header">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                  <h4>{device.name || device.device_id}</h4>
                  <span className="device-id">ID: {device.device_id}</span>
                </div>
                <button
                  className="delete-device-btn"
                  title="ลบอุปกรณ์"
                  onClick={() => deleteDevice(device)}
                  style={{marginLeft: 8, background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 18}}
                >
                  🗑️
                </button>
              </div>
              <div className="device-status">
                <span className={`status-dot ${device.status || 'offline'}`}></span>
                <span className="status-text">
                  {device.status === 'online' ? '🟢 Online' : '🔴 Offline'}
                </span>
                {device.ip && (
                  <span className="device-ip">📍 {device.ip}</span>
                )}
                {device.rssi && (
                  <span className="wifi-signal">📶 {device.rssi} dBm</span>
                )}
              </div>
            </div>

            {/* LED/Relay Controls */}
            {device.pins && (
              <div className="device-controls">
                <h5>🎛️ Controls</h5>
                <div className="controls-grid">
                  {device.pins.map(pin => {
                    const pinKey = `${device.id}_${pin.pin}`;
                    const isLoading = loadingPins.has(pinKey);
                    
                    return (
                      <div key={pin.id} className="control-item">
                        <span className="control-name">{pin.name}</span>
                        <button
                          onClick={() => {
                            if (device.type === 'led_controller') {
                              toggleLED(device.id, pin.pin);
                            } else if (device.type === 'relay_controller') {
                              toggleRelay(device.id, pin.name.match(/\d+/)?.[0]);
                            }
                          }}
                          className={`control-btn ${pin.state ? 'on' : 'off'} ${isLoading ? 'loading' : ''}`}
                          disabled={!isConnected || isLoading}
                        >
                          {isLoading ? (
                            <>⏳ <span className="spinner">🔄</span></>
                          ) : (
                            pin.state ? 'ON' : 'OFF'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sensor Data */}
            {device.sensors && (
              <div className="device-sensors">
                <div className="sensors-header">
                  <h5>📊 Sensors</h5>
                  <button
                    onClick={() => refreshSensorData(device.id)}
                    className="refresh-btn"
                    disabled={!isConnected}
                  >
                    🔄
                  </button>
                </div>
                <div className="sensors-grid">
                  {device.sensors.map(sensor => (
                    <div key={sensor.id} className="sensor-item">
                      <span className="sensor-name">{sensor.name}</span>
                      <span className="sensor-value">
                        {sensor.value} {sensor.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
        )}
      </div>

      {/* Last Message Debug */}
      {lastMessage && (
        <div className="debug-panel">
          <h5>📨 Last Message</h5>
          <div className="message-info">
            <div><strong>Topic:</strong> {lastMessage.topic}</div>
            <div><strong>Message:</strong> {lastMessage.message}</div>
            <div><strong>Time:</strong> {new Date(lastMessage.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MQTTDashboard;
