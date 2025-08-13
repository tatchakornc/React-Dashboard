import { ref, set, push } from 'firebase/database';
import { db } from '../firebase';
import { getDefaultDashboardType } from '../config/deviceTypes';

// ฟังก์ชันนี้ไม่สร้างข้อมูลตัวอย่างแล้ว - ใช้สำหรับการผลิตจริง
export const createSampleValidSNs = async () => {
  console.log('ℹ️ ระบบไม่สร้างข้อมูล SN ตัวอย่าง - ใช้สำหรับการผลิต');
  return true;
};

// ฟังก์ชันนี้ไม่สร้างข้อมูลตัวอย่างแล้ว - ใช้สำหรับการผลิตจริง
export const createUserSampleData = async (userId) => {
  console.log('ℹ️ ระบบไม่สร้างข้อมูลตัวอย่าง - กรุณาเพิ่มอุปกรณ์จริงผ่านหน้า Add Device');
  return { success: true, message: 'No sample data created - production mode' };
};
