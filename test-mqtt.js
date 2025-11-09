const mqtt = require('mqtt');

// Your MQTT configuration from config
const config = {
  broker: 'e2a792bf.ala.eu-central-1.emqxsl.com',
  username: 'esp32_1',
  password: '321654987',
  clientId: 'test_client_' + Math.random().toString(16).substr(2, 8)
};

// Test different connection methods
const testConfigs = [
  { protocol: 'ws', port: 8083, name: 'WebSocket Primary' },
  { protocol: 'wss', port: 8084, name: 'WebSocket SSL' },
  { protocol: 'mqtt', port: 1883, name: 'MQTT TCP' },
  { protocol: 'mqtts', port: 8883, name: 'MQTT SSL' }
];

async function testMQTTConnection() {
  console.log('🔍 Testing MQTT connections to:', config.broker);
  console.log('👤 Username:', config.username);
  
  for (let i = 0; i < testConfigs.length; i++) {
    const testConfig = testConfigs[i];
    console.log(`\n🧪 Test ${i + 1}: ${testConfig.name}`);
    
    try {
      await new Promise((resolve, reject) => {
        let brokerUrl;
        
        if (testConfig.protocol === 'ws' || testConfig.protocol === 'wss') {
          brokerUrl = `${testConfig.protocol}://${config.broker}:${testConfig.port}/mqtt`;
        } else {
          brokerUrl = `${testConfig.protocol}://${config.broker}:${testConfig.port}`;
        }
        
        console.log(`🌐 Connecting to: ${brokerUrl}`);
        
        const client = mqtt.connect(brokerUrl, {
          username: config.username,
          password: config.password,
          clientId: config.clientId + '_' + i,
          connectTimeout: 10000,
          keepalive: 60,
          clean: true,
          rejectUnauthorized: false
        });

        const timeout = setTimeout(() => {
          console.log('⏰ Connection timeout');
          client.end(true);
          resolve('timeout');
        }, 12000);

        client.on('connect', () => {
          clearTimeout(timeout);
          console.log('✅ SUCCESS! Connected successfully');
          
          // Test publish/subscribe
          client.subscribe('test/topic');
          client.publish('test/topic', 'Hello from Node.js test!');
          
          setTimeout(() => {
            client.end();
            resolve('success');
          }, 2000);
        });

        client.on('message', (topic, message) => {
          console.log(`📨 Received: ${topic} = ${message.toString()}`);
        });

        client.on('error', (error) => {
          clearTimeout(timeout);
          console.log(`❌ Connection failed: ${error.message}`);
          client.end(true);
          resolve('error');
        });
      });
    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🏁 MQTT Connection Tests Complete');
}

testMQTTConnection().catch(console.error);