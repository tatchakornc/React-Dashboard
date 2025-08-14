import React, { useState } from 'react';
import './DeviceCard.css';

/**
 * Display information about a single device and provide controls for its pins
 * and sensors. The component is intentionally flexible so it can be reused in
 * different dashboards throughout the application.
 */
const DeviceCard = ({
  device,
  onToggle,
  onUpdateName,
  onDelete,
  onControl,
  isConnected = true
}) => {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(device.device_name || device.name || '');

  const deviceId = device.device_id || device.id;

  const handleTogglePin = (pin) => {
    if (onControl) {
      onControl(deviceId, {
        pin: pin.pin,
        state: pin.state ? 'off' : 'on'
      });
    } else if (onToggle) {
      onToggle(deviceId, pin.id || pin.relayKey || pin.pin, !pin.state);
    }
  };

  const handleNameSave = () => {
    setEditingName(false);
    if (onUpdateName) {
      onUpdateName(deviceId, name);
    }
  };

  return (
    <div className={`device-card ${device.status || (device.online ? 'online' : 'offline')}`}> 
      <div className="device-header">
        <div className="device-info">
          <div className="device-details">
            {editingName ? (
              <input
                className="name-edit-input"
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={handleNameSave}
                autoFocus
              />
            ) : (
              <h3 className="device-name">
                <span className="device-name-text">{name || 'Unnamed Device'}</span>
                {onUpdateName && (
                  <button
                    className="edit-name-btn"
                    onClick={() => setEditingName(true)}
                    aria-label="Edit device name"
                  >✎</button>
                )}
              </h3>
            )}
            {device.serial_number && (
              <p className="device-serial">{device.serial_number}</p>
            )}
            {device.device_type && (
              <span className="device-type">{device.device_type}</span>
            )}
          </div>
        </div>
        {onDelete && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(deviceId, name)}
          >
            Delete
          </button>
        )}
      </div>

      {device.pins && device.pins.length > 0 && (
        <div className="device-controls">
          <h4 className="controls-title">Controls</h4>
          <div className="controls-grid">
            {device.pins.map(pin => (
              <div key={pin.id || pin.pin} className="control-item">
                <div className="control-info">
                  <span className="control-name">{pin.name || pin.id}</span>
                  <span className="control-pin">Pin {pin.pin}</span>
                </div>
                <button
                  className={`control-btn ${pin.state ? 'on' : 'off'}`}
                  onClick={() => handleTogglePin(pin)}
                  disabled={onControl ? !isConnected : false}
                >
                  <span className="btn-text">{pin.state ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {device.sensors && device.sensors.length > 0 && (
        <div className="device-sensors">
          <h4 className="sensors-title">Sensors</h4>
          <div className="sensors-grid">
            {device.sensors.map(sensor => (
              <div key={sensor.id} className="sensor-item">
                <div className="sensor-info">
                  <span className="sensor-name">{sensor.name}</span>
                  <span className="sensor-value">{sensor.value}{sensor.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {onControl && !isConnected && (
        <div className="connection-warning">
          Unable to control device: MQTT not connected
        </div>
      )}
    </div>
  );
};

export default DeviceCard;
