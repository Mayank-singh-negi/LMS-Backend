import axios from 'axios';

(async () => {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'student_1700000000000@prod.local',
      password: 'TestProd@2024'
    });
    const token = loginRes.data.accessToken;
    console.log('token', token);
    const res = await axios.post('http://localhost:5000/api/v1/ai/ask-doubt', {
      courseId: 'somecourse',
      lessonId: 'somelesson',
      question: 'test',
      lessonContent: 'This is a long enough lesson content that is more than fifty characters to pass validation.',
      courseTitle: 'Test'
    }, { headers: { Authorization: `Bearer ${token}` }, timeout: 60000 });
    console.log('AI response', res.data);
  } catch (err) {
    console.error('error', err.response?.status, err.response?.data, err.message);
  }
})();