// Device Types for Database Management
export const DATABASE_DEVICE_TYPES = {
  // Hardware Types
  relay4: {
    label: 'Relay 4 ช่อง',
    description: 'บอร์ดรีเลย์ 4 ช่อง สำหรับควบคุมอุปกรณ์ไฟฟ้า',
    icon: 'fas fa-toggle-off',
    category: 'Control'
  },
  relay8: {
    label: 'Relay 8 ช่อง',
    description: 'บอร์ดรีเลย์ 8 ช่อง สำหรับควบคุมอุปกรณ์ไฟฟ้าหลายช่อง',
    icon: 'fas fa-toggle-off',
    category: 'Control'
  },
  lighting: {
    label: 'ระบบไฟ LED',
    description: 'หลอดไฟ LED อัจฉริยะ ปรับแสงได้',
    icon: 'fas fa-lightbulb',
    category: 'Lighting'
  },
  plug: {
    label: 'ปลั๊กอัจฉริยะ',
    description: 'ปลั๊กไฟ สามารถเปิดปิดระยะไกลได้',
    icon: 'fas fa-plug',
    category: 'Control'
  },
  security_camera: {
    label: 'กล้องรักษาความปลอดภัย',
    description: 'กล้องวงจรปิด มีการบันทึกและ Stream แบบ Real-time',
    icon: 'fas fa-video',
    category: 'Security'
  },
  door_lock: {
    label: 'ล็อคประตูดิจิตอล',
    description: 'ระบบล็อคประตูอัจฉริยะ ปลดล็อคด้วยแอป',
    icon: 'fas fa-lock',
    category: 'Security'
  },
  motion_sensor: {
    label: 'เซ็นเซอร์ตรวจจับการเคลื่อนไหว',
    description: 'เซ็นเซอร์ PIR ตรวจจับการเคลื่อนไหว',
    icon: 'fas fa-running',
    category: 'Sensor'
  },
  temperature_sensor: {
    label: 'เซ็นเซอร์อุณหภูมิ',
    description: 'วัดอุณหภูมิแบบ Real-time',
    icon: 'fas fa-thermometer-half',
    category: 'Sensor'
  },
  humidity_sensor: {
    label: 'เซ็นเซอร์ความชื้น',
    description: 'วัดความชื้นในอากาศ',
    icon: 'fas fa-tint',
    category: 'Sensor'
  },
  light_sensor: {
    label: 'เซ็นเซอร์แสง',
    description: 'วัดความเข้มแสง (Lux)',
    icon: 'fas fa-sun',
    category: 'Sensor'
  },
  sound_sensor: {
    label: 'เซ็นเซอร์เสียง',
    description: 'วัดระดับเสียง (Decibel)',
    icon: 'fas fa-volume-up',
    category: 'Sensor'
  },
  gas_sensor: {
    label: 'เซ็นเซอร์แก๊ส',
    description: 'ตรวจจับแก๊สพิษและแก๊สรั่ว',
    icon: 'fas fa-exclamation-triangle',
    category: 'Sensor'
  },
  water_sensor: {
    label: 'เซ็นเซอร์ระดับน้ำ',
    description: 'วัดระดับน้ำในถัง',
    icon: 'fas fa-water',
    category: 'Sensor'
  },
  pressure_sensor: {
    label: 'เซ็นเซอร์ความดัน',
    description: 'วัดความดันของของเหลวหรือแก๊ส',
    icon: 'fas fa-gauge',
    category: 'Sensor'
  },
  soil_moisture: {
    label: 'เซ็นเซอร์ความชื้นดิน',
    description: 'วัดความชื้นในดิน สำหรับระบบรดน้ำอัตโนมัติ',
    icon: 'fas fa-seedling',
    category: 'Agriculture'
  },
  ph_sensor: {
    label: 'เซ็นเซอร์ค่า pH',
    description: 'วัดค่าความเป็นกรด-ด่างของน้ำ',
    icon: 'fas fa-flask',
    category: 'Agriculture'
  },
  gps_tracker: {
    label: 'GPS Tracker',
    description: 'ติดตามตำแหน่งแบบ Real-time',
    icon: 'fas fa-map-marker-alt',
    category: 'Location'
  },
  servo_motor: {
    label: 'Servo Motor',
    description: 'มอเตอร์ควบคุมตำแหน่ง สำหรับเปิดปิดวาล์ว',
    icon: 'fas fa-cog',
    category: 'Control'
  },
  stepper_motor: {
    label: 'Stepper Motor',
    description: 'มอเตอร์ก้าวย่าง สำหรับการเคลื่อนที่แม่นยำ',
    icon: 'fas fa-cogs',
    category: 'Control'
  },
  buzzer: {
    label: 'Buzzer',
    description: 'อุปกรณ์ส่งเสียงเตือน',
    icon: 'fas fa-bell',
    category: 'Alert'
  },
  led_strip: {
    label: 'LED Strip',
    description: 'แถบ LED หลากสี ปรับได้',
    icon: 'fas fa-palette',
    category: 'Lighting'
  },
  fan_controller: {
    label: 'ควบคุมพัดลม',
    description: 'ควบคุมความเร็วพัดลม',
    icon: 'fas fa-fan',
    category: 'Control'
  },
  air_quality: {
    label: 'เซ็นเซอร์คุณภาพอากาศ',
    description: 'วัด PM2.5, CO2, และคุณภาพอากาศ',
    icon: 'fas fa-wind',
    category: 'Sensor'
  },
  weather_station: {
    label: 'สถานีอากาศ',
    description: 'วัดอุณหภูมิ, ความชื้น, ความดันอากาศ, ลม',
    icon: 'fas fa-cloud',
    category: 'Weather'
  },
  irrigation: {
    label: 'ระบบรดน้ำอัตโนมัติ',
    description: 'ระบบรดน้ำควบคุมด้วยเซ็นเซอร์',
    icon: 'fas fa-shower',
    category: 'Agriculture'
  },
  other: {
    label: 'อื่นๆ',
    description: 'อุปกรณ์ประเภทอื่นๆ',
    icon: 'fas fa-microchip',
    category: 'Other'
  }
};

// Categories for grouping
export const DEVICE_CATEGORIES = {
  Control: { label: 'ควบคุม', color: '#3b82f6' },
  Sensor: { label: 'เซ็นเซอร์', color: '#10b981' },
  Lighting: { label: 'แสงสว่าง', color: '#f59e0b' },
  Security: { label: 'ความปลอดภัย', color: '#ef4444' },
  Agriculture: { label: 'เกษตรกรรม', color: '#84cc16' },
  Weather: { label: 'สภาพอากาศ', color: '#06b6d4' },
  Location: { label: 'ตำแหน่ง', color: '#8b5cf6' },
  Alert: { label: 'แจ้งเตือน', color: '#f97316' },
  Other: { label: 'อื่นๆ', color: '#6b7280' }
};
