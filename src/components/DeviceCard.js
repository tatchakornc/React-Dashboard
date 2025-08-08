import React, { useState } from 'react';

const DeviceCard = ({ device, onToggle, onUpdateName, onDelete }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(device.name || '');

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'lighting': return 'lightbulb';
      case 'air_conditioning': return 'snowflake';
      case 'security_camera': return 'video';
      case 'door_lock': return 'lock';
      case 'irrigation': return 'tint';
      case 'weather_station': return 'cloud-sun';
      case 'plug': return 'plug';
      case 'relay4': return 'layer-group';
      default: return 'microchip';
    }
  };

  const handleNameEdit = () => {
    setIsEditingName(true);
    setNewName(device.name || '');
  };

  const handleNameSave = () => {
    if (newName.trim() && newName !== device.name) {
      onUpdateName(device.id, newName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setNewName(device.name || '');
    setIsEditingName(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  const renderControls = () => {
    const state = device.state || {};
    
    if (device.type === 'relay4' && device.relayKey) {
      return (
        <button 
          className={`custom-toggle ${state.on ? 'on' : ''}`}
          onClick={() => onToggle(device.id, device.relayKey, !state.on)}
        >
          <span className="toggle-slider"></span>
          <span className="toggle-label">{device.relayKey.toUpperCase()}</span>
        </button>
      );
    } else {
      return (
        <button 
          className={`custom-toggle ${state.on ? 'on' : ''}`}
          onClick={() => onToggle(device.id, 'on', !state.on)}
        >
          <span className="toggle-slider"></span>
        </button>
      );
    }
  };

  return (
    <div className="device-card">
      <div className="device-header">
        <div className="device-info">
          <div className={`device-icon ${device.type || 'other'}`}>
            <i className={`fas fa-${getDeviceIcon(device.type)}`}></i>
          </div>
          <div className="device-details">
            <h3>
              {isEditingName ? (
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={handleKeyPress}
                  className="name-edit-input"
                  autoFocus
                />
              ) : (
                <>
                  <span className="device-name-text">{device.name || '-'}</span>
                  <button 
                    className="edit-name-btn" 
                    onClick={handleNameEdit}
                    title="แก้ไขชื่อ"
                  >
                    ✎
                  </button>
                </>
              )}
            </h3>
            <p>SN: {device.sn || '-'}</p>
          </div>
        </div>
        
        <div className="device-actions">
          <button 
            className="delete-device-btn" 
            onClick={() => onDelete(device.id, device.name || device.sn)}
            title="ลบอุปกรณ์"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      <div className="device-status">
        <span className={`status-dot ${device.online ? 'online' : 'offline'}`}></span>
        {device.online ? 'ออนไลน์' : 'ออฟไลน์'}
      </div>
      
      <div className="device-controls">
        {renderControls()}
      </div>
    </div>
  );
};

export default DeviceCard;
