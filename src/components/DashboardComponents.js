import React from 'react';

// Switch Dashboard Component
export const SwitchDashboard = ({ value, onChange, config }) => {
  const isOn = Boolean(value);
  
  return (
    <div className="switch-dashboard">
      <div className={`bulb-container ${isOn ? 'on' : 'off'}`} onClick={() => onChange(!isOn)}>
        <div className="bulb">
          <i className="fas fa-lightbulb"></i>
        </div>
        <div className="switch-label">
          {isOn ? 'เปิด' : 'ปิด'}
        </div>
      </div>
      
      <style jsx>{`
        .switch-dashboard {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        
        .bulb-container {
          cursor: pointer;
          text-align: center;
          transition: all 0.3s ease;
        }
        
        .bulb-container:hover {
          transform: scale(1.05);
        }
        
        .bulb {
          font-size: 64px;
          margin-bottom: 10px;
          transition: all 0.3s ease;
        }
        
        .bulb-container.on .bulb {
          color: #fbbf24;
          filter: drop-shadow(0 0 20px #fbbf24);
          animation: glow 2s ease-in-out infinite alternate;
        }
        
        .bulb-container.off .bulb {
          color: #6b7280;
        }
        
        .switch-label {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }
        
        @keyframes glow {
          from { filter: drop-shadow(0 0 20px #fbbf24); }
          to { filter: drop-shadow(0 0 30px #fbbf24) drop-shadow(0 0 40px #fbbf24); }
        }
      `}</style>
    </div>
  );
};

