import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Sidebar = ({ currentUser, userRole, currentPage, setCurrentPage, showToast }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast('ออกจากระบบสำเร็จ');
    } catch (error) {
      showToast('เกิดข้อผิดพลาดในการออกจากระบบ', 'error');
    }
  };

  const navItems = [
    { id: 'main', icon: 'fas fa-home', label: 'หน้าหลัก', show: true },
    { id: 'realtime', icon: 'fas fa-tachometer-alt', label: 'Real-Time Dashboard', show: true },
    { id: 'settings', icon: 'fas fa-cog', label: 'การตั้งค่า', show: true },
    { id: 'addDevice', icon: 'fas fa-plus', label: 'เพิ่มอุปกรณ์', show: true },
    { id: 'qrGenerator', icon: 'fas fa-qrcode', label: 'QR Generator', show: userRole === 'owner' || userRole === 'admin', dev: true },
    { id: 'database', icon: 'fas fa-database', label: 'Database', show: userRole === 'owner' || userRole === 'admin' },
    { id: 'users', icon: 'fas fa-users', label: 'สมาชิก', show: userRole === 'owner' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <i className="fas fa-microchip"></i>
        </div>
        <h3>ESP32 Dashboard</h3>
      </div>
      
      <div className="user-info">
        <div className="user-avatar">
          <i className="fas fa-user"></i>
        </div>
        <div className="user-details">
          <span className="user-name">{currentUser?.email || 'ผู้ใช้งาน'}</span>
          <span className="user-status">ออนไลน์</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map(item => (
          item.show && (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''} ${item.dev ? 'dev-item' : ''}`}
              onClick={() => setCurrentPage(item.id)}
              title={item.dev ? 'สำหรับการพัฒนาและทดสอบ' : ''}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
              {item.dev && <span className="dev-badge">DEV</span>}
            </button>
          )
        ))}
        
        <button className="nav-item" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i>
          <span>ออกจากระบบ</span>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
