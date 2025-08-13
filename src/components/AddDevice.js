import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ref, get, push, set } from 'firebase/database';
import { db } from '../firebase';
import QRCodeScanner from './QRCodeScanner';
import { getDefaultDashboardType } from '../config/deviceTypes';
import './QRCodeScanner.css';

const AddDevice = ({ currentUser, showToast, setCurrentPage, pendingDevice, setPendingDevice }) => {
  const [deviceSN, setDeviceSN] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [processingPending, setProcessingPending] = useState(false);
  const [processedDevices, setProcessedDevices] = useState(new Set());
  const [processingDevices, setProcessingDevices] = useState(new Set());
  const isProcessingRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addDeviceWithSN(deviceSN);
  };

  const addDeviceWithSN = useCallback(async (sn) => {
    console.log('🔥 addDeviceWithSN called with SN:', sn);
    console.log('🔥 Current loading state:', loading);
    console.log('🔥 Currently processing devices:', Array.from(processingDevices));
    console.log('🔥 Call stack:', new Error().stack);
    
    if (!sn.trim()) {
      showToast('กรุณากรอก SN', 'error');
      return;
    }

    if (loading || processingDevices.has(sn)) {
      console.log('⚠️ Already loading or processing this SN, skipping...');
      return;
    }

    // เพิ่ม SN ลงใน processing list
    setProcessingDevices(prev => {
      console.log('🔒 Adding SN to processing list:', sn);
      return new Set([...prev, sn]);
    });
    setLoading(true);
    console.log('🔄 Starting device addition process...');

    try {
      // ตรวจสอบว่ามีอุปกรณ์ SN นี้ในระบบของ user แล้วหรือไม่
      const checkUserDevicesRef = ref(db, `devices/${currentUser.uid}`);
      const userDevicesSnapshot = await get(checkUserDevicesRef);
      
      if (userDevicesSnapshot.exists()) {
        const existingDevices = userDevicesSnapshot.val();
        const duplicateDevice = Object.values(existingDevices).find(device => device.sn === sn);
        
        if (duplicateDevice) {
          showToast(`อุปกรณ์ SN: ${sn} มีอยู่ในระบบแล้ว`, 'error');
          setLoading(false);
          return;
        }
      }

      // ตรวจสอบ SN ใน valid_sn
      const snRef = ref(db, `valid_sn/${sn}`);
      const snSnapshot = await get(snRef);
      
      if (!snSnapshot.exists()) {
        showToast(`SN: ${sn} ไม่มีในระบบ กรุณาตรวจสอบ SN อุปกรณ์ของคุณ`, 'error');
        setLoading(false);
        // ลบ SN ออกจาก processing list
        setProcessingDevices(prev => {
          const newSet = new Set(prev);
          newSet.delete(sn);
          return newSet;
        });
        return;
      }

      const snData = snSnapshot.val();
      const type = snData.type || 'other';
      const userDevicesRef = ref(db, `devices/${currentUser.uid}`);

      // Auto-assign dashboard type based on device type
      const defaultDashboardType = getDefaultDashboardType(type);
      console.log('🎯 Auto-assigning dashboard type:', defaultDashboardType, 'for device type:', type);

      if (type === 'relay4') {
        // สำหรับ relay4: สร้าง 4 รีเลย์แยกกัน
        console.log('🔧 Creating relay4 devices for SN:', sn);
        const relayNames = snData.relays || {
          relay1: 'รีเลย์ 1',
          relay2: 'รีเลย์ 2', 
          relay3: 'รีเลย์ 3',
          relay4: 'รีเลย์ 4'
        };

        console.log('📋 Relay names:', relayNames);
        console.log('🎯 About to create', Object.keys(relayNames).length, 'relays');

        const promises = Object.entries(relayNames).map(async ([relayKey, relayName]) => {
          console.log('➕ Creating relay:', relayKey, '-', relayName);
          const deviceKey = `${sn}_${relayKey}`;
          const deviceRef = ref(db, `devices/${currentUser.uid}/${deviceKey}`);
          await set(deviceRef, {
            sn: sn,
            name: relayName,
            relayKey,
            type: 'relay4',
            state: { on: false },
            online: false,
          });
          
          // Auto-assign dashboard type สำหรับ relay
          const deviceTypesRef = ref(db, `device_types/${currentUser.uid}/${deviceKey}`);
          await set(deviceTypesRef, defaultDashboardType);
          console.log('✅ Auto-assigned dashboard type:', defaultDashboardType, 'to relay:', relayKey);
          
          return { key: deviceKey };
        });

        await Promise.all(promises);
        console.log('✅ Successfully created', promises.length, 'relay devices with auto-assigned types');
      } else {
        // อุปกรณ์ทั่วไป
        const deviceRef = ref(db, `devices/${currentUser.uid}/${sn}`);
        await set(deviceRef, {
          sn: sn,
          name: snData.name || 'อุปกรณ์ใหม่',
          type,
          state: { on: false },
          online: false,
        });
        
        // Auto-assign dashboard type
        const deviceTypesRef = ref(db, `device_types/${currentUser.uid}/${sn}`);
        await set(deviceTypesRef, defaultDashboardType);
        console.log('✅ Auto-assigned dashboard type:', defaultDashboardType, 'to device:', sn);
      }

      showToast('เพิ่มอุปกรณ์สำเร็จและกำหนดประเภท Dashboard อัตโนมัติแล้ว!', 'success');
      setDeviceSN('');
      setScanMode(false);
      setCurrentPage('main'); // ไปที่หน้าหลัก
    } catch (error) {
      console.error('Error adding device:', error);
      showToast('เพิ่มอุปกรณ์ไม่สำเร็จ', 'error');
    }

    // ลบ SN ออกจาก processing list
    setProcessingDevices(prev => {
      const newSet = new Set(prev);
      newSet.delete(sn);
      return newSet;
    });
    setLoading(false);
  }, [loading, processingDevices, currentUser, showToast, setCurrentPage]);

  // จัดการ auto-add device จาก QR Code
  useEffect(() => {
    console.log('🔄 useEffect triggered - pendingDevice:', pendingDevice, 'processingPending:', processingPending);
    console.log('🔄 isProcessingRef.current:', isProcessingRef.current);
    
    if (pendingDevice && !processingPending && !processedDevices.has(pendingDevice.sn) && !isProcessingRef.current) {
      isProcessingRef.current = true;
      setProcessingPending(true);
      console.log('🚀 Auto-adding device from QR Code:', pendingDevice);
      console.log('📱 Device SN:', pendingDevice.sn);
      
      // เพิ่ม SN ลงใน processed list ทันที
      setProcessedDevices(prev => new Set([...prev, pendingDevice.sn]));
      
      // เคลียร์ deviceSN ถ้ามีการตั้งค่าไว้
      setDeviceSN('');
      
      // แสดงแจ้งเตือนและเพิ่มอุปกรณ์อัตโนมัติ
      showToast(`🎯 กำลังเพิ่มอุปกรณ์: ${pendingDevice.name}`, 'info');
      
      // เพิ่มอุปกรณ์ด้วย SN จาก QR Code
      addDeviceWithSN(pendingDevice.sn).finally(() => {
        console.log('✅ Finished processing pending device');
        // Clear pending device และ reset flag
        setPendingDevice(null);
        setProcessingPending(false);
        isProcessingRef.current = false;
      });
    }
  }, [pendingDevice, addDeviceWithSN, processingPending, processedDevices, showToast]);

  const handleQRScanResult = (result) => {
    console.log('QR Code Result:', result);
    
    // ถ้าเป็น URL ให้เด้งไป URL นั้น
    if (result.startsWith('http://') || result.startsWith('https://')) {
      console.log('QR Code contains URL, redirecting...');
      window.location.href = result;
      return;
    }
    
    // ถ้าเป็น SN ธรรมดา ให้เซ็ตและแจ้งให้กดเพิ่ม
    setDeviceSN(result);
    setScanMode(false);
    showToast('สแกน QR Code สำเร็จ! กรุณากดเพิ่มอุปกรณ์', 'success');
  };

  const handleQRScanError = (error) => {
    showToast(error, 'error');
    setScanMode(false);
  };

  return (
    <div className="add-device">
      <header className="header">
        <div className="header-left">
          <h1>เพิ่มอุปกรณ์ใหม่</h1>
          <p>กรอก SN หรือสแกน QR Code เพื่อเพิ่มอุปกรณ์</p>
        </div>
      </header>
      
      <div className="settings-section">
        {!scanMode ? (
          <>
            {/* ปุ่มเลือกวิธีการเพิ่มอุปกรณ์ */}
            <div className="add-device-options">
              <button 
                type="button"
                className="btn btn-secondary scan-btn"
                onClick={() => setScanMode(true)}
                disabled={loading || !!pendingDevice}
              >
                <i className="fas fa-qrcode"></i>
                สแกน QR Code
              </button>
              <div className="divider"><span>หรือ</span></div>
            </div>

            {/* ฟอร์มกรอก SN */}
            <form onSubmit={handleSubmit} className="settings-form">
              <div className="form-group">
                <label htmlFor="deviceSN">SN อุปกรณ์</label>
                <input
                  type="text"
                  id="deviceSN"
                  value={deviceSN}
                  onChange={(e) => setDeviceSN(e.target.value)}
                  placeholder="กรอก Serial Number"
                  required
                  disabled={loading || !!pendingDevice}
                />
              </div>
              
              <button type="submit" className="btn btn-primary" disabled={loading || !!pendingDevice}>
                {loading || pendingDevice ? 'กำลังเพิ่ม...' : 'เพิ่มอุปกรณ์'}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* QR Code Scanner */}
            <div className="qr-scanner-section">
              <QRCodeScanner
                onScanResult={handleQRScanResult}
                onError={handleQRScanError}
                isActive={scanMode}
              />
              
              <div className="scanner-controls">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setScanMode(false)}
                  disabled={loading || !!pendingDevice}
                >
                  <i className="fas fa-arrow-left"></i>
                  กลับไปกรอก SN
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddDevice;
