import React, { useState, useEffect } from 'react';
import { ref, get, set, remove } from 'firebase/database';
import { db } from '../firebase';
import { DATABASE_DEVICE_TYPES, DEVICE_CATEGORIES } from '../config/databaseDeviceTypes';

const DatabaseManagement = ({ showToast }) => {
  const [snList, setSnList] = useState([]);
  const [formData, setFormData] = useState({
    sn: '',
    type: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSNList();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSNList = async () => {
    try {
      const snRef = ref(db, 'valid_sn');
      const snapshot = await get(snRef);
      const data = snapshot.val() || {};
      
      const snArray = Object.entries(data).map(([sn, info]) => ({
        sn,
        ...info
      }));
      
      setSnList(snArray);
    } catch (error) {
      console.error('Error loading SN list:', error);
      showToast('โหลดรายการ SN ไม่สำเร็จ', 'error');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.sn.trim() || !formData.type.trim() || !formData.name.trim()) {
      showToast('กรุณากรอกข้อมูลให้ครบ', 'error');
      return;
    }

    setLoading(true);

    try {
      const snRef = ref(db, `valid_sn/${formData.sn}`);
      await set(snRef, {
        type: formData.type,
        name: formData.name
      });

      showToast('เพิ่ม/อัปเดต SN สำเร็จ');
      setFormData({ sn: '', type: '', name: '' });
      loadSNList();
    } catch (error) {
      console.error('Error saving SN:', error);
      showToast('เพิ่ม/อัปเดต SN ไม่สำเร็จ', 'error');
    }

    setLoading(false);
  };

  const handleDelete = async (sn) => {
    if (!window.confirm(`ลบ SN "${sn}" นี้?`)) return;

    try {
      const snRef = ref(db, `valid_sn/${sn}`);
      await remove(snRef);
      
      showToast('ลบ SN สำเร็จ');
      loadSNList();
    } catch (error) {
      console.error('Error deleting SN:', error);
      showToast('ลบ SN ไม่สำเร็จ', 'error');
    }
  };

  return (
    <div className="database-management">
      <header className="header">
        <div className="header-left">
          <h1>จัดการ Database SN</h1>
          <p>เพิ่ม/แก้ไข/ลบ SN, ประเภท, ชื่ออุปกรณ์</p>
        </div>
      </header>
      
      <div className="settings-section">
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group">
            <label htmlFor="sn">SN</label>
            <input
              type="text"
              id="sn"
              name="sn"
              value={formData.sn}
              onChange={handleInputChange}
              placeholder="Serial Number"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
              className="type-select"
            >
              <option value="">-- เลือกประเภทอุปกรณ์ --</option>
              {Object.entries(DEVICE_CATEGORIES).map(([categoryKey, categoryInfo]) => (
                <optgroup key={categoryKey} label={categoryInfo.label}>
                  {Object.entries(DATABASE_DEVICE_TYPES)
                    .filter(([, deviceType]) => deviceType.category === categoryKey)
                    .map(([typeKey, deviceType]) => (
                      <option key={typeKey} value={typeKey}>
                        {deviceType.label} - {deviceType.description}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            {formData.type && (
              <div className="type-preview">
                <i className={DATABASE_DEVICE_TYPES[formData.type]?.icon}></i>
                <span>{DATABASE_DEVICE_TYPES[formData.type]?.label}</span>
                <small>{DATABASE_DEVICE_TYPES[formData.type]?.description}</small>
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="ชื่ออุปกรณ์"
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'กำลังบันทึก...' : 'เพิ่ม/อัปเดต SN'}
          </button>
        </form>
        
        <div className="sn-list">
          <h3>รายการ SN ในระบบ</h3>
          {snList.length === 0 ? (
            <p>ไม่มีข้อมูล SN ในระบบ</p>
          ) : (
            <div className="table-container">
              <table className="sn-table">
                <thead>
                  <tr>
                    <th>SN</th>
                    <th>Type</th>
                    <th>Name</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {snList.map(item => (
                    <tr key={item.sn}>
                      <td>{item.sn}</td>
                      <td>
                        <div className="type-cell">
                          {DATABASE_DEVICE_TYPES[item.type] ? (
                            <>
                              <i className={DATABASE_DEVICE_TYPES[item.type].icon}></i>
                              <span>{DATABASE_DEVICE_TYPES[item.type].label}</span>
                              <small>({item.type})</small>
                            </>
                          ) : (
                            <span>{item.type || '-'}</span>
                          )}
                        </div>
                      </td>
                      <td>{item.name || '-'}</td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(item.sn)}
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseManagement;

// Add styles for the new dropdown and preview
const styles = `
  .type-select {
    width: 100%;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .type-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .type-select optgroup {
    font-weight: 600;
    color: #374151;
    background: #f3f4f6;
    padding: 5px;
  }
  
  .type-select option {
    padding: 8px;
    font-size: 13px;
  }
  
  .type-preview {
    margin-top: 10px;
    padding: 12px;
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-radius: 8px;
    border: 1px solid #93c5fd;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .type-preview i {
    font-size: 18px;
    color: #3b82f6;
    width: 20px;
    text-align: center;
  }
  
  .type-preview span {
    font-weight: 600;
    color: #1e40af;
  }
  
  .type-preview small {
    color: #6b7280;
    font-size: 12px;
    margin-left: auto;
  }
  
  .type-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .type-cell i {
    font-size: 16px;
    color: #6b7280;
    width: 18px;
    text-align: center;
  }
  
  .type-cell span {
    font-weight: 500;
    color: #374151;
  }
  
  .type-cell small {
    color: #9ca3af;
    font-size: 11px;
    font-family: monospace;
  }
  
  @media (max-width: 768px) {
    .type-preview {
      flex-direction: column;
      align-items: flex-start;
      gap: 5px;
    }
    
    .type-preview small {
      margin-left: 0;
    }
    
    .type-cell {
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
