import React, { useState } from 'react';

const QRCodeGenerator = () => {
  const [sn, setSN] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const generateQR = () => {
    if (!sn.trim()) {
      alert('กรุณากรอก Serial Number');
      return;
    }

    // สร้าง URL ที่มี device data เพื่อเด้งมาเว็บไซต์
    const currentHost = window.location.origin;
    
    const deviceData = {
      sn: sn.trim(),
      type: 'unknown',
      name: sn.trim()
    };
    
    // Encode device data ใน URL เพื่อเด้งมาเว็บไซต์ตัวนี้
    const redirectUrl = `${currentHost}?device=${encodeURIComponent(JSON.stringify(deviceData))}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(redirectUrl)}`;
    setQrCodeUrl(qrUrl);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🔧 QR Code Generator</h2>
      <p>สร้าง QR Code สำหรับอุปกรณ์ที่ต้องการเพิ่มเข้าระบบ</p>
      
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
          placeholder="กรอก Serial Number ของอุปกรณ์"
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
