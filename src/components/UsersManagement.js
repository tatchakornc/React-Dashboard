import React, { useState, useEffect } from 'react';
import { ref, get, update } from 'firebase/database';
import { db } from '../firebase';

const UsersManagement = ({ showToast, userRole }) => {
  const [users, setUsers] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      const data = snapshot.val() || {};
      
      const usersArray = Object.entries(data).map(([uid, userInfo]) => ({
        uid,
        ...userInfo
      }));
      
      // เรียงตาม email
      usersArray.sort((a, b) => 
        (a.email || '').toLowerCase().localeCompare((b.email || '').toLowerCase())
      );
      
      setUsers(usersArray);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('โหลดรายการผู้ใช้ไม่สำเร็จ', 'error');
    }
    setLoading(false);
  };

  const handleRoleChange = async (uid, newRole) => {
    if (userRole !== 'owner') {
      showToast('คุณไม่มีสิทธิ์เปลี่ยน role', 'error');
      return;
    }

    try {
      const updates = {};
      updates[`users/${uid}/role`] = newRole;
      await update(ref(db), updates);
      
      showToast('เปลี่ยน role สำเร็จ');
      loadUsers();
    } catch (error) {
      console.error('Error changing role:', error);
      showToast('เปลี่ยน role ไม่สำเร็จ', 'error');
    }
  };

  const filteredUsers = users.filter(user => 
    !searchEmail || (user.email || '').toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <div className="users-management">
      <header className="header">
        <div className="header-left">
          <h1>จัดการสมาชิก</h1>
          <p>ดูและเปลี่ยนบทบาท (role) ของสมาชิก</p>
        </div>
      </header>
      
      <div className="settings-section">
        <div className="search-section">
          <div className="form-group">
            <label htmlFor="searchEmail">ค้นหาอีเมล</label>
            <input
              type="text"
              id="searchEmail"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="กรอกอีเมลที่ต้องการค้นหา..."
            />
          </div>
        </div>
        
        {loading ? (
          <p>กำลังโหลดรายการผู้ใช้...</p>
        ) : (
          <div className="users-list">
            <h3>รายการสมาชิก ({filteredUsers.length} คน)</h3>
            {filteredUsers.length === 0 ? (
              <p>ไม่พบสมาชิกในระบบ</p>
            ) : (
              <div className="table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>เปลี่ยน Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.uid}>
                        <td>{user.email || '-'}</td>
                        <td>
                          <span className={`role-badge ${user.role || 'user'}`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td>
                          {userRole === 'owner' ? (
                            <select
                              value={user.role || 'user'}
                              onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                              className="role-select"
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                              <option value="owner">owner</option>
                            </select>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManagement;
