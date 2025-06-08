const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
let users = [];

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

// Create test users with diabetes-specific profiles
const createTestUsers = async () => {
  console.log('👥 Creating test users...');
  
  const testUsers = [
    {
      nombre: 'Ana Martínez',
      email: 'ana.martinez@example.com',
      password: 'password123',
      edad: 34,
      peso: 68,
      altura: 1.65,
      tipo_diabetes: 'tipo 1',
      glucosa_basal: 95,
      preferencias_alimenticias: ['sin_gluten']
    },
    {
      nombre: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@example.com',
      password: 'password123',
      edad: 45,
      peso: 82,
      altura: 1.78,
      tipo_diabetes: 'tipo 2',
      glucosa_basal: 110,
      preferencias_alimenticias: ['mediterranea']
    },
    {
      nombre: 'María González',
      email: 'maria.gonzalez@example.com',
      password: 'password123',
      edad: 28,
      peso: 58,
      altura: 1.62,
      tipo_diabetes: 'tipo 1',
      glucosa_basal: 88,
      preferencias_alimenticias: ['vegetariano']
    },
    {
      nombre: 'Luis Fernández',
      email: 'luis.fernandez@example.com',
      password: 'password123',
      edad: 52,
      peso: 75,
      altura: 1.72,
      tipo_diabetes: 'tipo 2',
      glucosa_basal: 125,
      preferencias_alimenticias: ['keto']
    }
  ];

  for (const userData of testUsers) {
    try {
      const response = await makeRequest('POST', '/auth/register', userData);
      console.log(`✅ User created: ${userData.nombre}`);
      users.push({
        ...response.data.user,
        token: response.data.token
      });
    } catch (error) {
      // Try to login if user already exists
      try {
        const loginResponse = await makeRequest('POST', '/auth/login', {
          email: userData.email,
          password: userData.password
        });
        console.log(`✅ User logged in: ${userData.nombre}`);
        users.push({
          ...loginResponse.data.user,
          token: loginResponse.data.token
        });
      } catch (loginError) {
        console.error(`❌ Failed to create/login user: ${userData.nombre}`);
      }
    }
  }
};

