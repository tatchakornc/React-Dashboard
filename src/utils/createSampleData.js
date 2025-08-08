import { ref, set, push } from 'firebase/database';
import { db } from '../firebase';
import { getDefaultDashboardType } from '../config/deviceTypes';

// สร้างข้อมูล SN ตัวอย่างใน valid_sn
export const createSampleValidSNs = async () => {
  try {
    const sampleSNs = {
      'SN001': {
        name: 'สวิตช์ไฟห้องนั่งเล่น',
        type: 'switch'
      },
      'SN002': {
        name: 'เซ็นเซอร์อุณหภูมิห้องนอน',
        type: 'sensor'
      },
      'SN003': {
        name: 'รีเลย์ควบคุม 4 ช่อง',
        type: 'relay4',
        relays: {
          relay1: 'ไฟห้องครัว',
          relay2: 'ไฟห้องน้ำ',
          relay3: 'พัดลมระบายอากาศ',
          relay4: 'ปั๊มน้ำ'
        }
      },
      'SN004': {
        name: 'เซ็นเซอร์ความชื้น',
        type: 'humidity'
      },
      'SN005': {
        name: 'สวิตช์ไฟภายนอก',
        type: 'switch'
      },
      'SN006': {
        name: 'เซ็นเซอร์แสง',
        type: 'light'
      },
      'SN007': {
        name: 'มอเตอร์ปรับความเร็ว',
        type: 'motor'
      },
      'SN008': {
        name: 'เซ็นเซอร์เสียง',
        type: 'sound'
      },
      'SN009': {
        name: 'ระบบรักษาความปลอดภัย',
        type: 'security'
      },
      'SN010': {
        name: 'ระบบแจ้งเตือนควัน',
        type: 'smoke'
      }
    };

    const validSNRef = ref(db, 'valid_sn');
    await set(validSNRef, sampleSNs);
    
    console.log('✅ สร้างข้อมูล SN ตัวอย่างสำเร็จ');
    return true;
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างข้อมูล SN:', error);
    return false;
  }
};

// สร้างข้อมูล Dashboard ตัวอย่างสำหรับ user
export const createUserSampleData = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // สร้างอุปกรณ์ตัวอย่าง
    const sampleDevices = [
      {
        sn: 'SN001',
        name: 'สวิตช์ไฟห้องนั่งเล่น',
        type: 'switch',
        state: { on: false },
        online: true
      },
      {
        sn: 'SN002',
        name: 'เซ็นเซอร์อุณหภูมิห้องนอน',
        type: 'sensor',
        state: { temperature: 25.5 },
        online: true
      },
      {
        sn: 'SN004',
        name: 'เซ็นเซอร์ความชื้น',
        type: 'humidity',
        state: { humidity: 65 },
        online: true
      },
      {
        sn: 'SN006',
        name: 'เซ็นเซอร์แสง',
        type: 'light',
        state: { brightness: 320 },
        online: true
      },
      {
        sn: 'SN007',
        name: 'มอเตอร์ปรับความเร็ว',
        type: 'motor',
        state: { speed: 1200 },
        online: true
      }
    ];

    // สร้างอุปกรณ์ relay4 แยกกัน
    const relay4Devices = [
      {
        sn: 'SN003',
        name: 'ไฟห้องครัว',
        relayKey: 'relay1',
        type: 'relay4',
        state: { on: false },
        online: true
      },
      {
        sn: 'SN003',
        name: 'ไฟห้องน้ำ',
        relayKey: 'relay2',
        type: 'relay4',
        state: { on: true },
        online: true
      },
      {
        sn: 'SN003',
        name: 'พัดลมระบายอากาศ',
        relayKey: 'relay3',
        type: 'relay4',
        state: { on: false },
        online: true
      },
      {
        sn: 'SN003',
        name: 'ปั๊มน้ำ',
        relayKey: 'relay4',
        type: 'relay4',
        state: { on: false },
        online: true
      }
    ];

    const allDevices = [...sampleDevices, ...relay4Devices];
    const userDevicesRef = ref(db, `devices/${userId}`);

    // เพิ่มอุปกรณ์ทีละตัว และ auto-assign dashboard type
    for (const device of allDevices) {
      const deviceRef = await push(userDevicesRef, device);
      
      // Auto-assign dashboard type based on device type
      const defaultDashboardType = getDefaultDashboardType(device.type);
      const deviceTypesRef = ref(db, `device_types/${userId}/${deviceRef.key}`);
      await set(deviceTypesRef, defaultDashboardType);
      
      console.log('✅ Created device:', device.name, 'with auto-assigned type:', defaultDashboardType);
    }

    console.log('✅ สร้างข้อมูล Dashboard ตัวอย่างสำเร็จ');
    return { success: true };
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างข้อมูล Dashboard:', error);
    return { success: false, error: error.message };
  }
};
