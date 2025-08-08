import React from 'react';

const LoadingOverlay = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <i className="fas fa-spinner fa-spin"></i>
        <p>กำลังโหลด...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
