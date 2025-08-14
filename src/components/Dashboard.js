import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import MainDashboard from './MainDashboard';
import Settings from './Settings';
import AddDevice from './AddDevice';
import UsersManagement from './UsersManagement';
import QRCodeGenerator from './QRCodeGenerator';
import MQTTDashboard from './MQTTDashboard';
import DatabaseManagement from './DatabaseManagement';
import './Dashboard.css';

const Dashboard = ({ currentUser, userRole, showToast, pendingDevice, setPendingDevice }) => {
  const [currentPage, setCurrentPage] = useState('main');

  // อัตโนมัติไปหน้า AddDevice เมื่อมี pendingDevice
  useEffect(() => {
    if (pendingDevice && currentPage !== 'addDevice') {
      console.log('🔄 Auto-navigating to AddDevice page for pending device');
      setCurrentPage('addDevice');
    }
  }, [pendingDevice, currentPage]);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'main':
      case 'dashboard':
        return <MQTTDashboard currentUser={currentUser} showToast={showToast} />;
      case 'settings':
        return <Settings currentUser={currentUser} showToast={showToast} />;
      case 'addDevice':
        return <AddDevice 
          currentUser={currentUser} 
          showToast={showToast} 
          setCurrentPage={setCurrentPage}
          pendingDevice={pendingDevice}
          setPendingDevice={setPendingDevice}
        />;
      case 'qrGenerator':
        return <QRCodeGenerator />;
      case 'database':
        return userRole === 'owner' || userRole === 'admin' ? 
          <DatabaseManagement showToast={showToast} /> : 
          <MQTTDashboard currentUser={currentUser} showToast={showToast} />;
      case 'users':
        return userRole === 'owner' ? 
          <UsersManagement showToast={showToast} userRole={userRole} /> : 
          <MQTTDashboard currentUser={currentUser} showToast={showToast} />;
      default:
        return <MQTTDashboard currentUser={currentUser} showToast={showToast} />;
    }
  };

  return (
    <div className="dashboard">
      <Sidebar 
        currentUser={currentUser}
        userRole={userRole}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        showToast={showToast}
      />
      <main className="main-content">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default Dashboard;
