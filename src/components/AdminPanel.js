import React, { useState, useEffect } from 'react';
import { ref, get, set, onValue } from 'firebase/database';
import { db } from '../firebase';
import './AdminPanel.css';

const AdminPanel = ({ currentUser, userRole, showToast }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mqttConfig, setMqttConfig] = useState({
    brokerUrl: 'ws://localhost:8083/mqtt',
    username: '',
    password: ''
  });
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalDevices: 0,
    activeDevices: 0
  });

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    try {
      // โหลดข้อมูลระบบ
      const [usersSnapshot, devicesSnapshot] = await Promise.all([
        get(ref(db, 'members')),
        get(ref(db, 'mqtt_devices'))
      ]);

      let totalUsers = 0;
      let totalDevices = 0;
      let activeDevices = 0;

      // นับผู้ใช้
      if (usersSnapshot.exists()) {
        totalUsers = Object.keys(usersSnapshot.val()).length;
      }

      // นับอุปกรณ์
      if (devicesSnapshot.exists()) {
        const devices = devicesSnapshot.val();
        Object.values(devices).forEach(userDevices => {
          if (userDevices && typeof userDevices === 'object') {
            const deviceList = Object.values(userDevices);
            totalDevices += deviceList.length;
            activeDevices += deviceList.filter(device => device.status === 'online').length;
          }
        });
      }

      setSystemStats({
        totalUsers,
        totalDevices,
        activeDevices
      });

    } catch (error) {
      console.error('Error loading system data:', error);
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลระบบ', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const saveMqttConfig = async () => {
    try {
      const configRef = ref(db, 'system/mqtt_config');
      await set(configRef, mqttConfig);
      showToast('บันทึกการตั้งค่า MQTT สำเร็จ', 'success');
    } catch (error) {
      console.error('Error saving MQTT config:', error);
      showToast('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'error');
    }
  };

  if (userRole !== 'owner' && userRole !== 'admin') {
    return (
      <div className="admin-panel-error">
        <h2>⚠️ ไม่มีสิทธิ์เข้าถึง</h2>
        <p>เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงแผงควบคุมได้</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="admin-panel-loading">
        <div className="loading-spinner"></div>
        <p>กำลังโหลดข้อมูลระบบ...</p>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🔧 Admin Panel - MQTT Dashboard</h1>
        <div className="admin-info">
          <span>ผู้ดูแล: {currentUser?.displayName || currentUser?.email}</span>
          <span className="role-badge">{userRole}</span>
        </div>
      </div>

      <div className="admin-content">
        {/* System Statistics */}
        <div className="stats-section">
          <h2>📊 สถิติระบบ</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{systemStats.totalUsers}</h3>
                <p>ผู้ใช้ทั้งหมด</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📱</div>
              <div className="stat-info">
                <h3>{systemStats.totalDevices}</h3>
                <p>อุปกรณ์ทั้งหมด</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🟢</div>
              <div className="stat-info">
                <h3>{systemStats.activeDevices}</h3>
                <p>อุปกรณ์ออนไลน์</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <h3>{systemStats.totalDevices > 0 ? Math.round((systemStats.activeDevices / systemStats.totalDevices) * 100) : 0}%</h3>
                <p>อัตราการออนไลน์</p>
              </div>
            </div>
          </div>
        </div>

        {/* MQTT Configuration */}
        <div className="config-section">
          <h2>🔧 การตั้งค่า MQTT Broker</h2>
          <div className="config-form">
            <div className="form-group">
              <label>Broker URL:</label>
              <input
                type="text"
                value={mqttConfig.brokerUrl}
                onChange={(e) => setMqttConfig({...mqttConfig, brokerUrl: e.target.value})}
                placeholder="ws://localhost:8083/mqtt"
              />
            </div>
            
            <div className="form-group">
              <label>Username (ไม่บังคับ):</label>
              <input
                type="text"
                value={mqttConfig.username}
                onChange={(e) => setMqttConfig({...mqttConfig, username: e.target.value})}
                placeholder="mqtt_user"
              />
            </div>
            
            <div className="form-group">
              <label>Password (ไม่บังคับ):</label>
              <input
                type="password"
                value={mqttConfig.password}
                onChange={(e) => setMqttConfig({...mqttConfig, password: e.target.value})}
                placeholder="••••••••"
              />
            </div>
            
            <button onClick={saveMqttConfig} className="btn-save">
              💾 บันทึกการตั้งค่า
            </button>
          </div>
        </div>

        {/* System Management */}
        <div className="management-section">
          <h2>⚙️ การจัดการระบบ</h2>
          <div className="management-actions">
            <button 
              onClick={loadSystemData}
              className="btn-refresh"
            >
              🔄 รีเฟรชข้อมูล
            </button>
            
            <button 
              onClick={() => showToast('ฟีเจอร์นี้จะเปิดใช้งานในเร็วๆ นี้', 'info')}
              className="btn-export"
            >
              📊 ส่งออกรายงาน
            </button>
            
            <button 
              onClick={() => showToast('ฟีเจอร์นี้จะเปิดใช้งานในเร็วๆ นี้', 'info')}
              className="btn-backup"
            >
              💾 สำรองข้อมูล
            </button>
          </div>
        </div>

        {/* Information */}
        <div className="info-section">
          <h3>💡 คำแนะนำสำหรับผู้ดูแลระบบ</h3>
          <div className="info-content">
            <h4>📋 หน้าที่ของผู้ดูแลระบบ:</h4>
            <ul>
              <li>ตั้งค่า MQTT Broker สำหรับการเชื่อมต่ออุปกรณ์</li>
              <li>ตรวจสอบสถิติการใช้งานระบบ</li>
              <li>จัดการผู้ใช้และสิทธิ์การเข้าถึง</li>
              <li>ดูแลฐานข้อมูลและการสำรองข้อมูล</li>
            </ul>
            
            <h4>🔧 การตั้งค่า MQTT Broker:</h4>
            <ul>
              <li>URL เริ่มต้น: ws://localhost:8083/mqtt</li>
              <li>สามารถเปลี่ยนเป็น URL อื่นๆ ได้ตามต้องการ</li>
              <li>หากมี Username/Password ให้ใส่ในช่องที่กำหนด</li>
              <li>การตั้งค่าจะบันทึกลง Firebase อัตโนมัติ</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