// Gauge Dashboard Component
export const GaugeDashboard = ({ value, config }) => {
  const numValue = Number(value) || 0;
  const { min = 0, max = 100, unit = '', color = '#3b82f6' } = config;
  const percentage = Math.min(Math.max(((numValue - min) / (max - min)) * 100, 0), 100);
  const angle = (percentage / 100) * 180 - 90;
  
  return (
    <div className="gauge-dashboard">
      <div className="gauge-container">
        <svg viewBox="0 0 200 120" className="gauge-svg">
          {/* Background arc */}
          <path
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 2.199} 220`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
          {/* Needle */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="40"
            stroke="#374151"
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${angle} 100 100)`}
            style={{ transition: 'transform 0.5s ease' }}
          />
          {/* Center dot */}
          <circle cx="100" cy="100" r="6" fill="#374151" />
        </svg>
        
        <div className="gauge-value">
          <span className="value">{numValue.toFixed(1)}</span>
          <span className="unit">{unit}</span>
        </div>
        
        <div className="gauge-range">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
      
      <style jsx>{`
        .gauge-dashboard {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        
        .gauge-container {
          position: relative;
          width: 200px;
          height: 120px;
        }
        
        .gauge-svg {
          width: 100%;
          height: 100%;
        }
        
        .gauge-value {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
        }
        
        .value {
          font-size: 24px;
          font-weight: 700;
          color: #374151;
        }
        
        .unit {
          font-size: 14px;
          color: #6b7280;
          margin-left: 4px;
        }
        
        .gauge-range {
          position: absolute;
          bottom: 0;
          width: 100%;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

// Lock Dashboard Component
export const LockDashboard = ({ value, onChange, config }) => {
  const isLocked = Boolean(value);
  
  return (
    <div className="lock-dashboard">
      <div className={`lock-container ${isLocked ? 'locked' : 'unlocked'}`} onClick={() => onChange(!isLocked)}>
        <div className="lock-icon">
          <i className={`fas fa-${isLocked ? 'lock' : 'unlock'}`}></i>
        </div>
        <div className="lock-status">
          {isLocked ? 'ล็อค' : 'ปลดล็อค'}
        </div>
      </div>
      
      <style jsx>{`
        .lock-dashboard {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        
        .lock-container {
          cursor: pointer;
          text-align: center;
          transition: all 0.3s ease;
          padding: 20px;
          border-radius: 16px;
        }
        
        .lock-container:hover {
          transform: scale(1.05);
        }
        
        .lock-container.locked {
          background: linear-gradient(135deg, #dc2626, #ef4444);
          color: white;
        }
        
        .lock-container.unlocked {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
        }
        
        .lock-icon {
          font-size: 48px;
          margin-bottom: 10px;
        }
        
        .lock-status {
          font-size: 18px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

// Speedometer Dashboard Component
export const SpeedometerDashboard = ({ value, config }) => {
  const numValue = Number(value) || 0;
  const { min = 0, max = 200, unit = 'km/h', color = '#8b5cf6' } = config;
  const percentage = Math.min(Math.max(((numValue - min) / (max - min)) * 100, 0), 100);
  const angle = (percentage / 100) * 270 - 135;
  
  return (
    <div className="speedometer-dashboard">
      <div className="speedometer-container">
        <svg viewBox="0 0 200 140" className="speedometer-svg">
          {/* Background arc */}
          <path
            d="M 20 120 A 80 80 0 1 1 180 120"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Speed arc */}
          <path
            d="M 20 120 A 80 80 0 1 1 180 120"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 4.398} 440`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
          {/* Needle */}
          <line
            x1="100"
            y1="120"
            x2="100"
            y2="50"
            stroke="#374151"
            strokeWidth="4"
            strokeLinecap="round"
            transform={`rotate(${angle} 100 120)`}
            style={{ transition: 'transform 0.5s ease' }}
          />
          {/* Center dot */}
          <circle cx="100" cy="120" r="8" fill="#374151" />
        </svg>
        
        <div className="speedometer-value">
          <span className="value">{numValue}</span>
          <span className="unit">{unit}</span>
        </div>
        
        <div className="speed-marks">
          <span>{min}</span>
          <span>{Math.round((max - min) / 2)}</span>
          <span>{max}</span>
        </div>
      </div>
      
      <style jsx>{`
        .speedometer-dashboard {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        
        .speedometer-container {
          position: relative;
          width: 200px;
          height: 140px;
        }
        
        .speedometer-svg {
          width: 100%;
          height: 100%;
        }
        
        .speedometer-value {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
        }
        
        .value {
          font-size: 32px;
          font-weight: 700;
          color: #374151;
          display: block;
        }
        
        .unit {
          font-size: 14px;
          color: #6b7280;
        }
        
        .speed-marks {
          position: absolute;
          bottom: 5px;
          width: 100%;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #6b7280;
          padding: 0 20px;
        }
      `}</style>
    </div>
  );
};

// Motion Dashboard Component
export const MotionDashboard = ({ value, config }) => {
  const isDetected = Boolean(value);
  
  return (
    <div className="motion-dashboard">
      <div className={`motion-container ${isDetected ? 'detected' : 'idle'}`}>
        <div className="motion-icon">
          <i className="fas fa-running"></i>
        </div>
        <div className="motion-status">
          {isDetected ? 'ตรวจพบการเคลื่อนไหว' : 'ไม่พบการเคลื่อนไหว'}
        </div>
        {isDetected && <div className="detection-pulse"></div>}
      </div>
      
      <style jsx>{`
        .motion-dashboard {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        
        .motion-container {
          position: relative;
          text-align: center;
          padding: 30px;
          border-radius: 20px;
          transition: all 0.3s ease;
          overflow: hidden;
        }
        
        .motion-container.detected {
          background: linear-gradient(135deg, #dc2626, #ef4444);
          color: white;
          animation: shake 0.5s ease-in-out infinite;
        }
        
        .motion-container.idle {
          background: linear-gradient(135deg, #6b7280, #9ca3af);
          color: white;
        }
        
        .motion-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }
        
        .motion-status {
          font-size: 16px;
          font-weight: 600;
        }
        
        .detection-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100px;
          height: 100px;
          border: 2px solid rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: pulse 1s ease-out infinite;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
