import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from './firebase';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import LoadingOverlay from './components/LoadingOverlay';
import ToastContainer from './components/ToastContainer';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [pendingDevice, setPendingDevice] = useState(null);

  useEffect(() => {
    // เช็ค URL parameter สำหรับข้อมูล device จาก QR code
    const urlParams = new URLSearchParams(window.location.search);
    const deviceParam = urlParams.get('device');
    
    if (deviceParam) {
      try {
        const deviceData = JSON.parse(decodeURIComponent(deviceParam));
        setPendingDevice(deviceData);
        
        // ลบ parameter ออกจาก URL หลังอ่านแล้ว
        window.history.replaceState({}, document.title, window.location.pathname);
        
        console.log('📱 พบข้อมูล device จาก QR Code:', deviceData);
      } catch (error) {
        console.error('❌ Error parsing device data from URL:', error);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const roleSnapshot = await get(ref(db, `users/${user.uid}/role`));
          setUserRole(roleSnapshot.val() || 'user');
        } catch (error) {
          console.error('Error loading user role:', error);
          setUserRole('user');
        }
      } else {
        setCurrentUser(null);
        setUserRole('');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <div className="App">
      {currentUser ? (
        <Dashboard 
          currentUser={currentUser}
          userRole={userRole}
          showToast={showToast}
          pendingDevice={pendingDevice}
          setPendingDevice={setPendingDevice}
        />
      ) : (
        <LoginPage 
          showToast={showToast} 
          pendingDevice={pendingDevice}
        />
      )}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;