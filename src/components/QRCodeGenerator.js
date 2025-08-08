import React, { useState } from 'react';

const QRCodeGenerator = () => {
  const [sn, setSN] = useState('ESP32-001');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const generateQR = () => {
    // สร้าง URL ที่มี device data เพื่อเด้งมาเว็บไซต์
    const currentHost = window.location.origin; // http://localhost:3000
    const selectedDevice = sampleDevices.find(d => d.sn === sn);
    
    const deviceData = {
      sn: sn,
      type: selectedDevice?.type || 'unknown',
      name: selectedDevice?.name || sn
    };
    
    // Encode device data ใน URL เพื่อเด้งมาเว็บไซต์ตัวนี้
    const redirectUrl = `${currentHost}?device=${encodeURIComponent(JSON.stringify(deviceData))}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(redirectUrl)}`;
    setQrCodeUrl(qrUrl);
  };

  const sampleDevices = [
    { sn: 'ESP32-RELAY4-001', type: 'relay4', name: 'รีเลย์ 4 ช่อง #1' },
    { sn: 'ESP32-LIGHT-001', type: 'lighting', name: 'หลอดไฟ LED #1' },
    { sn: 'ESP32-PLUG-001', type: 'plug', name: 'ปลั๊กอัจฉริยะ #1' },
    { sn: 'ESP32-CAM-001', type: 'security_camera', name: 'กล้องรักษาความปลอดภัย #1' },
    { sn: 'ESP32-DOOR-001', type: 'door_lock', name: 'ล็อคประตูดิจิตอล #1' },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🔧 QR Code Generator สำหรับทดสอบ</h2>
      <p>สร้าง QR Code ที่เด้งมาเว็บไซต์นี้พร้อมข้อมูลอุปกรณ์</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>อุปกรณ์ตัวอย่าง:</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {sampleDevices.map(device => (
            <button
              key={device.sn}
              onClick={() => setSN(device.sn)}
              style={{
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: sn === device.sn ? '#667eea' : 'white',
                color: sn === device.sn ? 'white' : '#333',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <strong>{device.sn}</strong> - {device.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Serial Number:
        </label>
        <input
          type="text"
          value={sn}
          onChange={(e) => setSN(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            fontSize: '16px'
          }}
          placeholder="กรอก Serial Number"
        />
      </div>

      <button
        onClick={generateQR}
        style={{
          background: '#22c55e',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        🔄 สร้าง QR Code
      </button>

      {qrCodeUrl && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          border: '2px dashed #ddd',
          borderRadius: '12px',
          background: '#f9f9f9'
        }}>
          <h3>📱 QR Code สำหรับ: {sn}</h3>
          <img 
            src={qrCodeUrl} 
            alt={`QR Code for ${sn}`}
            style={{ 
              border: '1px solid #ddd',
              borderRadius: '8px',
              background: 'white',
              padding: '10px'
            }}
          />
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            💡 สแกน QR Code นี้จะเด้งมาเว็บไซต์พร้อมเพิ่มอุปกรณ์อัตโนมัติ
          </p>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
