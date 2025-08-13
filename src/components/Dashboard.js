import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import MainDashboard from './MainDashboard';
import Settings from './Settings';
import AddDevice from './AddDevice';
import DatabaseManagement from './DatabaseManagement';
import UsersManagement from './UsersManagement';
import QRCodeGenerator from './QRCodeGenerator';
import RealTimeDashboard from './RealTimeDashboard';
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
        return <RealTimeDashboard user={currentUser} showToast={showToast} />;
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
          <RealTimeDashboard user={currentUser} showToast={showToast} />;
      case 'users':
        return userRole === 'owner' ? 
          <UsersManagement showToast={showToast} userRole={userRole} /> : 
          <RealTimeDashboard user={currentUser} showToast={showToast} />;
      default:
        return <RealTimeDashboard user={currentUser} showToast={showToast} />;
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