// Create realistic diabetes-related conversations
const createTestMessages = async () => {
  console.log('\n💬 Creating realistic diabetes conversations...');
  
  if (users.length < 4) {
    console.log('❌ Need at least 4 users for conversations');
    return;
  }

  // Conversation 1: Ana (Type 1) and Carlos (Type 2) - Experience sharing
  const conversation1 = [
    {
      from: 0, // Ana
      to: 1,   // Carlos
      content: "Hola Carlos! Vi que también tienes diabetes. ¿Cómo has estado manejando tus niveles de glucosa últimamente?"
    },
    {
      from: 1, // Carlos
      to: 0,   // Ana
      content: "¡Hola Ana! Ha sido un desafío. Tengo diabetes tipo 2 y estoy tratando de controlarla con dieta y ejercicio. ¿Tú usas insulina?"
    },
    {
      from: 0, // Ana
      to: 1,   // Carlos
      content: "Sí, tengo tipo 1 así que dependo de la insulina. He estado usando un monitor continuo de glucosa y me ha ayudado mucho a ver los patrones."
    },
    {
      from: 1, // Carlos
      to: 0,   // Ana
      content: "Eso suena muy útil. Mi médico me recomendó empezar a monitorear más frecuentemente. ¿Qué marca de monitor usas?"
    },
    {
      from: 0, // Ana
      to: 1,   // Carlos
      content: "Uso el FreeStyle Libre. Es bastante preciso y fácil de usar. También me ayuda la app para llevar registro de comidas."
    }
  ];

  // Conversation 2: María and Luis - Diet and nutrition
  const conversation2 = [
    {
      from: 2, // María
      to: 3,   // Luis
      content: "Luis, he visto que sigues una dieta keto. ¿Cómo te ha funcionado para controlar la diabetes?"
    },
    {
      from: 3, // Luis
      to: 2,   // María
      content: "¡Hola María! La dieta keto me ha ayudado mucho a estabilizar mis niveles. Mis lecturas de A1C han mejorado significativamente."
    },
    {
      from: 2, // María
      to: 3,   // Luis
      content: "Qué bueno escuchar eso. Yo soy vegetariana y a veces es difícil encontrar opciones bajas en carbohidratos. ¿Tienes algún consejo?"
    },
    {
      from: 3, // Luis
      to: 2,   // María
      content: "Para vegetarianos, recomiendo mucho aguacate, nueces, semillas de chía y tofu. También las verduras de hoja verde son excelentes."
    },
    {
      from: 2, // María
      to: 3,   // Luis
      content: "Gracias por los consejos! ¿Has notado algún alimento que te dispare mucho la glucosa?"
    },
    {
      from: 3, // Luis
      to: 2,   // María
      content: "Definitivamente el arroz y el pan blanco. Ahora uso coliflor como sustituto del arroz y pan de almendra."
    }
  ];

  // Conversation 3: Ana and María - Type 1 experiences
  const conversation3 = [
    {
      from: 0, // Ana
      to: 2,   // María
      content: "María! Vi que también tienes diabetes tipo 1. ¿Cómo manejas las hipoglucemias nocturnas?"
    },
    {
      from: 2, // María
      to: 0,   // Ana
      content: "¡Hola Ana! Es uno de mis mayores desafíos. He empezado a poner una alarma para revisar a las 3 AM. ¿Tú qué haces?"
    },
    {
      from: 0, // Ana
      to: 2,   // María
      content: "Yo ajusté mi insulina basal con mi endocrinólogo. También siempre tengo glucosa en gel en mi mesa de noche."
    },
    {
      from: 2, // María
      to: 0,   // Ana
      content: "Buena idea lo de la glucosa en gel. ¿Has considerado una bomba de insulina? Mi doctor me la mencionó."
    },
    {
      from: 0, // Ana
      to: 2,   // María
      content: "Sí, la estoy considerando. El control sería más preciso, pero aún estoy investigando las opciones disponibles."
    }
  ];

  // Conversation 4: Carlos and Luis - Type 2 management
  const conversation4 = [
    {
      from: 1, // Carlos
      to: 3,   // Luis
      content: "Luis, ¿qué ejercicios te han funcionado mejor para controlar la glucosa?"
    },
    {
      from: 3, // Luis
      to: 1,   // Carlos
      content: "Hola Carlos! Caminar después de las comidas me ha ayudado muchísimo. También hago pesas 3 veces por semana."
    },
    {
      from: 1, // Carlos
      to: 3,   // Luis
      content: "Interesante. Yo he estado haciendo cardio pero no había pensado en las pesas. ¿Notas diferencia inmediata en tus niveles?"
    },
    {
      from: 3, // Luis
      to: 1,   // Carlos
      content: "Sí, especialmente con las caminatas post-comida. Mis niveles bajan 20-30 puntos en una hora de caminata."
    }
  ];

  // Send all messages
  const allConversations = [...conversation1, ...conversation2, ...conversation3, ...conversation4];
  
  for (const msg of allConversations) {
    try {
      const response = await makeRequest('POST', '/messages', {
        to_user_id: users[msg.to]._id,
        content: msg.content
      }, users[msg.from].token);
      
      console.log(`✅ Message sent: ${users[msg.from].nombre} → ${users[msg.to].nombre}`);
      console.log(`   "${msg.content.substring(0, 50)}..."`);
      
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`❌ Failed to send message from ${users[msg.from].nombre} to ${users[msg.to].nombre}`);
    }
  }
};

// Main function
const createTestData = async () => {
  console.log('🧪 Creating Test Conversation Data for Diabetes API');
  console.log('==================================================');
  
  try {
    await createTestUsers();
    await createTestMessages();
    
    console.log('\n🎉 Test conversation data created successfully!');
    console.log('\n👥 Created users:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.nombre} (${user.email}) - ${user.tipo_diabetes}`);
    });
    
    console.log('\n📱 You can now test GET requests to retrieve conversations!');
    
  } catch (error) {
    console.error('❌ Failed to create test data:', error.message);
  }
};

// Run if executed directly
if (require.main === module) {
  createTestData();
}

module.exports = { createTestData, users };
