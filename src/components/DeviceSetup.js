import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import QrScanner from 'react-qr-scanner';

const DeviceSetup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);
  
  const [step, setStep] = useState(1);
  const [serialNumber, setSerialNumber] = useState(searchParams.get('sn') || '');
  const [deviceName, setDeviceName] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [showQrScanner, setShowQrScanner] = useState(false);

  useEffect(() => {
    if (serialNumber && user) {
      validateDevice();
    }
  }, [serialNumber, user]);

  const validateDevice = async () => {
    setIsValidating(true);
    setError('');
    
    try {
      const response = await fetch(`/api/devices/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial_number: serialNumber })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDeviceInfo(data.device);
        setDeviceName(`${data.device.device_type} ${serialNumber.slice(-6)}`);
        setStep(2);
      } else {
        setError(data.error || 'Device not found');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const registerDevice = async () => {
    setIsRegistering(true);
    setError('');
    
    try {
      const response = await fetch('/api/devices/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial_number: serialNumber,
          device_name: deviceName,
          user_id: user.uid
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStep(3);
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard?tab=devices');
        }, 3000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleQrScan = (data) => {
    if (data) {
      try {
        const url = new URL(data);
        const sn = url.searchParams.get('sn');
        if (sn) {
          setSerialNumber(sn);
          setShowQrScanner(false);
        }
      } catch (e) {
        setError('Invalid QR Code');
      }
    }
  };

  const handleQrError = (err) => {
    console.error(err);
    setError('Camera error. Please enter serial number manually.');
    setShowQrScanner(false);
  };

  if (loading) {
    return (
      <div className="setup-container loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="setup-container">
        <div className="setup-card">
          <h2>🔐 Please Login First</h2>
          <p>You need to login to add devices to your account.</p>
          <button onClick={() => navigate('/login')} className="btn btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-container">
      <div className="setup-card">
        
        {/* Step 1: Serial Number Input */}
        {step === 1 && (
          <div className="setup-step">
            <div className="step-header">
              <h2>📱 Add New Device</h2>
              <p>Step 1 of 3: Enter your device serial number</p>
            </div>
            
            <div className="input-methods">
              <div className="method-option">
                <h3>🔍 Scan QR Code</h3>
                <button 
                  onClick={() => setShowQrScanner(true)}
                  className="btn btn-secondary"
                >
                  Open Camera
                </button>
              </div>
              
              <div className="method-divider">OR</div>
              
              <div className="method-option">
                <h3>⌨️ Enter Manually</h3>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                  placeholder="ESP32_XXXXXXXXXX"
                  className="serial-input"
                />
              </div>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="step-actions">
              <button 
                onClick={validateDevice}
                disabled={!serialNumber || isValidating}
                className="btn btn-primary"
              >
                {isValidating ? 'Validating...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* QR Scanner Modal */}
        {showQrScanner && (
          <div className="qr-scanner-modal">
            <div className="scanner-container">
              <div className="scanner-header">
                <h3>📷 Scan Device QR Code</h3>
                <button 
                  onClick={() => setShowQrScanner(false)}
                  className="close-btn"
                >
                  ✕
                </button>
              </div>
              <QrScanner
                delay={300}
                onError={handleQrError}
                onScan={handleQrScan}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
        
        {/* Step 2: Device Configuration */}
        {step === 2 && deviceInfo && (
          <div className="setup-step">
            <div className="step-header">
              <h2>⚙️ Configure Device</h2>
              <p>Step 2 of 3: Set up your device</p>
            </div>
            
            <div className="device-info">
              <div className="device-preview">
                <div className="device-icon">🎛️</div>
                <div className="device-details">
                  <h3>{deviceInfo.device_type}</h3>
                  <p>Serial: {serialNumber}</p>
                  <p>Type: 4-Channel Relay Controller</p>
                </div>
              </div>
            </div>
            
            <div className="configuration-form">
              <div className="form-group">
                <label>Device Name</label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g., Living Room Lights"
                  className="device-name-input"
                />
                <small>Give your device a friendly name</small>
              </div>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="step-actions">
              <button 
                onClick={() => setStep(1)}
                className="btn btn-secondary"
              >
                Back
              </button>
              <button 
                onClick={registerDevice}
                disabled={!deviceName || isRegistering}
                className="btn btn-primary"
              >
                {isRegistering ? 'Adding Device...' : 'Add Device'}
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Success */}
        {step === 3 && (
          <div className="setup-step success">
            <div className="success-animation">
              <div className="checkmark">✅</div>
            </div>
            
            <div className="success-message">
              <h2>🎉 Device Added Successfully!</h2>
              <p>Your device <strong>{deviceName}</strong> has been added to your account.</p>
              
              <div className="next-steps">
                <h3>📋 Next Steps:</h3>
                <ul>
                  <li>🔌 Connect your ESP32 to power</li>
                  <li>📶 Make sure it's connected to WiFi</li>
                  <li>🎛️ Start controlling from your dashboard</li>
                </ul>
              </div>
            </div>
            
            <div className="step-actions">
              <button 
                onClick={() => navigate('/dashboard?tab=devices')}
                className="btn btn-primary"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceSetup;
