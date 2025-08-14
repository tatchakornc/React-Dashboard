import { ref, set } from 'firebase/database';
import { db } from '../firebase';

export const createSampleSNs = async () => {
  try {
    console.log('Creating sample SNs...');
    
    const sampleSNs = [
      {
        sn: 'ESP32-001A',
        type: 'relay4',
        model: 'ESP32-4Relay-V1',
        manufacturer: 'IoT Device Co.',
        frequency: '2.4GHz',
        relays: {
          relay1: 'Relay 1',
          relay2: 'Relay 2',
          relay3: 'Relay 3',
          relay4: 'Relay 4'
        },
        location: '',
        used: false,
        created_date: new Date().toISOString()
      },
      {
        sn: 'ESP32-002B',
        type: 'relay4',
        model: 'ESP32-4Relay-V1',
        manufacturer: 'IoT Device Co.',
        frequency: '2.4GHz',
        relays: {
          relay1: 'Relay 1',
          relay2: 'Relay 2',
          relay3: 'Relay 3',
          relay4: 'Relay 4'
        },
        location: '',
        used: false,
        created_date: new Date().toISOString()
      },
      {
        sn: 'ESP32-003C',
        type: 'lighting',
        model: 'ESP32-Light-V1',
        manufacturer: 'IoT Device Co.',
        frequency: '2.4GHz',
        location: '',
        used: false,
        created_date: new Date().toISOString()
      },
      {
        sn: 'ESP32-USED1',
        type: 'relay4',
        model: 'ESP32-4Relay-V1',
        manufacturer: 'IoT Device Co.',
        frequency: '2.4GHz',
        relays: {
          relay1: 'Relay 1',
          relay2: 'Relay 2',
          relay3: 'Relay 3',
          relay4: 'Relay 4'
        },
        location: '',
        used: true,
        used_by: 'test@example.com',
        used_date: new Date('2024-01-15').toISOString(),
        used_by_uid: 'test-user-123',
        created_date: new Date('2024-01-01').toISOString()
      }
    ];

    for (const snData of sampleSNs) {
      const snRef = ref(db, `valid_sn/${snData.sn}`);
      await set(snRef, snData);
      console.log(`Created SN: ${snData.sn}`);
    }

    console.log('✅ Sample SNs created successfully!');
    return { success: true, message: 'สร้างข้อมูล SN ตัวอย่างสำเร็จ!' };
    
  } catch (error) {
    console.error('❌ Error creating sample SNs:', error);
    return { success: false, error: error.message };
  }
};
