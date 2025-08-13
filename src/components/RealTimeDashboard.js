import React, { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, push } from 'firebase/database';
import { db } from '../firebase';
import { DEVICE_TYPES, DASHBOARD_COMPONENTS } from '../config/deviceTypes';
import DeviceTypeSelector from './DeviceTypeSelector';
import { 
  SwitchDashboard, 
  GaugeDashboard, 
  LockDashboard, 
  SpeedometerDashboard, 
  MotionDashboard 
} from './DashboardComponents';
import { 
  TankDashboard, 
  MapDashboard, 
  CameraDashboard, 
  CounterDashboard 
} from './AdvancedDashboardComponents';

const RealTimeDashboard = ({ user, showToast }) => {
  const [devices, setDevices] = useState({});
  const [deviceTypes, setDeviceTypes] = useState({});
  const [deviceData, setDeviceData] = useState({});

  // Component mapping
  const componentMap = {
    SwitchDashboard,
    GaugeDashboard,
    LockDashboard,
    SpeedometerDashboard,
    MotionDashboard,
    TankDashboard,
    MapDashboard,
    CameraDashboard,
    CounterDashboard
  };

  // Load devices and their types
  useEffect(() => {
    if (!user) {
      console.log('❌ No user provided to RealTimeDashboard');
      return;
    }
    
    console.log('🔄 Loading data for user:', user.uid);

    const devicesRef = ref(db, `devices/${user.uid}`);
    const unsubscribeDevices = onValue(devicesRef, (snapshot) => {
      const data = snapshot.val();
      console.log('📱 Devices data:', data);
      setDevices(data || {});
    });

    const typesRef = ref(db, `device_types/${user.uid}`);
    const unsubscribeTypes = onValue(typesRef, (snapshot) => {
      const data = snapshot.val();
      console.log('🏷️ Device types data:', data);
      setDeviceTypes(data || {});
    });

    const dataRef = ref(db, `deviceData/${user.uid}`);
    const unsubscribeData = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      console.log('📊 Device data:', data);
      setDeviceData(data || {});
    });

    return () => {
      unsubscribeDevices();
      unsubscribeTypes();
      unsubscribeData();
    };
  }, [user]);

  // Handle device type update
  const handleTypeUpdate = useCallback(async (deviceSN, typeKey) => {
    if (!user) return;

    try {
      const typeRef = ref(db, `device_types/${user.uid}/${deviceSN}`);
      await set(typeRef, typeKey);

      // Initialize device data with default value
      const typeConfig = DEVICE_TYPES[typeKey];
      let defaultValue;
      
      switch (typeConfig.dataType) {
        case 'boolean':
          defaultValue = false;
          break;
        case 'number':
          defaultValue = typeConfig.min || 0;
          break;
        case 'object':
          defaultValue = { lat: 13.7563, lng: 100.5018 };
          break;
        default:
          defaultValue = '';
      }

      const dataRef = ref(db, `deviceData/${user.uid}/${deviceSN}`);
      await set(dataRef, {
        value: defaultValue,
        timestamp: Date.now()
      });

      console.log(`Device ${deviceSN} type updated to ${typeKey}`);
    } catch (error) {
      console.error('Error updating device type:', error);
    }
  }, [user]);

  // Handle control changes (for switches, locks, etc.)
  const handleControlChange = useCallback(async (deviceSN, newValue) => {
    if (!user) return;

    try {
      const dataRef = ref(db, `deviceData/${user.uid}/${deviceSN}`);
      await set(dataRef, {
        value: newValue,
        timestamp: Date.now()
      });
      console.log(`Device ${deviceSN} value updated to:`, newValue);
    } catch (error) {
      console.error('Error updating device value:', error);
    }
  }, [user]);

  // Handle device deletion
  const handleDeleteDevice = useCallback(async (deviceSN, deviceName) => {
    if (!user) return;
    
    const confirmDelete = window.confirm(
      `คุณต้องการลบอุปกรณ์ "${deviceName}" (SN: ${deviceSN}) หรือไม่?\n\nการลบจะไม่สามารถยกเลิกได้!`
    );
    
    if (!confirmDelete) return;

    try {
      // ลบจาก devices table
      const deviceRef = ref(db, `devices/${user.uid}/${deviceSN}`);
      await set(deviceRef, null);
      
      // ลบจาก deviceData table  
      const dataRef = ref(db, `deviceData/${user.uid}/${deviceSN}`);
      await set(dataRef, null);
      
      // ลบจาก deviceTypes table
      const typeRef = ref(db, `deviceTypes/${user.uid}/${deviceSN}`);
      await set(typeRef, null);
      
      console.log(`✅ Device ${deviceSN} deleted successfully`);
      
      // แสดงข้อความแจ้งเตือน
      if (showToast) {
        showToast(`ลบอุปกรณ์ "${deviceName}" เรียบร้อยแล้ว`, 'success');
      }
      
    } catch (error) {
      console.error('❌ Error deleting device:', error);
      if (showToast) {
        showToast('เกิดข้อผิดพลาดในการลบอุปกรณ์', 'error');
      }
    }
  }, [user]);

  // Render dashboard component
  const renderDashboard = (deviceSN, deviceInfo) => {
    const deviceType = deviceTypes[deviceSN];
    if (!deviceType) return null;

    const typeConfig = DEVICE_TYPES[deviceType];
    if (!typeConfig) return null;

    const dashboardType = typeConfig.dashboard;
    const ComponentName = DASHBOARD_COMPONENTS[dashboardType];
    const Component = componentMap[ComponentName];

    if (!Component) return null;

    const currentData = deviceData[deviceSN];
    const value = currentData?.value;

    // Check if this is a controllable device
    const isControllable = ['switch', 'lock'].includes(deviceType);

    return (
      <Component
        value={value}
        onChange={isControllable ? (newValue) => handleControlChange(deviceSN, newValue) : undefined}
        config={typeConfig}
      />
    );
  };

  const deviceCount = Object.keys(devices).length;
  const typedDeviceCount = Object.keys(deviceTypes).length;

  return (
    <div className="realtime-dashboard">
      <div className="dashboard-header">
        <h2>
          <i className="fas fa-tachometer-alt"></i>
          Real-Time Dashboard
        </h2>
        <div className="dashboard-stats">
          <div className="stat">
            <span className="stat-value">{deviceCount}</span>
            <span className="stat-label">อุปกรณ์ทั้งหมด</span>
          </div>
          <div className="stat">
            <span className="stat-value">{typedDeviceCount}</span>
            <span className="stat-label">กำหนดประเภทแล้ว</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Object.keys(deviceData).length}</span>
            <span className="stat-label">มีข้อมูล</span>
          </div>
        </div>
      </div>

      {deviceCount === 0 ? (
        <div className="no-devices">
          <i className="fas fa-exclamation-circle"></i>
          <h3>ไม่มีอุปกรณ์</h3>
          <p>กรุณาเพิ่มอุปกรณ์ก่อนใช้งาน Dashboard</p>
          <button 
            className="add-device-btn"
            onClick={() => window.location.href = '#addDevice'}
          >
            <i className="fas fa-plus"></i>
            เพิ่มอุปกรณ์
          </button>
        </div>
      ) : (
        <>
          {typedDeviceCount === 0 && (
            <div className="info-message">
              <i className="fas fa-info-circle"></i>
              <h3>กรุณาเลือกประเภท Dashboard สำหรับอุปกรณ์</h3>
              <p>เลือกประเภทการแสดงผลสำหรับแต่ละอุปกรณ์ด้านล่าง</p>
            </div>
          )}
          <div className="devices-grid">
            {Object.entries(devices).map(([deviceSN, deviceInfo]) => {
            const deviceType = deviceTypes[deviceSN];
            const typeConfig = deviceType ? DEVICE_TYPES[deviceType] : null;
            const currentData = deviceData[deviceSN];

            return (
              <div key={deviceSN} className="device-card">
                <div className="device-header">
                  <div className="device-info">
                    <h3>{deviceInfo.name}</h3>
                    <span className="device-sn">SN: {deviceSN}</span>
                  </div>
                  <div className="device-actions">
                    <div className="device-status">
                      {currentData ? (
                        <div className="status online">
                          <i className="fas fa-circle"></i>
                          <span>Online</span>
                        </div>
                      ) : (
                        <div className="status offline">
                          <i className="fas fa-circle"></i>
                          <span>Offline</span>
                        </div>
                      )}
                    </div>
                    <button 
                      className="delete-device-btn"
                      onClick={() => handleDeleteDevice(deviceSN, deviceInfo.name)}
                      title="ลบอุปกรณ์"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <DeviceTypeSelector
                  deviceSN={deviceSN}
                  currentType={deviceType}
                  onTypeUpdate={handleTypeUpdate}
                />

                {typeConfig && (
                  <div className="dashboard-container">
                    <div className="dashboard-wrapper">
                      {renderDashboard(deviceSN, deviceInfo)}
                    </div>
                    {currentData && (
                      <div className="last-update">
                        <i className="fas fa-clock"></i>
                        อัปเดตล่าสุด: {new Date(currentData.timestamp).toLocaleString('th-TH')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </>
      )}

      <style jsx>{`
        .realtime-dashboard {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 20px;
          margin-bottom: 30px;
          text-align: center;
        }

        .dashboard-header h2 {
          margin: 0 0 20px 0;
          font-size: 28px;
          font-weight: 700;
        }

        .dashboard-header h2 i {
          margin-right: 10px;
        }

        .dashboard-stats {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-bottom: 25px;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 14px;
          opacity: 0.9;
        }

        .simulate-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 12px 24px;
          border-radius: 25px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .simulate-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .simulate-btn.active {
          background: #22c55e;
          animation: pulse 2s infinite;
        }

        .simulate-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .no-devices {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .no-devices i {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .add-device-btn {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 20px;
          transition: all 0.3s ease;
        }

        .add-device-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
        }

        .add-device-btn i {
          margin-right: 8px;
        }

        .info-message {
          text-align: center;
          padding: 30px 20px;
          margin-bottom: 30px;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-radius: 15px;
          border-left: 4px solid #3b82f6;
          color: #1e40af;
        }

        .info-message i {
          font-size: 32px;
          margin-bottom: 15px;
          color: #3b82f6;
        }

        .info-message h3 {
          margin: 0 0 10px 0;
          color: #1e40af;
        }

        .info-message p {
          margin: 0;
          opacity: 0.8;
        }

        .devices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 25px;
        }

        .device-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .device-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .device-header {
          padding: 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .device-actions {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .delete-device-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }

        .delete-device-btn:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }

        .delete-device-btn:active {
          transform: translateY(0);
        }

        .device-info h3 {
          margin: 0 0 5px 0;
          color: #374151;
          font-weight: 600;
        }

        .device-sn {
          font-size: 12px;
          color: #6b7280;
          font-family: monospace;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 600;
        }

        .status.online {
          color: #22c55e;
        }

        .status.offline {
          color: #ef4444;
        }

        .status i {
          font-size: 8px;
        }

        .dashboard-container {
          padding: 20px;
        }

        .dashboard-wrapper {
          background: #f8fafc;
          border-radius: 12px;
          margin-bottom: 15px;
          min-height: 120px;
        }

        .last-update {
          text-align: center;
          font-size: 11px;
          color: #6b7280;
        }

        .last-update i {
          margin-right: 5px;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @media (max-width: 768px) {
          .dashboard-stats {
            flex-direction: column;
            gap: 20px;
          }

          .devices-grid {
            grid-template-columns: 1fr;
          }

          .device-header {
            flex-direction: column;
            text-align: center;
            gap: 15px;
          }

          .device-actions {
            flex-direction: row;
            justify-content: center;
            gap: 20px;
          }

          .delete-device-btn {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
};

export default RealTimeDashboard;
