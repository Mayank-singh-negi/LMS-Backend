import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1';

async function testOllamaIntegration() {
  console.log('========================================');
  console.log('Testing Ollama AI Integration');
  console.log('========================================\n');

  let token = null;

  try {
    // Step 1: Register a test user
    console.log('1. Registering test user...');
    const testEmail = `test_${Date.now()}@example.com`;
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test User',
      email: testEmail,
      password: 'Test@1234',
      role: 'student'
    });
    console.log('✅ User registered successfully');
    console.log(`Email: ${testEmail}\n`);

    // Step 2: Login to get auth token
    console.log('2. Logging in to get auth token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: 'Test@1234'
    });
    token = loginResponse.data.accessToken;
    console.log('✅ User logged in successfully');
    console.log(`Token received: ${token.substring(0, 20)}...\n`);

    // Step 3: Test Doubt Solver
    console.log('3. Testing Doubt Solver with Ollama...');
    const doubtResponse = await axios.post(
      `${BASE_URL}/ai/ask-doubt`,
      {
        question: 'What is photosynthesis and explain its importance?',
        lessonContent: 'Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy. It occurs in two stages: light-dependent reactions in the thylakoid membranes and light-independent reactions in the stroma. The process produces glucose and oxygen.',
        courseTitle: 'Biology 101',
        courseId: '507f1f77bcf86cd799439011',
        lessonId: '507f1f77bcf86cd799439012'
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    console.log('✅ Doubt Solver Response:');
    console.log(JSON.stringify(doubtResponse.data, null, 2));
    console.log('\n');

    // Step 4: Test Quiz Generator
    console.log('4. Testing Quiz Generator with Ollama...');
    const quizResponse = await axios.post(
      `${BASE_URL}/ai/generate-quiz`,
      {
        lessonContent: 'The Industrial Revolution was a period of human history marked by the transition from agrarian and handicraft economies to industrial and machine-based manufacturing. It began in Britain in the late 18th century and spread to Europe and North America. Key innovations included the steam engine, mechanized textile production, and iron manufacturing. The period led to urbanization, social changes, and the rise of the working class. It fundamentally transformed society and the global economy.',
        courseId: '507f1f77bcf86cd799439011',
        lessonId: '507f1f77bcf86cd799439012'
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    console.log('✅ Quiz Generator Response:');
    console.log(JSON.stringify(quizResponse.data, null, 2));
    console.log('\n');

    console.log('========================================');
    console.log('✅ All tests passed successfully!');
    console.log('========================================');
    console.log('\nOllama AI Integration is working correctly!');
    console.log('- Doubt Solver: Successfully generated answer using Ollama');
    console.log('- Quiz Generator: Successfully generated quiz questions using Ollama');

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testOllamaIntegration();
