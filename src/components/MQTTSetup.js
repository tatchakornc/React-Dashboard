import React, { useState, useEffect } from 'react';
import { ref, set, get } from 'firebase/database';
import { db } from '../firebase';
import './MQTTSetup.css';

const MQTTSetup = ({ onConfigSet, isConnected }) => {
  const [config, setConfig] = useState({
    host: 'localhost',
    port: 9001,
    protocol: 'ws',
    username: '',
    password: ''
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  // โหลดการตั้งค่าเดิม
  useEffect(() => {
    loadExistingConfig();
  }, []);

  const loadExistingConfig = async () => {
    try {
      const configRef = ref(db, 'mqtt/config');
      const snapshot = await get(configRef);
      
      if (snapshot.exists()) {
        const existingConfig = snapshot.val();
        setConfig(prev => ({ ...prev, ...existingConfig }));
      }
    } catch (error) {
      console.error('Error loading existing config:', error);
    }
  };

  // ทดสอบการเชื่อมต่อ
  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      // Import MQTT service dynamically
      const { default: mqttService } = await import('../services/mqttService');
      
      await mqttService.configure(config);
      
      setTestResult({
        success: true,
        message: '✅ เชื่อมต่อ MQTT Broker สำเร็จ!'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `❌ เกิดข้อผิดพลาด: ${error.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  // บันทึกการตั้งค่า
  const saveConfig = async () => {
    setSaving(true);
    
    try {
      const configRef = ref(db, 'mqtt/config');
      await set(configRef, config);
      
      if (onConfigSet) {
        onConfigSet(config);
      }
      
      setTestResult({
        success: true,
        message: '✅ บันทึกการตั้งค่าสำเร็จ!'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `❌ เกิดข้อผิดพลาดในการบันทึก: ${error.message}`
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await testConnection();
  };

  if (isConnected) {
    return (
      <div className="mqtt-setup-success">
        <div className="success-content">
          <div className="success-icon">🚀</div>
          <h2>เชื่อมต่อ MQTT สำเร็จ!</h2>
          <p>ระบบพร้อมใช้งานแล้ว</p>
          <div className="connection-info">
            <p><strong>Broker:</strong> {config.host}:{config.port}</p>
            <p><strong>Protocol:</strong> {config.protocol}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mqtt-setup-container">
      <div className="mqtt-setup-card">
        <div className="mqtt-setup-header">
          <h2>🔧 ตั้งค่า MQTT Broker</h2>
          <p>กำหนดค่าการเชื่อมต่อ MQTT เพื่อควบคุมอุปกรณ์ IoT</p>
        </div>

        <form onSubmit={handleSubmit} className="mqtt-config-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="host">🌐 Host/IP Address</label>
              <input
                type="text"
                id="host"
                value={config.host}
                onChange={(e) => setConfig(prev => ({ ...prev, host: e.target.value }))}
                placeholder="localhost หรือ IP address"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="port">🔌 Port</label>
              <input
                type="number"
                id="port"
                value={config.port}
                onChange={(e) => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                placeholder="9001"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="protocol">📡 Protocol</label>
            <select
              id="protocol"
              value={config.protocol}
              onChange={(e) => setConfig(prev => ({ ...prev, protocol: e.target.value }))}
            >
              <option value="ws">WebSocket (ws)</option>
              <option value="wss">WebSocket Secure (wss)</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">👤 Username (ถ้ามี)</label>
              <input
                type="text"
                id="username"
                value={config.username}
                onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                placeholder="ไม่จำเป็นถ้า broker ไม่ต้องการ auth"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">🔐 Password (ถ้ามี)</label>
              <input
                type="password"
                id="password"
                value={config.password}
                onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                placeholder="ไม่จำเป็นถ้า broker ไม่ต้องการ auth"
              />
            </div>
          </div>

          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              {testResult.message}
            </div>
          )}

          <div className="button-group">
            <button 
              type="submit" 
              className="test-btn"
              disabled={testing}
            >
              {testing ? '⏳ กำลังทดสอบ...' : '🔍 ทดสอบการเชื่อมต่อ'}
            </button>
            
            {testResult?.success && (
              <button 
                type="button"
                className="save-btn"
                onClick={saveConfig}
                disabled={saving}
              >
                {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกการตั้งค่า'}
              </button>
            )}
          </div>
        </form>

        <div className="mqtt-info">
          <h3>📋 ข้อมูลการตั้งค่า</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>WebSocket Port:</strong> 9001 (ปกติ)
            </div>
            <div className="info-item">
              <strong>MQTT Port:</strong> 1883 (สำหรับ ESP32)
            </div>
            <div className="info-item">
              <strong>Protocol:</strong> ws:// สำหรับ local, wss:// สำหรับ HTTPS
            </div>
          </div>
        </div>

        <div className="quick-setup">
          <h3>⚡ ตั้งค่าด่วน</h3>
          <button 
            type="button"
            className="quick-btn"
            onClick={() => setConfig(prev => ({
              ...prev,
              host: 'localhost',
              port: 9001,
              protocol: 'ws',
              username: '',
              password: ''
            }))}
          >
            🏠 Local Development
          </button>
        </div>
      </div>
    </div>
  );
};

export default MQTTSetup;
