import React, { useState } from 'react';
import { ref, push } from 'firebase/database';
import { db } from '../firebase';
import './AddDevice.css';

const AddDevice = ({ currentUser, showToast, setCurrentPage }) => {
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState('relay4');
  const [deviceLocation, setDeviceLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const deviceTypes = [
    { value: 'relay4', label: '4-Channel Relay Controller', icon: '🎛️' },
    { value: 'relay8', label: '8-Channel Relay Controller', icon: '🎛️' },
    { value: 'led', label: 'LED Controller', icon: '💡' },
    { value: 'sensor', label: 'Sensor Module', icon: '🌡️' },
    { value: 'weather', label: 'Weather Station', icon: '🌦️' },
    { value: 'switch', label: 'Smart Switch', icon: '🔌' }
  ];

  const getDeviceConfig = (type) => {
    switch (type) {
      case 'relay4':
        return {
          pins: [
            { id: 'relay1', name: 'Relay 1', pin: 25, state: false },
            { id: 'relay2', name: 'Relay 2', pin: 26, state: false },
            { id: 'relay3', name: 'Relay 3', pin: 27, state: false },
            { id: 'relay4', name: 'Relay 4', pin: 14, state: false }
          ],
          sensors: [
            { id: 'temp', name: 'อุณหภูมิ', value: '--', unit: '°C' },
            { id: 'humidity', name: 'ความชื้น', value: '--', unit: '%' },
            { id: 'heat_index', name: 'ดัชนีความร้อน', value: '--', unit: '°C' }
          ]
        };
      
      case 'relay8':
        return {
          pins: [
            { id: 'relay1', name: 'Relay 1', pin: 25, state: false },
            { id: 'relay2', name: 'Relay 2', pin: 26, state: false },
            { id: 'relay3', name: 'Relay 3', pin: 27, state: false },
            { id: 'relay4', name: 'Relay 4', pin: 14, state: false },
            { id: 'relay5', name: 'Relay 5', pin: 12, state: false },
            { id: 'relay6', name: 'Relay 6', pin: 13, state: false },
            { id: 'relay7', name: 'Relay 7', pin: 32, state: false },
            { id: 'relay8', name: 'Relay 8', pin: 33, state: false }
          ]
        };
      
      case 'led':
        return {
          pins: [
            { id: 'led1', name: 'LED 1', pin: 2, state: false },
            { id: 'led2', name: 'LED 2', pin: 4, state: false },
            { id: 'led3', name: 'LED 3', pin: 5, state: false }
          ]
        };
      
      case 'sensor':
        return {
          sensors: [
            { id: 'temp', name: 'อุณหภูมิ', value: '--', unit: '°C' },
            { id: 'humidity', name: 'ความชื้น', value: '--', unit: '%' }
          ]
        };
      
      case 'weather':
        return {
          sensors: [
            { id: 'temp', name: 'อุณหภูมิ', value: '--', unit: '°C' },
            { id: 'humidity', name: 'ความชื้น', value: '--', unit: '%' },
            { id: 'pressure', name: 'ความกดอากาศ', value: '--', unit: 'hPa' },
            { id: 'wind_speed', name: 'ความเร็วลม', value: '--', unit: 'm/s' }
          ]
        };
      
      default:
        return { pins: [], sensors: [] };
    }
  };

  const generateDeviceId = () => {
    const prefix = deviceType.toUpperCase();
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    return `${prefix}_${timestamp}${random}`.toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!deviceName.trim()) {
      showToast('กรุณาใส่ชื่ออุปกรณ์', 'error');
      return;
    }

    setLoading(true);

    try {
      const config = getDeviceConfig(deviceType);
      const deviceId = generateDeviceId();

      // สร้างข้อมูลอุปกรณ์
      const deviceData = {
        id: deviceId,
        device_id: deviceId,
        name: deviceName.trim(),
        type: deviceType,
        location: deviceLocation.trim(),
        status: 'offline',
        createdAt: Date.now(),
        createdBy: currentUser.uid,
        lastUpdate: null,
        ...config
      };

      // เพิ่มลง Firebase
      await push(ref(db, `mqtt_devices/${currentUser.uid}`), deviceData);
      
      showToast(`🎉 เพิ่มอุปกรณ์ "${deviceName}" สำเร็จ!`, 'success');
      
      // รีเซ็ต form
      setDeviceName('');
      setDeviceLocation('');
      setDeviceType('relay4');
      
      // กลับไปหน้า dashboard
      setTimeout(() => {
        setCurrentPage('main');
      }, 1500);
      
    } catch (error) {
      console.error('Error adding device:', error);
      showToast('❌ เกิดข้อผิดพลาดในการเพิ่มอุปกรณ์', 'error');
    }

    setLoading(false);
  };

  return (
    <div className="add-device-container">
      <div className="add-device-header">
        <h1 className="add-device-title">📱 เพิ่มอุปกรณ์ใหม่</h1>
        <p className="add-device-subtitle">เพิ่มอุปกรณ์ IoT เข้าสู่ระบบ MQTT Dashboard</p>
      </div>

      <div className="add-device-content">
        <form onSubmit={handleSubmit} className="add-device-form">
          <div className="form-group">
            <label htmlFor="deviceName" className="form-label">
              <i className="fas fa-tag"></i>
              ชื่ออุปกรณ์ *
            </label>
            <input
              id="deviceName"
              type="text"
              className="form-input"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="เช่น: ไฟห้องนั่งเล่น, แอร์ห้องนอน, เครื่องปั๊มน้ำ"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="deviceType" className="form-label">
              <i className="fas fa-microchip"></i>
              ประเภทอุปกรณ์ *
            </label>
            <select
              id="deviceType"
              className="form-select"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              required
            >
              {deviceTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="deviceLocation" className="form-label">
              <i className="fas fa-map-marker-alt"></i>
              ตำแหน่งติดตั้ง
            </label>
            <input
              id="deviceLocation"
              type="text"
              className="form-input"
              value={deviceLocation}
              onChange={(e) => setDeviceLocation(e.target.value)}
              placeholder="เช่น: ห้องนั่งเล่น, ห้องครัว, ห้องนอนใหญ่, สวนหลังบ้าน"
            />
          </div>

          <div className="device-preview">
            <h3>📋 ตัวอย่างการกำหนดค่า</h3>
            <div className="preview-content">
              <div className="preview-item">
                <strong>ประเภท:</strong> {deviceTypes.find(t => t.value === deviceType)?.label}
              </div>
              {getDeviceConfig(deviceType).pins?.length > 0 && (
                <div className="preview-item">
                  <strong>จำนวน Pins:</strong> {getDeviceConfig(deviceType).pins.length}
                </div>
              )}
              {getDeviceConfig(deviceType).sensors?.length > 0 && (
                <div className="preview-item">
                  <strong>จำนวน Sensors:</strong> {getDeviceConfig(deviceType).sensors.length}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => setCurrentPage('main')}
              disabled={loading}
            >
              <i className="fas fa-arrow-left"></i>
              ยกเลิก
            </button>
            
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  กำลังเพิ่มอุปกรณ์...
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i>
                  เพิ่มอุปกรณ์
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="add-device-info">
        <h3>💡 คำแนะนำ</h3>
        <ul>
          <li>กรอกชื่ออุปกรณ์ที่เข้าใจง่าย เพื่อความสะดวกในการจัดการ</li>
          <li>เลือกประเภทอุปกรณ์ให้ตรงกับฮาร์ดแวร์จริง</li>
          <li>ระบุตำแหน่งติดตั้งเพื่อง่ายต่อการค้นหา</li>
          <li>อุปกรณ์จะปรากฏใน Dashboard หลังจากเพิ่มเรียบร้อยแล้ว</li>
        </ul>
      </div>
    </div>
  );
};

export default AddDevice;
