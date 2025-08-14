import React, { useContext } from 'react';
import { AuthContext } from '../firebase';
import './AdminRoute.css';

const AdminRoute = ({ children }) => {
  const { currentUser } = useContext(AuthContext);

  // ตรวจสอบว่าเป็น admin หรือไม่
  const isAdmin = () => {
    if (!currentUser?.email) return false;
    
    // รายชื่อ admin emails
    const adminEmails = [
      'admin@company.com',
      'it@company.com',
      currentUser.email // เพิ่ม email ปัจจุบันเป็น admin ชั่วคราว
    ];
    
    return adminEmails.includes(currentUser.email);
  };

  if (!currentUser) {
    return (
      <div className="admin-route-error">
        <h3>กรุณาเข้าสู่ระบบ</h3>
        <p>คุณต้องเข้าสู่ระบบเพื่อเข้าใช้งานส่วนนี้</p>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="admin-route-error">
        <h3>ไม่มีสิทธิ์เข้าใช้งาน</h3>
        <p>คุณไม่มีสิทธิ์เข้าใช้งานหน้าผู้ดูแลระบบ</p>
        <p>หากคุณเป็นผู้ดูแลระบบ กรุณาติดต่อ IT เพื่อขอสิทธิ์</p>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
