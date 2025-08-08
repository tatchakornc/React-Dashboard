// Device Types Configuration
export const DEVICE_TYPES = {
  // สวิตช์และไฟ
  switch: {
    label: 'สวิตช์เปิด-ปิด',
    icon: 'fas fa-lightbulb',
    color: '#f59e0b',
    dataType: 'boolean',
    unit: '',
    dashboard: 'switch'
  },
  
  // เซ็นเซอร์อุณหภูมิ
  temperature: {
    label: 'เซ็นเซอร์อุณหภูมิ',
    icon: 'fas fa-thermometer-half',
    color: '#ef4444',
    dataType: 'number',
    unit: '°C',
    dashboard: 'gauge',
    min: -10,
    max: 50
  },
  
  // เซ็นเซอร์ความชื้น
  humidity: {
    label: 'เซ็นเซอร์ความชื้น',
    icon: 'fas fa-tint',
    color: '#06b6d4',
    dataType: 'number',
    unit: '%',
    dashboard: 'gauge',
    min: 0,
    max: 100
  },
  
  // ระบบล็อค
  lock: {
    label: 'ระบบล็อคประตู',
    icon: 'fas fa-lock',
    color: '#22c55e',
    dataType: 'boolean',
    unit: '',
    dashboard: 'lock'
  },
  
  // วัดความเร็วรถยนต์
  speedometer: {
    label: 'วัดความเร็วรถยนต์',
    icon: 'fas fa-tachometer-alt',
    color: '#8b5cf6',
    dataType: 'number',
    unit: 'km/h',
    dashboard: 'speedometer',
    min: 0,
    max: 200
  },
  
  // เซ็นเซอร์แสง
  light: {
    label: 'เซ็นเซอร์แสง',
    icon: 'fas fa-sun',
    color: '#fbbf24',
    dataType: 'number',
    unit: 'lux',
    dashboard: 'gauge',
    min: 0,
    max: 10000
  },
  
  // เซ็นเซอร์เสียง
  sound: {
    label: 'เซ็นเซอร์เสียง',
    icon: 'fas fa-volume-up',
    color: '#f97316',
    dataType: 'number',
    unit: 'dB',
    dashboard: 'gauge',
    min: 0,
    max: 120
  },
  
  // เซ็นเซอร์การเคลื่อนไหว
  motion: {
    label: 'เซ็นเซอร์ตรวจจับการเคลื่อนไหว',
    icon: 'fas fa-running',
    color: '#ef4444',
    dataType: 'boolean',
    unit: '',
    dashboard: 'motion'
  },
  
  // แรงดันไฟฟ้า
  voltage: {
    label: 'แรงดันไฟฟ้า',
    icon: 'fas fa-bolt',
    color: '#eab308',
    dataType: 'number',
    unit: 'V',
    dashboard: 'gauge',
    min: 0,
    max: 250
  },
  
  // กระแสไฟฟ้า
  current: {
    label: 'กระแสไฟฟ้า',
    icon: 'fas fa-plug',
    color: '#dc2626',
    dataType: 'number',
    unit: 'A',
    dashboard: 'gauge',
    min: 0,
    max: 50
  },
  
  // ความดันน้ำ
  pressure: {
    label: 'ความดันน้ำ',
    icon: 'fas fa-tint',
    color: '#0891b2',
    dataType: 'number',
    unit: 'bar',
    dashboard: 'gauge',
    min: 0,
    max: 10
  },
  
  // ระดับน้ำ
  water_level: {
    label: 'ระดับน้ำ',
    icon: 'fas fa-water',
    color: '#0284c7',
    dataType: 'number',
    unit: '%',
    dashboard: 'tank',
    min: 0,
    max: 100
  },
  
  // ตรวจจับแก๊ส
  gas: {
    label: 'ตรวจจับแก๊ส',
    icon: 'fas fa-exclamation-triangle',
    color: '#dc2626',
    dataType: 'number',
    unit: 'ppm',
    dashboard: 'gauge',
    min: 0,
    max: 1000
  },
  
  // pH น้ำ
  ph: {
    label: 'ค่า pH น้ำ',
    icon: 'fas fa-flask',
    color: '#7c3aed',
    dataType: 'number',
    unit: 'pH',
    dashboard: 'gauge',
    min: 0,
    max: 14
  },
  
  // ความเร็วลม
  wind_speed: {
    label: 'ความเร็วลม',
    icon: 'fas fa-wind',
    color: '#059669',
    dataType: 'number',
    unit: 'm/s',
    dashboard: 'gauge',
    min: 0,
    max: 50
  },
  
  // GPS พิกัด
  gps: {
    label: 'ตำแหน่ง GPS',
    icon: 'fas fa-map-marker-alt',
    color: '#dc2626',
    dataType: 'object',
    unit: '',
    dashboard: 'map'
  },
  
  // กล้องวงจรปิด
  camera: {
    label: 'กล้องวงจรปิด',
    icon: 'fas fa-video',
    color: '#374151',
    dataType: 'string',
    unit: '',
    dashboard: 'camera'
  },
  
  // ปริมาณฝน
  rain: {
    label: 'ปริมาณฝน',
    icon: 'fas fa-cloud-rain',
    color: '#0ea5e9',
    dataType: 'number',
    unit: 'mm',
    dashboard: 'gauge',
    min: 0,
    max: 100
  },
  
  // ความเร็วรอบ (RPM)
  rpm: {
    label: 'ความเร็วรอบ (RPM)',
    icon: 'fas fa-cog',
    color: '#6366f1',
    dataType: 'number',
    unit: 'RPM',
    dashboard: 'speedometer',
    min: 0,
    max: 10000
  },
  
  // นับจำนวน
  counter: {
    label: 'ตัวนับจำนวน',
    icon: 'fas fa-calculator',
    color: '#059669',
    dataType: 'number',
    unit: 'ครั้ง',
    dashboard: 'counter',
    min: 0,
    max: 999999
  }
};

export const DASHBOARD_COMPONENTS = {
  switch: 'SwitchDashboard',
  gauge: 'GaugeDashboard', 
  lock: 'LockDashboard',
  speedometer: 'SpeedometerDashboard',
  motion: 'MotionDashboard',
  tank: 'TankDashboard',
  map: 'MapDashboard',
  camera: 'CameraDashboard',
  counter: 'CounterDashboard'
};

// Auto-assign dashboard type based on device type
export const getDefaultDashboardType = (deviceType) => {
  const typeConfig = DEVICE_TYPES[deviceType];
  if (typeConfig && typeConfig.dashboard) {
    return typeConfig.dashboard;
  }
  
  // Fallback mappings for common types
  const fallbackMappings = {
    'switch': 'switch',
    'relay4': 'switch',
    'sensor': 'gauge',
    'temperature': 'gauge',
    'humidity': 'gauge',
    'pressure': 'gauge',
    'light': 'speedometer',
    'sound': 'gauge',
    'motion': 'motion',
    'door': 'lock',
    'security': 'lock',
    'smoke': 'motion',
    'gas': 'gauge',
    'water': 'tank',
    'level': 'tank',
    'motor': 'speedometer',
    'fan': 'speedometer',
    'pump': 'switch',
    'valve': 'switch',
    'camera': 'camera',
    'gps': 'map',
    'counter': 'counter',
    'other': 'gauge'
  };
  
  return fallbackMappings[deviceType] || 'gauge';
};
