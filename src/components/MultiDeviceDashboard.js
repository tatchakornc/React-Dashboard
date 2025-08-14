import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { useMQTT } from '../hooks/useMQTT';
import DeviceCard from './DeviceCard';
import './MultiDeviceDashboard.css';

const MultiDeviceDashboard = ({ showToast }) => {
  const [user] = useAuthState(auth);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    subscribe,
    publish
  } = useMQTT({
    url: 'ws://localhost:8083/mqtt',
    username: '',
    password: ''
  });

  // Load user devices
  useEffect(() => {
    if (user) {
      loadUserDevices();
    }
  }, [user]);

  // Auto-connect MQTT when component mounts
  useEffect(() => {
    if (!isConnected) {
      connect({
        url: 'ws://localhost:8083/mqtt',
        username: '',
        password: ''
      });
    }
  }, []);

  // Subscribe to device updates
  useEffect(() => {
    if (isConnected && devices.length > 0) {
      devices.forEach(device => {
        subscribe(`devices/${device.serial_number}/+`, handleDeviceMessage);
      });
    }
  }, [isConnected, devices]);

  const loadUserDevices = async () => {
    try {
      const response = await fetch(`/api/users/${user.uid}/devices`);
      const data = await response.json();
      
      if (data.devices) {
        setDevices(data.devices.map(device => ({
          ...device,
          status: 'offline',
          lastSeen: device.last_seen,
          pins: getDevicePins(device.device_type),
          sensors: getDeviceSensors(device.device_type)
        })));
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
      showToast('❌ Failed to load devices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getDevicePins = (deviceType) => {
    switch (deviceType) {
      case '4Relay':
        return [
          { id: 'relay1', name: 'Relay 1', pin: 25, state: false },
          { id: 'relay2', name: 'Relay 2', pin: 26, state: false },
          { id: 'relay3', name: 'Relay 3', pin: 27, state: false },
          { id: 'relay4', name: 'Relay 4', pin: 14, state: false }
        ];
      case 'LED':
        return [
          { id: 'led1', name: 'LED 1', pin: 2, state: false },
          { id: 'led2', name: 'LED 2', pin: 4, state: false }
        ];
      default:
        return [];
    }
  };

  const getDeviceSensors = (deviceType) => {
    switch (deviceType) {
      case '4Relay':
        return [
          { id: 'temp', name: 'Temperature', value: '--', unit: '°C' },
          { id: 'humidity', name: 'Humidity', value: '--', unit: '%' },
          { id: 'heat_index', name: 'Heat Index', value: '--', unit: '°C' }
        ];
      default:
        return [];
    }
  };

  const handleDeviceMessage = (topic, message) => {
    try {
      const data = JSON.parse(message);
      const serialNumber = topic.split('/')[1];
      
      setDevices(prevDevices => 
        prevDevices.map(device => {
          if (device.serial_number === serialNumber) {
            const updatedDevice = { ...device };
            
            switch (data.type) {
              case 'relay_status':
                updatedDevice.status = 'online';
                updatedDevice.lastSeen = new Date();
                if (data.data && updatedDevice.pins) {
                  updatedDevice.pins = updatedDevice.pins.map((pin, index) => ({
                    ...pin,
                    state: data.data[`relay${index + 1}`] || false
                  }));
                }
                break;
                
              case 'sensor_data':
                if (data.data && updatedDevice.sensors) {
                  updatedDevice.sensors = updatedDevice.sensors.map(sensor => {
                    switch (sensor.id) {
                      case 'temp':
                        return { ...sensor, value: data.data.temperature || '--' };
                      case 'humidity':
                        return { ...sensor, value: data.data.humidity || '--' };
                      case 'heat_index':
                        return { ...sensor, value: data.data.heat_index || '--' };
                      default:
                        return sensor;
                    }
                  });
                }
                break;
                
              case 'heartbeat':
                updatedDevice.status = 'online';
                updatedDevice.lastSeen = new Date();
                updatedDevice.ip = data.ip_address;
                updatedDevice.rssi = data.wifi_rssi;
                break;
            }
            
            return updatedDevice;
          }
          return device;
        })
      );
    } catch (error) {
      console.error('Error parsing device message:', error);
    }
  };

  const controlDevice = async (deviceId, command) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          ...command
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Also send MQTT command directly
        const device = devices.find(d => d.device_id === deviceId);
        if (device) {
          publish(`devices/${device.serial_number}/command`, JSON.stringify(command));
        }
        showToast(`✅ Command sent successfully`, 'success');
      } else {
        showToast(`❌ ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Control error:', error);
      showToast('❌ Failed to send command', 'error');
    }
  };

  const deleteDevice = async (deviceId) => {
    if (!confirm('Are you sure you want to remove this device?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid })
      });
      
      if (response.ok) {
        setDevices(prev => prev.filter(d => d.device_id !== deviceId));
        showToast('✅ Device removed successfully', 'success');
      }
    } catch (error) {
      showToast('❌ Failed to remove device', 'error');
    }
  };

  // Filter and sort devices
  const filteredDevices = devices
    .filter(device => {
      const matchesSearch = device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           device.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || 
                           device.device_type.toLowerCase() === filterType.toLowerCase() ||
                           device.status === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.device_name.localeCompare(b.device_name);
        case 'type':
          return a.device_type.localeCompare(b.device_type);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'lastSeen':
          return new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="multi-device-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading your devices...</p>
      </div>
    );
  }

  return (
    <div className="multi-device-dashboard">
      
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h2>📱 My Devices</h2>
          <p>Manage and control your IoT devices</p>
        </div>
        
        <div className="header-right">
          <div className="connection-status">
            <span className={`status-dot ${connectionStatus}`}></span>
            <span className="status-text">
              {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <button 
            onClick={() => window.location.href = '/setup'}
            className="btn btn-primary add-device-btn"
          >
            ➕ Add Device
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="dashboard-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="4Relay">4-Channel Relay</option>
            <option value="LED">LED Controller</option>
            <option value="online">Online Only</option>
            <option value="offline">Offline Only</option>
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
            <option value="status">Sort by Status</option>
            <option value="lastSeen">Sort by Last Seen</option>
          </select>
        </div>
      </div>

      {/* Device Stats */}
      <div className="device-stats">
        <div className="stat-card">
          <div className="stat-number">{devices.length}</div>
          <div className="stat-label">Total Devices</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{devices.filter(d => d.status === 'online').length}</div>
          <div className="stat-label">Online</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{devices.filter(d => d.status === 'offline').length}</div>
          <div className="stat-label">Offline</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{devices.filter(d => d.device_type === '4Relay').length}</div>
          <div className="stat-label">Relay Controllers</div>
        </div>
      </div>

      {/* Device Grid */}
      <div className="devices-grid">
        {filteredDevices.length === 0 ? (
          <div className="no-devices">
            <div className="no-devices-icon">📱</div>
            <h3>No devices found</h3>
            <p>
              {devices.length === 0 
                ? "You haven't added any devices yet." 
                : "No devices match your search criteria."
              }
            </p>
            {devices.length === 0 && (
              <button 
                onClick={() => window.location.href = '/setup'}
                className="btn btn-primary"
              >
                ➕ Add Your First Device
              </button>
            )}
          </div>
        ) : (
          filteredDevices.map(device => (
            <DeviceCard
              key={device.device_id}
              device={device}
              onControl={controlDevice}
              onDelete={deleteDevice}
              isConnected={isConnected}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MultiDeviceDashboard;
