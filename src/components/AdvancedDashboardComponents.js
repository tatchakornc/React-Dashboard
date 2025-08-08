import React from 'react';

// Tank Dashboard Component (สำหรับระดับน้ำ)
export const TankDashboard = ({ value, config }) => {
  const numValue = Number(value) || 0;
  const { min = 0, max = 100, unit = '%', color = '#0284c7' } = config;
  const percentage = Math.min(Math.max(((numValue - min) / (max - min)) * 100, 0), 100);
  
  return (
    <div className="tank-dashboard">
      <div className="tank-container">
        <div className="tank">
          <div 
            className="water-level" 
            style={{ 
              height: `${percentage}%`,
              background: `linear-gradient(to top, ${color}, ${color}80)`
            }}
          >
            <div className="water-animation"></div>
          </div>
          <div className="tank-marks">
            {[100, 75, 50, 25, 0].map(mark => (
              <div key={mark} className="mark" style={{ bottom: `${mark}%` }}>
                <span>{mark}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="tank-value">
          <span className="value">{numValue.toFixed(1)}</span>
          <span className="unit">{unit}</span>
        </div>
      </div>
      
      <style jsx>{`
        .tank-dashboard {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        
        .tank-container {
          text-align: center;
        }
        
        .tank {
          position: relative;
          width: 80px;
          height: 150px;
          border: 3px solid #374151;
          border-radius: 0 0 10px 10px;
          background: #f3f4f6;
          overflow: hidden;
          margin: 0 auto 15px;
        }
        
        .water-level {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          transition: height 0.5s ease;
          overflow: hidden;
        }
        
        .water-animation {
          position: absolute;
          top: -20px;
          left: -20px;
          right: -20px;
          height: 40px;
          background: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 10px,
            rgba(255, 255, 255, 0.3) 10px,
            rgba(255, 255, 255, 0.3) 20px
          );
          animation: wave 2s linear infinite;
        }
        
        .tank-marks {
          position: absolute;
          top: 0;
          right: -40px;
          height: 100%;
        }
        
        .mark {
          position: absolute;
          font-size: 10px;
          color: #6b7280;
          white-space: nowrap;
        }
        
        .tank-value .value {
          font-size: 24px;
          font-weight: 700;
          color: #374151;
        }
        
        .tank-value .unit {
          font-size: 14px;
          color: #6b7280;
          margin-left: 4px;
        }
        
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(20px); }
        }
      `}</style>
    </div>
  );
};

// Map Dashboard Component (สำหรับ GPS)
export const MapDashboard = ({ value, config }) => {
  const gpsData = value || { lat: 13.7563, lng: 100.5018 }; // Default Bangkok
  
  return (
    <div className="map-dashboard">
      <div className="map-container">
        <div className="map-placeholder">
          <i className="fas fa-map-marker-alt"></i>
          <div className="coordinates">
            <div>Lat: {gpsData.lat?.toFixed(6) || 'N/A'}</div>
            <div>Lng: {gpsData.lng?.toFixed(6) || 'N/A'}</div>
          </div>
          <div className="location-info">
            <i className="fas fa-clock"></i>
            <span>อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH')}</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .map-dashboard {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        
        .map-container {
          width: 100%;
          max-width: 300px;
        }
        
        .map-placeholder {
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          color: white;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .map-placeholder > i {
          font-size: 32px;
          margin-bottom: 10px;
          animation: bounce 2s infinite;
        }
        
        .coordinates {
          margin: 10px 0;
          font-family: monospace;
          font-size: 12px;
        }
        
        .location-info {
          margin-top: 10px;
          font-size: 11px;
          opacity: 0.8;
        }
        
        .location-info i {
          margin-right: 5px;
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

// Camera Dashboard Component
export const CameraDashboard = ({ value, config }) => {
  const isOnline = Boolean(value);
  
  return (
    <div className="camera-dashboard">
      <div className={`camera-container ${isOnline ? 'online' : 'offline'}`}>
        <div className="camera-icon">
          <i className="fas fa-video"></i>
          {isOnline && <div className="recording-indicator"></div>}
        </div>
        <div className="camera-status">
          {isOnline ? 'กล้องออนไลน์' : 'กล้องออฟไลน์'}
        </div>
        <div className="camera-actions">
          <button className="action-btn">
            <i className="fas fa-play"></i>
          </button>
          <button className="action-btn">
            <i className="fas fa-camera"></i>
          </button>
          <button className="action-btn">
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .camera-dashboard {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        
        .camera-container {
          text-align: center;
          padding: 20px;
          border-radius: 16px;
          min-width: 200px;
        }
        
        .camera-container.online {
          background: linear-gradient(135deg, #374151, #1f2937);
          color: white;
        }
        
        .camera-container.offline {
          background: linear-gradient(135deg, #6b7280, #9ca3af);
          color: white;
        }
        
        .camera-icon {
          position: relative;
          font-size: 48px;
          margin-bottom: 15px;
        }
        
        .recording-indicator {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 12px;
          height: 12px;
          background: #dc2626;
          border-radius: 50%;
          animation: blink 1s infinite;
        }
        
        .camera-status {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 15px;
        }
        
        .camera-actions {
          display: flex;
          justify-content: center;
          gap: 10px;
        }
        
        .action-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .action-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// Counter Dashboard Component
export const CounterDashboard = ({ value, config }) => {
  const numValue = Number(value) || 0;
  const { unit = 'ครั้ง', color = '#059669' } = config;
  
  return (
    <div className="counter-dashboard">
      <div className="counter-container">
        <div className="counter-icon">
          <i className="fas fa-calculator"></i>
        </div>
        <div className="counter-display">
          <div className="counter-value" style={{ color }}>
            {numValue.toLocaleString()}
          </div>
          <div className="counter-unit">{unit}</div>
        </div>
        <div className="counter-stats">
          <div className="stat-item">
            <span className="stat-label">วันนี้</span>
            <span className="stat-value">+{Math.floor(Math.random() * 50)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">เฉลี่ย/วัน</span>
            <span className="stat-value">{Math.floor(numValue / 30)}</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .counter-dashboard {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        
        .counter-container {
          background: linear-gradient(135deg, #f8fafc, #e2e8f0);
          border-radius: 16px;
          padding: 25px;
          text-align: center;
          border: 1px solid #e5e7eb;
          min-width: 200px;
        }
        
        .counter-icon {
          font-size: 32px;
          color: #059669;
          margin-bottom: 15px;
        }
        
        .counter-display {
          margin-bottom: 20px;
        }
        
        .counter-value {
          font-size: 36px;
          font-weight: 700;
          font-family: 'Courier New', monospace;
        }
        
        .counter-unit {
          font-size: 14px;
          color: #6b7280;
          margin-top: 5px;
        }
        
        .counter-stats {
          display: flex;
          justify-content: space-around;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
        }
        
        .stat-item {
          text-align: center;
        }
        
        .stat-label {
          display: block;
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 2px;
        }
        
        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }
      `}</style>
    </div>
  );
};
