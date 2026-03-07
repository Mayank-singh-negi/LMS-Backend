import axios from 'axios';

async function testOllamaAPI() {
  try {
    console.log('Testing Ollama API directly...\n');
    
    const response = await axios.post('http://localhost:11434/api/chat', {
      model: 'llama2',
      messages: [
        {
          role: 'user',
          content: 'What is 2+2?'
        }
      ],
      stream: false
    });

    console.log('✅ Ollama API Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error calling Ollama API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testOllamaAPI();
