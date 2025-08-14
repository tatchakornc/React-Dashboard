import React, { useState } from 'react';
import { ref, get, push } from 'firebase/database';
import { db } from '../firebase';
import QRCodeScanner from './QRCodeScanner';
import './AddDevice.css';

const AddDevice = ({ currentUser, showToast, setCurrentPage }) => {
  const [serialNumber, setSerialNumber] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingSerialNumber, setValidatingSerialNumber] = useState(false);
  const [serialNumberValid, setSerialNumberValid] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [step, setStep] = useState(1); // 1: Enter SN, 2: Device Info, 3: Success
  const [availableSNs, setAvailableSNs] = useState([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [inputMethod, setInputMethod] = useState('manual'); // 'manual' หรือ 'qr'

  // โหลด available SNs เมื่อ component mount
  React.useEffect(() => {
    loadAvailableSNs();
  }, []);

  const loadAvailableSNs = async () => {
    try {
      const snRef = ref(db, 'valid_sn');
      const snapshot = await get(snRef);
      
      if (snapshot.exists()) {
        const snData = snapshot.val();
        const snList = Object.keys(snData);
        setAvailableSNs(snList);
        console.log('📋 Available SNs loaded:', snList);
      } else {
        console.log('📋 No SNs found in database');
        setAvailableSNs([]);
      }
    } catch (error) {
      console.error('Error loading available SNs:', error);
    }
  };

  // เช็ค Serial Number ว่าถูกต้องหรือไม่
  const validateSerialNumber = async (sn) => {
    if (!sn.trim()) {
      setSerialNumberValid(null);
      setDeviceInfo(null);
      return;
    }

    setValidatingSerialNumber(true);
    
    try {
      // ลองหาทั้ง exact match และ case-insensitive
      console.log('🔍 Checking SN:', sn);
      
      // วิธีที่ 1: ลองหา exact match
      let snRef = ref(db, `valid_sn/${sn}`);
      let snapshot = await get(snRef);
      
      console.log('📊 Exact match - Snapshot exists:', snapshot.exists());
      
      // วิธีที่ 2: ถ้าไม่เจอ ลองหาทั้ง database แล้วเปรียบเทียบ case-insensitive
      if (!snapshot.exists()) {
        console.log('� Trying case-insensitive search...');
        const allSNsRef = ref(db, 'valid_sn');
        const allSNsSnapshot = await get(allSNsRef);
        
        if (allSNsSnapshot.exists()) {
          const allSNs = allSNsSnapshot.val();
          console.log('📋 All SNs in database:', Object.keys(allSNs));
          
          // หา SN ที่ตรงกัน (case-insensitive)
          const matchingSN = Object.keys(allSNs).find(dbSN => 
            dbSN.toLowerCase() === sn.toLowerCase()
          );
          
          if (matchingSN) {
            console.log('✅ Found matching SN (case-insensitive):', matchingSN);
            snapshot = { exists: () => true, val: () => allSNs[matchingSN] };
            // อัพเดท SN ให้ตรงกับใน database
            setSerialNumber(matchingSN);
          }
        }
      }
      
      if (snapshot.exists()) {
        const snData = snapshot.val();
        console.log('✅ SN Data found:', snData);
        setSerialNumberValid(true);
        setDeviceInfo(snData);
        setDeviceName(snData.name || `${snData.type} ${sn.slice(-6)}`);
        showToast(`✅ พบ Serial Number: ${snData.type}`, 'success');
      } else {
        console.log('❌ SN not found in database');
        console.log('💡 Available SNs:', availableSNs);
        setSerialNumberValid(false);
        setDeviceInfo(null);
        setDeviceName('');
        showToast('❌ Serial Number ไม่ถูกต้องหรือไม่มีในระบบ', 'error');
      }
    } catch (error) {
      console.error('Error validating SN:', error);
      setSerialNumberValid(false);
      setDeviceInfo(null);
      showToast('เกิดข้อผิดพลาดในการตรวจสอบ Serial Number', 'error');
    }
    
    setValidatingSerialNumber(false);
  };

  // เช็ค SN เมื่อผู้ใช้เลิกพิมพ์
  const handleSerialNumberChange = (e) => {
    const value = e.target.value.toUpperCase();
    setSerialNumber(value);
    
    // Debounce การเช็ค SN
    if (window.snCheckTimeout) {
      clearTimeout(window.snCheckTimeout);
    }
    
    window.snCheckTimeout = setTimeout(() => {
      validateSerialNumber(value);
    }, 500);
  };

  // จัดการข้อมูลจาก QR Code
  const handleQRCodeScan = (data) => {
    if (data) {
      console.log('📷 QR Code scanned:', data);
      
      // พยายามแยก SN จากข้อมูล QR
      let scannedSN = data;
      
      // ถ้าเป็น URL ให้แยก SN ออกมา
      if (data.includes('sn=')) {
        const urlParams = new URLSearchParams(data.split('?')[1]);
        scannedSN = urlParams.get('sn');
      }
      
      // ถ้าเป็น JSON ให้แปลง
      try {
        const parsed = JSON.parse(data);
        if (parsed.sn || parsed.serial_number) {
          scannedSN = parsed.sn || parsed.serial_number;
        }
      } catch (e) {
        // ไม่ใช่ JSON ใช้ข้อมูลดิบ
      }
      
      setSerialNumber(scannedSN.toUpperCase());
      setShowQRScanner(false);
      setInputMethod('manual');
      validateSerialNumber(scannedSN.toUpperCase());
      showToast(`📷 สแกน QR Code สำเร็จ: ${scannedSN}`, 'success');
    }
  };

  // จัดการปิด QR Scanner
  const handleQRScannerClose = () => {
    setShowQRScanner(false);
    setInputMethod('manual');
  };

  // เปิด QR Scanner
  const openQRScanner = () => {
    setInputMethod('qr');
    setShowQRScanner(true);
  };

  // ไปขั้นตอนต่อไป
  const nextStep = () => {
    if (step === 1 && serialNumberValid) {
      setStep(2);
    }
  };

  // กลับขั้นตอนก่อนหน้า
  const prevStep = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  // ลงทะเบียนอุปกรณ์
  const registerDevice = async () => {
    if (!serialNumberValid || !deviceInfo) {
      showToast('กรุณาตรวจสอบ Serial Number ให้ถูกต้อง', 'error');
      return;
    }

    if (!deviceName.trim()) {
      showToast('กรุณากรอกชื่ออุปกรณ์', 'error');
      return;
    }

    setLoading(true);

    try {
      // สร้างการกำหนดค่าอุปกรณ์ตามประเภท
      const getDeviceConfig = (type) => {
        switch (type.toLowerCase()) {
          case '4relay':
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
          
          case '8relay':
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
          case 'lighting':
            return {
              pins: [
                { id: 'led1', name: 'LED 1', pin: 2, state: false },
                { id: 'led2', name: 'LED 2', pin: 4, state: false },
                { id: 'led3', name: 'LED 3', pin: 5, state: false }
              ]
            };
          
          case 'sensor':
          case 'temperature':
            return {
              sensors: [
                { id: 'temp', name: 'อุณหภูมิ', value: '--', unit: '°C' },
                { id: 'humidity', name: 'ความชื้น', value: '--', unit: '%' }
              ]
            };
          
          default:
            return { pins: [], sensors: [] };
        }
      };

      const config = getDeviceConfig(deviceInfo.type);

      // สร้างข้อมูลอุปกรณ์
      const deviceData = {
        id: serialNumber,
        device_id: serialNumber,
        serial_number: serialNumber,
        name: deviceName.trim(),
        type: deviceInfo.type,
        device_type: deviceInfo.type,
        status: 'offline',
        createdAt: Date.now(),
        createdBy: currentUser.uid,
        lastUpdate: null,
        validSN: true,
        ...config
      };

      // เพิ่มลง Firebase
      await push(ref(db, `mqtt_devices/${currentUser.uid}`), deviceData);
      
      showToast(`🎉 ลงทะเบียนอุปกรณ์ "${deviceName}" สำเร็จ!`, 'success');
      setStep(3);
      
    } catch (error) {
      console.error('Error registering device:', error);
      showToast('❌ เกิดข้อผิดพลาดในการลงทะเบียนอุปกรณ์', 'error');
    }

    setLoading(false);
  };

  // รีเซ็ตและเริ่มใหม่
  const resetForm = () => {
    setSerialNumber('');
    setDeviceName('');
    setSerialNumberValid(null);
    setDeviceInfo(null);
    setStep(1);
  };

  return (
    <div className="add-device-container">
      <div className="add-device-header">
        <h1 className="add-device-title">📱 เพิ่มอุปกรณ์ใหม่</h1>
        <p className="add-device-subtitle">ลงทะเบียนอุปกรณ์ด้วย Serial Number</p>
        
        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">ตรวจสอบ Serial Number</span>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">ข้อมูลอุปกรณ์</span>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">เสร็จสิ้น</span>
          </div>
        </div>
      </div>

      <div className="add-device-content">
        {step === 1 && (
          <div className="step-content">
            <h2>🔍 ตรวจสอบ Serial Number</h2>
            
            {/* Input Method Selection */}
            <div className="input-method-selection">
              <h3>📝 เลือกวิธีการป้อน Serial Number</h3>
              <div className="method-buttons">
                <button
                  type="button"
                  className={`method-btn ${inputMethod === 'manual' ? 'active' : ''}`}
                  onClick={() => setInputMethod('manual')}
                >
                  <i className="fas fa-keyboard"></i>
                  <span>กรอกเอง</span>
                </button>
                
                <button
                  type="button"
                  className={`method-btn ${inputMethod === 'qr' ? 'active' : ''}`}
                  onClick={openQRScanner}
                >
                  <i className="fas fa-qrcode"></i>
                  <span>สแกน QR Code</span>
                </button>
              </div>
            </div>

            {/* Manual Input */}
            {inputMethod === 'manual' && !showQRScanner && (
              <div className="form-group">
                <label htmlFor="serialNumber" className="form-label">
                  <i className="fas fa-barcode"></i>
                  Serial Number *
                </label>
                <input
                  id="serialNumber"
                  type="text"
                  className={`form-input ${serialNumberValid === true ? 'valid' : serialNumberValid === false ? 'invalid' : ''}`}
                  value={serialNumber}
                  onChange={handleSerialNumberChange}
                  placeholder="กรอก Serial Number ของอุปกรณ์"
                  disabled={validatingSerialNumber}
                />
                
                {/* Available SNs Helper */}
                {availableSNs.length > 0 && (
                  <div className="sn-helper">
                    <small>💡 SN ที่มีในระบบ ({availableSNs.length} รายการ):</small>
                    <div className="sn-list">
                      {availableSNs.map(sn => (
                        <span 
                          key={sn} 
                          className="sn-item"
                          onClick={() => {
                            setSerialNumber(sn);
                            validateSerialNumber(sn);
                          }}
                        >
                          {sn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {validatingSerialNumber && (
                  <div className="validation-message checking">
                    <i className="fas fa-spinner fa-spin"></i>
                    กำลังตรวจสอบ...
                  </div>
                )}
                
                {serialNumberValid === true && deviceInfo && (
                  <div className="validation-message valid">
                    <i className="fas fa-check-circle"></i>
                    Serial Number ถูกต้อง - {deviceInfo.type}
                  </div>
                )}
                
                {serialNumberValid === false && (
                  <div className="validation-message invalid">
                    <i className="fas fa-times-circle"></i>
                    Serial Number ไม่ถูกต้องหรือไม่มีในระบบ
                  </div>
                )}
              </div>
            )}

            {/* QR Scanner */}
            {showQRScanner && (
              <div className="qr-scanner-container">
                <h3>📷 สแกน QR Code</h3>
                <QRCodeScanner 
                  onScanResult={handleQRCodeScan}
                  isActive={showQRScanner}
                />
                <div className="qr-scanner-help">
                  <p>📱 นำกล้องไปส่องที่ QR Code บนอุปกรณ์หรือบรรจุภัณฑ์</p>
                  <button 
                    type="button" 
                    className="btn-cancel-qr"
                    onClick={handleQRScannerClose}
                  >
                    ❌ ยกเลิกการสแกน
                  </button>
                </div>
              </div>
            )}

            {deviceInfo && (
              <div className="device-preview">
                <h3>📋 ข้อมูลอุปกรณ์</h3>
                <div className="preview-content">
                  <div className="preview-item">
                    <strong>Serial Number:</strong> {serialNumber}
                  </div>
                  <div className="preview-item">
                    <strong>ประเภท:</strong> {deviceInfo.type}
                  </div>
                  <div className="preview-item">
                    <strong>ชื่อเริ่มต้น:</strong> {deviceInfo.name || 'ไม่ระบุ'}
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setCurrentPage('main')}
              >
                <i className="fas fa-arrow-left"></i>
                ยกเลิก
              </button>
              
              <button 
                type="button" 
                className="btn-primary"
                onClick={nextStep}
                disabled={!serialNumberValid || validatingSerialNumber}
              >
                <i className="fas fa-arrow-right"></i>
                ถัดไป
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <h2>📝 ข้อมูลอุปกรณ์</h2>
            
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
                placeholder="ตั้งชื่ออุปกรณ์ที่เข้าใจง่าย"
              />
            </div>

            <div className="device-summary">
              <h3>📋 สรุปข้อมูล</h3>
              <div className="summary-content">
                <div className="summary-item">
                  <strong>Serial Number:</strong> {serialNumber}
                </div>
                <div className="summary-item">
                  <strong>ประเภทอุปกรณ์:</strong> {deviceInfo?.type}
                </div>
                <div className="summary-item">
                  <strong>ชื่ออุปกรณ์:</strong> {deviceName || 'ยังไม่ได้ตั้งชื่อ'}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={prevStep}
                disabled={loading}
              >
                <i className="fas fa-arrow-left"></i>
                ย้อนกลับ
              </button>
              
              <button 
                type="button" 
                className="btn-primary"
                onClick={registerDevice}
                disabled={loading || !deviceName.trim()}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    กำลังลงทะเบียน...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    ลงทะเบียนอุปกรณ์
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content success">
            <div className="success-icon">🎉</div>
            <h2>เสร็จสิ้น!</h2>
            <p>ลงทะเบียนอุปกรณ์ "{deviceName}" สำเร็จแล้ว</p>
            <p>Serial Number: {serialNumber}</p>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={resetForm}
              >
                <i className="fas fa-plus"></i>
                เพิ่มอุปกรณ์อีก
              </button>
              
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => setCurrentPage('main')}
              >
                <i className="fas fa-home"></i>
                ไปยัง Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="add-device-info">
        <h3>💡 คำแนะนำ</h3>
        <ul>
          <li>Serial Number ต้องมีอยู่ในระบบเท่านั้น</li>
          <li>ตรวจสอบ Serial Number บนตัวอุปกรณ์หรือบรรจุภัณฑ์</li>
          <li>แต่ละ Serial Number สามารถลงทะเบียนได้เพียงครั้งเดียว</li>
          <li>หากมีปัญหา กรุณาติดต่อผู้ดูแลระบบ</li>
        </ul>
      </div>
    </div>
  );
};

export default AddDevice;
