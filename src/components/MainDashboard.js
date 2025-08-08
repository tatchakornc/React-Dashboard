import React, { useState, useEffect } from 'react';
import { ref, get, update, remove } from 'firebase/database';
import { db } from '../firebase';
import DeviceCard from './DeviceCard';

const MainDashboard = ({ currentUser, showToast }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDevices = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userDevicesRef = ref(db, `devices/${currentUser.uid}`);
      const snapshot = await get(userDevicesRef);
      const data = snapshot.val();
      
      if (data) {
        const devicesList = Object.entries(data).map(([id, device]) => ({
          id,
          ...device
        }));
        setDevices(devicesList);
      } else {
        setDevices([]);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      showToast('โหลดอุปกรณ์ไม่สำเร็จ', 'error');
    }
    setLoading(false);
  };

  const handleToggleDevice = async (deviceId, relayKey, newState) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    try {
      if (device.type === 'relay4' && device.sn && device.relayKey) {
        // สำหรับ relay4: อัปเดตใน devices_by_sn
        const stateRef = ref(db, `devices_by_sn/${device.sn}/state`);
        await update(stateRef, { [device.relayKey]: newState });
        
        // อัปเดต state ใน devices ของ user
        const userDeviceRef = ref(db, `devices/${currentUser.uid}/${deviceId}/state`);
        await update(userDeviceRef, { on: newState });
        
        showToast(`${newState ? 'เปิด' : 'ปิด'} ${device.relayKey.toUpperCase()} แล้ว`);
      } else {
        // อุปกรณ์ทั่วไป
        const deviceRef = ref(db, `devices/${currentUser.uid}/${deviceId}/state`);
        await update(deviceRef, { [relayKey]: newState });
        
        showToast(`${newState ? 'เปิด' : 'ปิด'} ${relayKey.toUpperCase()} แล้ว`);
      }
      
      // รีโหลดข้อมูล
      loadDevices();
    } catch (error) {
      console.error('Error toggling device:', error);
      showToast('เปลี่ยนสถานะอุปกรณ์ไม่สำเร็จ', 'error');
    }
  };

  const handleUpdateDeviceName = async (deviceId, newName) => {
    try {
      await update(ref(db, `devices/${currentUser.uid}/${deviceId}/name`), { name: newName });
      
      loadDevices();
      showToast('เปลี่ยนชื่ออุปกรณ์สำเร็จ');
    } catch (error) {
      console.error('Error updating device name:', error);
      showToast('เปลี่ยนชื่ออุปกรณ์ไม่สำเร็จ', 'error');
    }
  };

  const handleDeleteDevice = async (deviceId, deviceName) => {
    // ยืนยันการลบ
    const confirmDelete = window.confirm(
      `คุณแน่ใจหรือไม่ที่จะลบอุปกรณ์ "${deviceName}"?\n\nการลบจะไม่สามารถย้อนกลับได้`
    );
    
    if (!confirmDelete) return;

    try {
      // ลบอุปกรณ์จาก devices ของ user
      await remove(ref(db, `devices/${currentUser.uid}/${deviceId}`));
      
      // รีโหลดข้อมูล
      loadDevices();
      showToast(`ลบอุปกรณ์ "${deviceName}" สำเร็จ`);
    } catch (error) {
      console.error('Error deleting device:', error);
      showToast('ลบอุปกรณ์ไม่สำเร็จ', 'error');
    }
  };

  const getDeviceStats = () => {
    const online = devices.filter(d => d.online).length;
    const offline = devices.filter(d => !d.online).length;
    const total = devices.length;
    
    return { online, offline, total };
  };

  const stats = getDeviceStats();

  if (loading) {
    return (
      <div className="main-dashboard">
        <header className="header">
          <div className="header-left">
            <h1>แดชบอร์ดหลัก</h1>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="main-dashboard">
      <header className="header">
        <div className="header-left">
          <h1>แดชบอร์ดหลัก</h1>
          <p>จัดการและควบคุมอุปกรณ์ ESP32 ของคุณ</p>
        </div>
      </header>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon online">
              <i className="fas fa-plug"></i>
            </span>
            <span className="stat-value">{stats.online}</span>
          </div>
          <div className="stat-label">อุปกรณ์ออนไลน์</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon offline">
              <i className="fas fa-power-off"></i>
            </span>
            <span className="stat-value">{stats.offline}</span>
          </div>
          <div className="stat-label">อุปกรณ์ออฟไลน์</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">
              <i className="fas fa-list"></i>
            </span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-label">อุปกรณ์ทั้งหมด</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">
              <i className="fas fa-user"></i>
            </span>
            <span className="stat-value">-</span>
          </div>
          <div className="stat-label">ผู้ใช้งาน</div>
        </div>
      </div>
      
      <div className="devices-section">
        <h2>อุปกรณ์ของคุณ</h2>
        <div className="devices-grid">
          {devices.length === 0 ? (
            <div className="no-devices">
              <p>ไม่มีอุปกรณ์ในระบบ</p>
            </div>
          ) : (
            devices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                onToggle={handleToggleDevice}
                onUpdateName={handleUpdateDeviceName}
                onDelete={handleDeleteDevice}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
