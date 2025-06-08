const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let testUsers = [];
let testMessages = [];

// Test data
const testUserData = [
  {
    nombre: 'Usuario Test 1',
    email: 'test1@example.com',
    password: 'password123',
    edad: 30,
    peso: 70,
    altura: 1.75,
    tipo_diabetes: 'tipo 2'
  },
  {
    nombre: 'Usuario Test 2',
    email: 'test2@example.com',
    password: 'password123',
    edad: 25,
    peso: 65,
    altura: 1.68,
    tipo_diabetes: 'tipo 1'
  }
];

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null, token = authToken) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Error in ${method} ${url}:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testRegisterUsers = async () => {
  console.log('\n🔐 Testing user registration...');
  
  for (const userData of testUserData) {
    try {
      const response = await makeRequest('POST', '/auth/register', userData);
      console.log(`✅ User registered: ${userData.email}`);
      testUsers.push({
        ...response.data.user,
        token: response.data.token
      });
    } catch (error) {
      console.log(`⚠️ User might already exist: ${userData.email}`);
      // Try to login instead
      try {
        const loginResponse = await makeRequest('POST', '/auth/login', {
          email: userData.email,
          password: userData.password
        });
        console.log(`✅ User logged in: ${userData.email}`);
        testUsers.push({
          ...loginResponse.data.user,
          token: loginResponse.data.token
        });
      } catch (loginError) {
        console.error(`❌ Failed to login user: ${userData.email}`);
      }
    }
  }
  
  if (testUsers.length >= 2) {
    authToken = testUsers[0].token;
    console.log(`✅ Using token for user: ${testUsers[0].email}`);
  }
};

const testCreateMessage = async () => {
  console.log('\n📝 Testing message creation...');
  
  if (testUsers.length < 2) {
    console.log('❌ Need at least 2 users for messaging tests');
    return;
  }
  
  const messageData = {
    to_user_id: testUsers[1]._id,
    content: 'Hola! Este es un mensaje de prueba para la API de diabetes.'
  };
  
  try {
    const response = await makeRequest('POST', '/messages', messageData, testUsers[0].token);
    console.log('✅ Message created successfully');
    console.log(`   From: ${response.data.message.from_user_id.nombre}`);
    console.log(`   To: ${response.data.message.to_user_id.nombre}`);
    console.log(`   Content: ${response.data.message.content}`);
    testMessages.push(response.data.message);
  } catch (error) {
    console.log('❌ Failed to create message');
  }
};

const testGetMessages = async () => {
  console.log('\n📬 Testing get messages...');
  
  try {
    const response = await makeRequest('GET', '/messages', null, testUsers[0].token);
    console.log(`✅ Retrieved ${response.data.messages.length} messages`);
    console.log(`   Total messages: ${response.data.pagination.total_messages}`);
  } catch (error) {
    console.log('❌ Failed to get messages');
  }
};

const testGetUnreadCount = async () => {
  console.log('\n🔔 Testing unread count...');
  
  try {
    const response = await makeRequest('GET', '/messages/unread-count', null, testUsers[1].token);
    console.log(`✅ Unread messages count: ${response.data.unread_count}`);
  } catch (error) {
    console.log('❌ Failed to get unread count');
  }
};

const testGetConversation = async () => {
  console.log('\n💬 Testing conversation...');
  
  if (testUsers.length < 2) return;
  
  try {
    const response = await makeRequest('GET', `/messages/conversation/${testUsers[1]._id}`, null, testUsers[0].token);
    console.log(`✅ Retrieved conversation with ${response.data.other_user.nombre}`);
    console.log(`   Messages in conversation: ${response.data.messages.length}`);
  } catch (error) {
    console.log('❌ Failed to get conversation');
  }
};

const testMarkAsRead = async () => {
  console.log('\n✅ Testing mark as read...');
  
  if (testMessages.length === 0) return;
  
  try {
    const response = await makeRequest('PUT', '/messages/mark-read', {
      message_ids: [testMessages[0]._id]
    }, testUsers[1].token);
    console.log(`✅ Marked ${response.data.modified_count} message(s) as read`);
  } catch (error) {
    console.log('❌ Failed to mark messages as read');
  }
};

const testUpdateMessage = async () => {
  console.log('\n✏️ Testing message update...');
  
  if (testMessages.length === 0) return;
  
  try {
    const response = await makeRequest('PUT', `/messages/${testMessages[0]._id}`, {
      content: 'Mensaje actualizado - contenido modificado para pruebas'
    }, testUsers[0].token);
    console.log('✅ Message updated successfully');
    console.log(`   New content: ${response.data.message.content}`);
  } catch (error) {
    console.log('❌ Failed to update message (might be already read)');
  }
};

const testDeleteMessage = async () => {
  console.log('\n🗑️ Testing message deletion...');
  
  if (testMessages.length === 0) return;
  
  try {
    await makeRequest('DELETE', `/messages/${testMessages[0]._id}`, null, testUsers[0].token);
    console.log('✅ Message deleted successfully');
  } catch (error) {
    console.log('❌ Failed to delete message');
  }
};

// Main test function
const runTests = async () => {
  console.log('🧪 Starting Messages API Tests...');
  console.log('=====================================');
  
  try {
    await testRegisterUsers();
    await testCreateMessage();
    await testGetMessages();
    await testGetUnreadCount();
    await testGetConversation();
    await testMarkAsRead();
    await testUpdateMessage();
    await testDeleteMessage();
    
    console.log('\n🎉 All tests completed!');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
