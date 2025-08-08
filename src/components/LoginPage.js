import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from '../firebase';
import './LoginPage.css';

const LoginPage = ({ showToast, pendingDevice }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      showToast('เข้าสู่ระบบสำเร็จ!');
    } catch (error) {
      let errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
          break;
        case 'auth/invalid-email':
          errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
          break;
        case 'auth/user-disabled':
          errorMessage = 'บัญชีผู้ใช้ถูกปิดใช้งาน';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'ลองเข้าสู่ระบบครั้งเดียวมากเกินไป กรุณารอสักครู่';
          break;
        default:
          errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      }
      
      showToast(errorMessage, 'error');
    }
    
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      showToast('รหัสผ่านไม่ตรงกัน', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await set(ref(db, `users/${userCredential.user.uid}`), {
        email: formData.email,
        role: 'user'
      });
      showToast('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
      setIsLogin(true);
    } catch (error) {
      let errorMessage = 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น';
          break;
        case 'auth/invalid-email':
          errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
          break;
        case 'auth/weak-password':
          errorMessage = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'การสมัครสมาชิกถูกปิดใช้งาน';
          break;
        default:
          errorMessage = 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      }
      
      showToast(errorMessage, 'error');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {pendingDevice && (
          <div style={{
            background: '#ffffff',
            color: '#1a202c',
            padding: '24px',
            borderRadius: '16px',
            marginBottom: '30px',
            textAlign: 'center',
            border: '3px solid #667eea',
            boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background decoration */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%)'
            }}></div>
            
            <h4 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#667eea'
            }}>📱 พบอุปกรณ์จาก QR Code!</h4>
            
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              {pendingDevice.sn && (
                <p style={{ 
                  margin: '0', 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  textAlign: 'center'
                }}>
                  SN: {pendingDevice.sn}
                </p>
              )}
            </div>
            
            <p style={{ 
              margin: '0', 
              fontSize: '16px', 
              color: '#4a5568',
              fontWeight: '500',
              lineHeight: '1.5'
            }}>
              รอการเพิ่มอยู่<br/>
              <strong style={{ color: '#667eea' }}>
                กรุณาเข้าสู่ระบบเพื่อเพิ่มอุปกรณ์อัตโนมัติ
              </strong>
            </p>
          </div>
        )}
        
        <h2>{isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</h2>
        
        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="อีเมล"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="รหัสผ่าน"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <input
                type="password"
                name="confirmPassword"
                placeholder="ยืนยันรหัสผ่าน"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </div>
          )}
          
          <button type="submit" disabled={loading}>
            {loading ? 'กำลังดำเนินการ...' : (isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
          </button>
        </form>
        
        <p>
          {isLogin ? 'ยังไม่มีบัญชี?' : 'มีบัญชีแล้ว?'}
          <button 
            type="button" 
            className="link-button"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
