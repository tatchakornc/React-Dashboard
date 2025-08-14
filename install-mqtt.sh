#!/bin/bash

# =================================================================
# MQTT IoT Dashboard Installation Script
# =================================================================

echo "🚀 เริ่มต้นการติดตั้ง MQTT IoT Dashboard..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker ไม่ได้ติดตั้ง กรุณาติดตั้ง Docker ก่อน"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose ไม่ได้ติดตั้ง กรุณาติดตั้ง Docker Compose ก่อน"
    exit 1
fi

echo "✅ ตรวจสอบ Docker สำเร็จ"

# Create necessary directories
echo "📁 สร้าง directories ที่จำเป็น..."
mkdir -p mqtt-data
mkdir -p mqtt-logs

# Set permissions
chmod 755 mqtt-data
chmod 755 mqtt-logs

echo "✅ สร้าง directories สำเร็จ"

# Start MQTT Broker
echo "🐳 เริ่มต้น MQTT Broker..."
docker-compose -f docker-compose-mqtt.yml up -d

# Wait for services to start
echo "⏳ รอให้ services เริ่มต้น..."
sleep 10

# Check if MQTT broker is running
if docker ps | grep -q "mqtt-broker"; then
    echo "✅ MQTT Broker เริ่มต้นสำเร็จ"
    echo "📡 MQTT Broker พร้อมใช้งานที่:"
    echo "   - MQTT Port: 1883"
    echo "   - WebSocket Port: 9001"
    echo "   - Management Dashboard: http://localhost:8088"
else
    echo "❌ MQTT Broker เริ่มต้นไม่สำเร็จ"
    exit 1
fi

# Install React dependencies
echo "📦 ติดตั้ง React dependencies..."
npm install

echo "✅ ติดตั้ง dependencies สำเร็จ"

# Display connection information
echo ""
echo "🎉 ติดตั้ง MQTT IoT Dashboard สำเร็จ!"
echo ""
echo "📋 ข้อมูลการเชื่อมต่อ:"
echo "=================================="
echo "🏠 React App: http://localhost:3000"
echo "📡 MQTT Broker:"
echo "   - Host: localhost"
echo "   - MQTT Port: 1883 (สำหรับ ESP32)"
echo "   - WebSocket Port: 9001 (สำหรับ Browser)"
echo "📊 MQTT Management: http://localhost:8088"
echo ""
echo "🔧 การตั้งค่าใน React App:"
echo "   - Host: localhost"
echo "   - Port: 9001"
echo "   - Protocol: ws"
echo ""
echo "📱 การเชื่อมต่อ ESP32:"
echo "   - MQTT Server: <YOUR_IP_ADDRESS>"
echo "   - Port: 1883"
echo "   - No authentication required"
echo ""
echo "🚀 เริ่มต้นใช้งาน:"
echo "   npm start"
echo ""
echo "📚 ตัวอย่าง ESP32 Code อยู่ในโฟลเดอร์: esp32-mqtt/"
echo ""

# Start React development server
read -p "🔄 ต้องการเริ่ม React development server เลยไหม? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 เริ่มต้น React development server..."
    npm start
fi
