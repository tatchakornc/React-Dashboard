import { useState, useEffect, useCallback } from 'react';
import mqttService from '../services/mqttService';

export const useMQTT = (brokerConfig) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [devices, setDevices] = useState(new Map());
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  // Connect to MQTT Broker
  const connect = useCallback(async (config = brokerConfig) => {
    if (!config?.url) {
      setError('กรุณาระบุ URL ของ MQTT Broker');
      return false;
    }

    try {
      setConnectionStatus('connecting');
      setError(null);

      const options = {};
      if (config.username) options.username = config.username;
      if (config.password) options.password = config.password;

      await mqttService.connect(config.url, options);
      
      setIsConnected(true);
      setConnectionStatus('connected');
      return true;
    } catch (error) {
      console.error('MQTT Connection failed:', error);
      setError(`การเชื่อมต่อล้มเหลว: ${error.message}`);
      setIsConnected(false);
      setConnectionStatus('error');
      return false;
    }
  }, [brokerConfig]);

  // Disconnect from MQTT Broker
  const disconnect = useCallback(() => {
    mqttService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setDevices(new Map());
    setMessages([]);
  }, []);

  // Subscribe to device topics
  const subscribeToDevice = useCallback((deviceId) => {
    if (!isConnected) return false;

    const handleMessage = (topic, message) => {
      try {
        const data = JSON.parse(message);
        const timestamp = new Date().toISOString();

        // Update device data
        setDevices(prev => {
          const updated = new Map(prev);
          const device = updated.get(deviceId) || { id: deviceId, lastSeen: timestamp };
          
          if (topic.includes('/status')) {
            device.status = data;
          } else if (topic.includes('/data')) {
            device.sensorData = data;
          }
          
          device.lastSeen = timestamp;
          updated.set(deviceId, device);
          return updated;
        });

        // Add to messages log
        setMessages(prev => [
          { topic, message, timestamp, deviceId },
          ...prev.slice(0, 99) // Keep only last 100 messages
        ]);

      } catch (error) {
        console.error('Error parsing MQTT message:', error);
        setMessages(prev => [
          { topic, message, timestamp: new Date().toISOString(), error: true },
          ...prev.slice(0, 99)
        ]);
      }
    };

    mqttService.subscribeToDevice(deviceId, handleMessage);
    return true;
  }, [isConnected]);

  // Control device (send command)
  const controlDevice = useCallback(async (deviceId, command, value) => {
    if (!isConnected) {
      setError('ยังไม่ได้เชื่อมต่อ MQTT Broker');
      return false;
    }

    try {
      await mqttService.controlDevice(deviceId, command, value);
      
      // Add to messages log
      setMessages(prev => [
        {
          topic: `devices/${deviceId}/command`,
          message: JSON.stringify({ command, value }),
          timestamp: new Date().toISOString(),
          sent: true
        },
        ...prev.slice(0, 99)
      ]);

      return true;
    } catch (error) {
      console.error('Error controlling device:', error);
      setError(`ส่งคำสั่งล้มเหลว: ${error.message}`);
      return false;
    }
  }, [isConnected]);

  // Subscribe to custom topic
  const subscribe = useCallback(async (topic, handler) => {
    if (!isConnected) return false;

    try {
      await mqttService.subscribe(topic, handler);
      return true;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      setError(`Subscribe ล้มเหลว: ${error.message}`);
      return false;
    }
  }, [isConnected]);

  // Publish to custom topic
  const publish = useCallback(async (topic, message, options) => {
    if (!isConnected) return false;

    try {
      await mqttService.publish(topic, message, options);
      
      // Add to messages log
      setMessages(prev => [
        {
          topic,
          message: typeof message === 'object' ? JSON.stringify(message) : message,
          timestamp: new Date().toISOString(),
          sent: true
        },
        ...prev.slice(0, 99)
      ]);

      return true;
    } catch (error) {
      console.error('Error publishing message:', error);
      setError(`ส่งข้อความล้มเหลว: ${error.message}`);
      return false;
    }
  }, [isConnected]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Get device by ID
  const getDevice = useCallback((deviceId) => {
    return devices.get(deviceId);
  }, [devices]);

  // Get all devices as array
  const getAllDevices = useCallback(() => {
    return Array.from(devices.values());
  }, [devices]);

  // Effect to handle connection status updates
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = mqttService.getConnectionStatus();
      if (currentStatus !== isConnected) {
        setIsConnected(currentStatus);
        setConnectionStatus(currentStatus ? 'connected' : 'disconnected');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [disconnect, isConnected]);

  return {
    // Connection state
    isConnected,
    connectionStatus,
    error,
    
    // Connection methods
    connect,
    disconnect,
    clearError,
    
    // Device management
    devices: getAllDevices(),
    subscribeToDevice,
    controlDevice,
    getDevice,
    
    // Custom MQTT operations
    subscribe,
    publish,
    
    // Messages and logging
    messages,
    clearMessages,
    
    // Utility
    brokerUrl: brokerConfig?.url || ''
  };
};