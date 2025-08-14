import React, { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { db, auth } from '../firebase';
import { updatePassword } from 'firebase/auth';

const Settings = ({ currentUser, showToast }) => {
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: true,
    autoRefresh: true,
    refreshInterval: 5000
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [currentUser?.uid]);

  const loadSettings = async () => {
    if (!currentUser?.uid) return;

    try {
      const settingsRef = ref(db, `users/${currentUser.uid}/settings`);
      const snapshot = await get(settingsRef);
      
      if (snapshot.exists()) {
        setSettings({ ...settings, ...snapshot.val() });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('❌ เกิดข้อผิดพลาดในการโหลดการตั้งค่า', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!currentUser?.uid) return;

    try {
      const settingsRef = ref(db, `users/${currentUser.uid}/settings`);
      await set(settingsRef, settings);
      showToast('✅ บันทึกการตั้งค่าสำเร็จ');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('❌ เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'error');
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return null;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>⚙️ การตั้งค่า</h2>
        <p>ปรับแต่งการใช้งานตามความต้องการ</p>
      </div>
      <div className="settings-content">
        <div className="settings-section">
          <h3>🎨 การแสดงผล</h3>
          <div className="setting-item">
            <label>ธีม</label>
            <select 
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
            >
              <option value="light">สว่าง</option>
              <option value="dark">มืด</option>
              <option value="auto">อัตโนมัติ</option>
            </select>
          </div>
        </div>
        <div className="settings-section">
          <h3>🔔 การแจ้งเตือน</h3>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleSettingChange('notifications', e.target.checked)}
              />
              เปิดการแจ้งเตือน
            </label>
          </div>
        </div>
        <div className="settings-section">
          <h3>🔄 การอัปเดต</h3>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
              />
              อัปเดตข้อมูลอัตโนมัติ
            </label>
          </div>
          {settings.autoRefresh && (
            <div className="setting-item">
              <label>ความถี่ในการอัปเดต (วินาที)</label>
              <select 
                value={settings.refreshInterval}
                onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
              >
                <option value={1000}>1 วินาที</option>
                <option value={5000}>5 วินาที</option>
                <option value={10000}>10 วินาที</option>
                <option value={30000}>30 วินาที</option>
              </select>
            </div>
          )}
          <div className="settings-section">
            <h3>👤 ข้อมูลผู้ใช้</h3>
            <div className="setting-item">
              <label>อีเมล</label>
              <input type="text" value={currentUser?.email || ''} disabled />
            </div>
            <div className="setting-item">
              <label>User ID</label>
              <input type="text" value={currentUser?.uid || ''} disabled />
            </div>
          </div>
          {/* เพิ่มฟอร์มเปลี่ยนรหัสผ่านที่นี่ถ้าต้องการ */}
          <div className="settings-actions">
            <button onClick={saveSettings} className="save-btn">
              💾 บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Settings;
