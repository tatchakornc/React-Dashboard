import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, push, set } from 'firebase/database';

function IoTDashboard() {
  const [sensorData, setSensorData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ฟังข้อมูลจาก sensor แบบ real-time
    const sensorsRef = ref(db, 'sensors');
    
    const unsubscribe = onValue(sensorsRef, (snapshot) => {
      const data = snapshot.val();
      setSensorData(data || {});
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // ฟังก์ชันส่งคำสั่งไปยัง device
  const sendCommand = async (deviceId, command) => {
    try {
      const commandRef = ref(db, `commands/${deviceId}`);
      await push(commandRef, {
        command: command,
        timestamp: Date.now()
      });
      console.log('Command sent successfully');
    } catch (error) {
      console.error('Error sending command:', error);
    }
  };

  if (loading) {
    return <div>Loading sensor data...</div>;
  }

  return (
    <div className="iot-dashboard">
      <h1>IoT Dashboard</h1>
      
      {/* แสดงข้อมูล sensor */}
      <div className="sensor-grid">
        {Object.entries(sensorData).map(([sensorId, data]) => (
          <div key={sensorId} className="sensor-card">
            <h3>Sensor: {sensorId}</h3>
            <p>Temperature: {data.temperature}°C</p>
            <p>Humidity: {data.humidity}%</p>
            <p>Last Update: {new Date(data.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* ปุ่มควบคุม device */}
      <div className="controls">
        <button onClick={() => sendCommand('device1', 'turn_on')}>
          Turn On Device 1
        </button>
        <button onClick={() => sendCommand('device1', 'turn_off')}>
          Turn Off Device 1
        </button>
      </div>
    </div>
  );
}

export default IoTDashboard;
