import React, { useState, useRef, useEffect } from 'react';
import { DEVICE_TYPES } from '../config/deviceTypes';

const DeviceTypeSelector = ({ deviceSN, currentType, onTypeUpdate }) => {
  const [selectedType, setSelectedType] = useState(currentType || '');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleTypeSelect = (typeKey) => {
    setSelectedType(typeKey);
    setIsOpen(false);
    onTypeUpdate(deviceSN, typeKey);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentTypeConfig = DEVICE_TYPES[selectedType];

  return (
    <div className="device-type-selector" ref={dropdownRef}>
      <div className="current-type" onClick={toggleDropdown}>
        {currentTypeConfig ? (
          <div className="type-display">
            <i className={currentTypeConfig.icon} style={{ color: currentTypeConfig.color }}></i>
            <span>{currentTypeConfig.label}</span>
            <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
          </div>
        ) : (
          <div className="type-display">
            <i className="fas fa-cog" style={{ color: '#6b7280' }}></i>
            <span>เลือกประเภทอุปกรณ์</span>
            <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="type-dropdown">
          <div className="dropdown-header">
            <h4>เลือกประเภทการใช้งาน</h4>
          </div>
          <div className="type-grid">
            {Object.entries(DEVICE_TYPES).map(([key, config]) => (
              <div
                key={key}
                className={`type-option ${selectedType === key ? 'selected' : ''}`}
                onClick={() => handleTypeSelect(key)}
              >
                <div className="option-icon">
                  <i className={config.icon} style={{ color: config.color }}></i>
                </div>
                <div className="option-text">
                  <div className="option-label">{config.label}</div>
                  <div className="option-unit">
                    {config.unit && `หน่วย: ${config.unit}`}
                    {config.dataType === 'boolean' && 'เปิด/ปิด'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .device-type-selector {
          position: relative;
          margin: 10px 0;
        }

        .current-type {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
        }

        .current-type:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .type-display {
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
          font-weight: 500;
        }

        .type-display i:first-child {
          font-size: 18px;
        }

        .type-display i:last-child {
          margin-left: auto;
          font-size: 12px;
        }

        .type-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          margin-top: 5px;
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #e5e7eb;
        }

        .dropdown-header {
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          border-radius: 12px 12px 0 0;
        }

        .dropdown-header h4 {
          margin: 0;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
        }

        .type-grid {
          max-height: 250px;
          overflow-y: auto;
        }

        .type-option {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          border-bottom: 1px solid #f3f4f6;
        }

        .type-option:hover {
          background: #f8fafc;
        }

        .type-option.selected {
          background: #eff6ff;
          border-left: 3px solid #3b82f6;
        }

        .type-option:last-child {
          border-bottom: none;
          border-radius: 0 0 12px 12px;
        }

        .option-icon {
          margin-right: 12px;
          font-size: 16px;
          width: 20px;
          text-align: center;
        }

        .option-text {
          flex: 1;
        }

        .option-label {
          font-weight: 500;
          color: #374151;
          margin-bottom: 2px;
          font-size: 14px;
        }

        .option-unit {
          font-size: 11px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default DeviceTypeSelector;
