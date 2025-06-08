const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';

// Helper function to make requests
const makeRequest = async (method, url, data = null, token = null) => {
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

// Get user tokens for testing
const getUserTokens = async () => {
  const users = [
    { email: 'ana.martinez@example.com', password: 'password123' },
    { email: 'carlos.rodriguez@example.com', password: 'password123' },
    { email: 'maria.gonzalez@example.com', password: 'password123' },
    { email: 'luis.fernandez@example.com', password: 'password123' }
  ];

  const tokens = [];
  for (const user of users) {
    try {
      const response = await makeRequest('POST', '/auth/login', user);
      tokens.push({
        user: response.data.user,
        token: response.data.token
      });
    } catch (error) {
      console.error(`Failed to login ${user.email}`);
    }
  }
  return tokens;
};

// Test GET requests and show responses
const testGetRequests = async () => {
  console.log('📱 Testing GET Requests for Messages API');
  console.log('=========================================\n');

  const userTokens = await getUserTokens();
  if (userTokens.length < 2) {
    console.log('❌ Need at least 2 users for testing');
    return;
  }

  const ana = userTokens[0]; // Ana Martínez
  const carlos = userTokens[1]; // Carlos Rodríguez

  console.log('👥 Test Users:');
  console.log(`   Ana: ${ana.user._id} (${ana.user.nombre})`);
  console.log(`   Carlos: ${carlos.user._id} (${carlos.user.nombre})`);
  console.log('\n' + '='.repeat(60) + '\n');

  // 1. Get all messages for a user
  console.log('1️⃣ GET ALL MESSAGES FOR USER');
  console.log('URL: GET /api/messages');
  console.log('Headers: Authorization: Bearer <token>');
  try {
    const allMessages = await makeRequest('GET', '/messages', null, ana.token);
    console.log('\n📄 RESPONSE STRUCTURE:');
    console.log(JSON.stringify({
      success: allMessages.success,
      data: {
        messages: allMessages.data.messages.slice(0, 2).map(msg => ({
          _id: msg._id,
          from_user_id: {
            _id: msg.from_user_id._id,
            nombre: msg.from_user_id.nombre,
            email: msg.from_user_id.email
          },
          to_user_id: {
            _id: msg.to_user_id._id,
            nombre: msg.to_user_id.nombre,
            email: msg.to_user_id.email
          },
          content: msg.content,
          sent_at: msg.sent_at,
          read_at: msg.read_at,
          is_deleted: msg.is_deleted,
          is_read: msg.is_read,
          time_since_sent: msg.time_since_sent,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt
        })),
        pagination: allMessages.data.pagination
      }
    }, null, 2));
    console.log(`\n✅ Retrieved ${allMessages.data.messages.length} total messages`);
  } catch (error) {
    console.log('❌ Failed to get all messages');
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // 2. Get conversation between two specific users
  console.log('2️⃣ GET CONVERSATION BETWEEN TWO USERS');
  console.log(`URL: GET /api/messages/conversation/${carlos.user._id}`);
  console.log('Headers: Authorization: Bearer <ana_token>');
  try {
    const conversation = await makeRequest('GET', `/messages/conversation/${carlos.user._id}`, null, ana.token);
    console.log('\n📄 RESPONSE STRUCTURE:');
    console.log(JSON.stringify({
      success: conversation.success,
      data: {
        messages: conversation.data.messages.map(msg => ({
          _id: msg._id,
          from_user_id: {
            _id: msg.from_user_id._id,
            nombre: msg.from_user_id.nombre,
            email: msg.from_user_id.email
          },
          to_user_id: {
            _id: msg.to_user_id._id,
            nombre: msg.to_user_id.nombre,
            email: msg.to_user_id.email
          },
          content: msg.content,
          sent_at: msg.sent_at,
          read_at: msg.read_at,
          is_deleted: msg.is_deleted,
          is_read: msg.is_read,
          time_since_sent: msg.time_since_sent
        })),
        other_user: conversation.data.other_user,
        pagination: conversation.data.pagination
      }
    }, null, 2));
    console.log(`\n✅ Retrieved conversation with ${conversation.data.messages.length} messages`);
  } catch (error) {
    console.log('❌ Failed to get conversation');
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // 3. Get unread messages only
  console.log('3️⃣ GET UNREAD MESSAGES ONLY');
  console.log('URL: GET /api/messages?unread_only=true');
  console.log('Headers: Authorization: Bearer <token>');
  try {
    const unreadMessages = await makeRequest('GET', '/messages?unread_only=true', null, carlos.token);
    console.log('\n📄 RESPONSE STRUCTURE:');
    console.log(JSON.stringify({
      success: unreadMessages.success,
      data: {
        messages: unreadMessages.data.messages.slice(0, 2).map(msg => ({
          _id: msg._id,
          from_user_id: {
            _id: msg.from_user_id._id,
            nombre: msg.from_user_id.nombre,
            email: msg.from_user_id.email
          },
          to_user_id: {
            _id: msg.to_user_id._id,
            nombre: msg.to_user_id.nombre,
            email: msg.to_user_id.email
          },
          content: msg.content,
          sent_at: msg.sent_at,
          read_at: msg.read_at,
          is_deleted: msg.is_deleted,
          is_read: msg.is_read,
          time_since_sent: msg.time_since_sent
        })),
        pagination: unreadMessages.data.pagination
      }
    }, null, 2));
    console.log(`\n✅ Retrieved ${unreadMessages.data.messages.length} unread messages`);
  } catch (error) {
    console.log('❌ Failed to get unread messages');
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // 4. Get unread count
  console.log('4️⃣ GET UNREAD COUNT');
  console.log('URL: GET /api/messages/unread-count');
  console.log('Headers: Authorization: Bearer <token>');
  try {
    const unreadCount = await makeRequest('GET', '/messages/unread-count', null, carlos.token);
    console.log('\n📄 RESPONSE STRUCTURE:');
    console.log(JSON.stringify(unreadCount, null, 2));
  } catch (error) {
    console.log('❌ Failed to get unread count');
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // 5. Get sent messages only
  console.log('5️⃣ GET SENT MESSAGES ONLY');
  console.log('URL: GET /api/messages?sent_only=true');
  console.log('Headers: Authorization: Bearer <token>');
  try {
    const sentMessages = await makeRequest('GET', '/messages?sent_only=true', null, ana.token);
    console.log('\n📄 RESPONSE STRUCTURE:');
    console.log(JSON.stringify({
      success: sentMessages.success,
      data: {
        messages: sentMessages.data.messages.slice(0, 1).map(msg => ({
          _id: msg._id,
          from_user_id: {
            _id: msg.from_user_id._id,
            nombre: msg.from_user_id.nombre,
            email: msg.from_user_id.email
          },
          to_user_id: {
            _id: msg.to_user_id._id,
            nombre: msg.to_user_id.nombre,
            email: msg.to_user_id.email
          },
          content: msg.content,
          sent_at: msg.sent_at,
          read_at: msg.read_at,
          is_deleted: msg.is_deleted,
          is_read: msg.is_read,
          time_since_sent: msg.time_since_sent
        })),
        pagination: sentMessages.data.pagination
      }
    }, null, 2));
    console.log(`\n✅ Retrieved ${sentMessages.data.messages.length} sent messages`);
  } catch (error) {
    console.log('❌ Failed to get sent messages');
  }

  console.log('\n🎉 All GET request examples completed!');
};

// Run if executed directly
if (require.main === module) {
  testGetRequests();
}

module.exports = { testGetRequests };
