import mqtt from 'mqtt';

class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.subscriptions = new Map();
    this.messageHandlers = new Map();
  }

  connect(brokerUrl, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        // Default options
        const defaultOptions = {
          keepalive: 60,
          connectTimeout: 30000,
          reconnectPeriod: 1000,
          clean: true,
          rejectUnauthorized: false
        };

        const connectionOptions = { ...defaultOptions, ...options };
        
        console.log('🔗 กำลังเชื่อมต่อ MQTT Broker:', brokerUrl);
        
        this.client = mqtt.connect(brokerUrl, connectionOptions);

        this.client.on('connect', () => {
          console.log('✅ เชื่อมต่อ MQTT Broker สำเร็จ');
          this.isConnected = true;
          resolve(true);
        });

        this.client.on('error', (error) => {
          console.error('❌ MQTT Connection Error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.client.on('disconnect', () => {
          console.log('🔌 ตัดการเชื่อมต่อ MQTT Broker');
          this.isConnected = false;
        });

        this.client.on('message', (topic, message) => {
          try {
            const messageStr = message.toString();
            console.log('📩 รับข้อความ MQTT:', topic, messageStr);
            
            // หา handler ที่ตรงกับ topic
            for (const [pattern, handler] of this.messageHandlers) {
              if (this.topicMatches(pattern, topic)) {
                handler(topic, messageStr);
              }
            }
          } catch (error) {
            console.error('❌ Error processing MQTT message:', error);
          }
        });

      } catch (error) {
        console.error('❌ Error creating MQTT connection:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      this.subscriptions.clear();
      this.messageHandlers.clear();
      console.log('🔌 ตัดการเชื่อมต่อ MQTT Broker');
    }
  }

  subscribe(topic, handler) {
    if (!this.isConnected) {
      console.warn('⚠️ ยังไม่ได้เชื่อมต่อ MQTT Broker');
      return false;
    }

    return new Promise((resolve, reject) => {
      this.client.subscribe(topic, (error) => {
        if (error) {
          console.error('❌ Error subscribing to topic:', topic, error);
          reject(error);
        } else {
          console.log('📡 Subscribe topic สำเร็จ:', topic);
          this.subscriptions.set(topic, true);
          if (handler) {
            this.messageHandlers.set(topic, handler);
          }
          resolve(true);
        }
      });
    });
  }

  unsubscribe(topic) {
    if (!this.isConnected) return false;

    return new Promise((resolve, reject) => {
      this.client.unsubscribe(topic, (error) => {
        if (error) {
          console.error('❌ Error unsubscribing from topic:', topic, error);
          reject(error);
        } else {
          console.log('📡 Unsubscribe topic สำเร็จ:', topic);
          this.subscriptions.delete(topic);
          this.messageHandlers.delete(topic);
          resolve(true);
        }
      });
    });
  }

  publish(topic, message, options = {}) {
    if (!this.isConnected) {
      console.warn('⚠️ ยังไม่ได้เชื่อมต่อ MQTT Broker');
      return false;
    }

    const defaultOptions = {
      qos: 0,
      retain: false
    };

    const publishOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      const messageStr = typeof message === 'object' ? JSON.stringify(message) : message.toString();
      
      this.client.publish(topic, messageStr, publishOptions, (error) => {
        if (error) {
          console.error('❌ Error publishing message:', topic, error);
          reject(error);
        } else {
          console.log('📤 ส่งข้อความ MQTT สำเร็จ:', topic, messageStr);
          resolve(true);
        }
      });
    });
  }

  // Helper function to match topics with wildcards
  topicMatches(pattern, topic) {
    // Convert MQTT wildcards to regex
    const regexPattern = pattern
      .replace(/\+/g, '[^/]+')  // + matches single level
      .replace(/#/g, '.*');     // # matches multiple levels
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(topic);
  }

  // Utility methods for ESP32 communication
  controlDevice(deviceId, command, value) {
    const topic = `devices/${deviceId}/command`;
    const message = {
      command,
      value,
      timestamp: Date.now()
    };
    return this.publish(topic, message);
  }

  subscribeToDevice(deviceId, handler) {
    const statusTopic = `devices/${deviceId}/status`;
    const dataTopic = `devices/${deviceId}/data`;
    
    this.subscribe(statusTopic, handler);
    this.subscribe(dataTopic, handler);
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  getSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }
}

// Create singleton instance
const mqttService = new MQTTService();

export default mqttService;