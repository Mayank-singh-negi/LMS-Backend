import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1';
const results = [];

function log(status, endpoint, result) {
  console.log(`${status} ${endpoint}: ${result}`);
  results.push({ endpoint, status: status.includes('✅') ? 'PASS' : 'FAIL', result });
}

async function test() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   API ENDPOINT VALIDATION TEST         ║');
  console.log('╚════════════════════════════════════════╝\n');

  let studentToken, teacherToken, adminToken, courseId;
  const studentEmail = `test_student_${Date.now()}@test.com`;
  const teacherEmail = `test_teacher_${Date.now()}@test.com`;
  const adminEmail = `test_admin_${Date.now()}@test.com`;

  try {
    // Setup: Create users
    console.log('📋 SETTING UP TEST USERS...\n');
    
    await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Student', email: studentEmail, password: 'Test@123', role: 'student'
    });
    
    await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Teacher', email: teacherEmail, password: 'Test@123', role: 'teacher'
    });
    
    await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Admin', email: adminEmail, password: 'Test@123', role: 'admin'
    });

    // TEST 1: POST /api/auth/login → working?
    console.log('🔐 TEST 1: POST /api/auth/login\n');
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        email: studentEmail,
        password: 'Test@123'
      });
      studentToken = res.data.accessToken;
      log('✅', 'POST /auth/login (student)', 'Token received');
    } catch (err) {
      log('❌', 'POST /auth/login (student)', err.response?.data?.message || err.message);
    }

    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        email: teacherEmail,
        password: 'Test@123'
      });
      teacherToken = res.data.accessToken;
      log('✅', 'POST /auth/login (teacher)', 'Token received');
    } catch (err) {
      log('❌', 'POST /auth/login (teacher)', err.response?.data?.message || err.message);
    }

    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        email: adminEmail,
        password: 'Test@123'
      });
      adminToken = res.data.accessToken;
      log('✅', 'POST /auth/login (admin)', 'Token received');
    } catch (err) {
      log('❌', 'POST /auth/login (admin)', err.response?.data?.message || err.message);
    }

    // TEST 3: POST /api/courses → draft create?
    console.log('\n📚 TEST 3: POST /api/courses (Draft Creation)\n');
    try {
      const res = await axios.post(`${BASE_URL}/courses`, {
        title: 'Test Course Draft',
        description: 'This should be draft',
        category: 'Tech'
      }, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      courseId = res.data._id;
      const status = res.data.status;
      if (status === 'draft') {
        log('✅', 'POST /courses (creates draft)', `Status: ${status}`);
      } else {
        log('❌', 'POST /courses (creates draft)', `Status: ${status} (expected: draft)`);
      }
    } catch (err) {
      log('❌', 'POST /courses', err.response?.data?.message || err.message);
    }

    // TEST 2: GET /api/courses → only approved?
    console.log('\n📖 TEST 2: GET /api/courses (Only Approved)\n');
    try {
      const res = await axios.get(`${BASE_URL}/courses`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      const courses = res.data.courses || [];
      const hasDraft = courses.some(c => c.status === 'draft' || c.status === 'pending');
      if (!hasDraft) {
        log('✅', 'GET /courses (filters drafts)', `Only approved shown (${courses.length} courses)`);
      } else {
        log('❌', 'GET /courses (filters drafts)', 'Draft or pending course visible!');
      }
    } catch (err) {
      log('❌', 'GET /courses', err.response?.data?.message || err.message);
    }

    // TEST 4: PUT submit endpoint → status = pending?
    console.log('\n⏳ TEST 4: PATCH /courses/:id/submit (Status → Pending)\n');
    try {
      const res = await axios.patch(`${BASE_URL}/courses/${courseId}/submit`, {}, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      const status = res.data.course?.status;
      if (status === 'pending') {
        log('✅', 'PATCH /courses/:id/submit', `Status: ${status}`);
      } else {
        log('❌', 'PATCH /courses/:id/submit', `Status: ${status} (expected: pending)`);
      }
    } catch (err) {
      log('❌', 'PATCH /courses/:id/submit', err.response?.data?.message || err.message);
    }

    // TEST 5: Admin approve → status = approved?
    console.log('\n✔️ TEST 5: PUT /admin/approve/:id (Status → Approved)\n');
    try {
      const res = await axios.put(`${BASE_URL}/admin/approve/${courseId}`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const status = res.data.course?.status;
      if (status === 'approved') {
        log('✅', 'PUT /admin/approve/:id', `Status: ${status}`);
      } else {
        log('❌', 'PUT /admin/approve/:id', `Status: ${status} (expected: approved)`);
      }
    } catch (err) {
      log('❌', 'PUT /admin/approve/:id', err.response?.data?.message || err.message);
    }

    // TEST 6: AI ask-doubt → working?
    console.log('\n🤖 TEST 6: POST /ai/ask-doubt (AI Integration)\n');
    try {
      const res = await axios.post(`${BASE_URL}/ai/ask-doubt`, {
        courseId: courseId,
        lessonId: courseId,
        question: 'What is machine learning?',
        lessonContent: 'Machine learning is a subset of artificial intelligence that enables systems to learn from data.',
        courseTitle: 'Test Course Draft'
      }, {
        headers: { Authorization: `Bearer ${studentToken}` },
        timeout: 30000
      });
      if (res.data?.answer) {
        log('✅', 'POST /ai/ask-doubt', 'AI responded with answer');
      } else {
        log('⚠️', 'POST /ai/ask-doubt', 'No answer but request succeeded');
      }
    } catch (err) {
      if (err.response?.status === 500 && err.response?.data?.message?.includes('memory')) {
        log('⚠️', 'POST /ai/ask-doubt', 'Ollama OOM (infrastructure issue, not code)');
      } else if (err.code === 'ECONNREFUSED') {
        log('⚠️', 'POST /ai/ask-doubt', 'Ollama not running');
      } else {
        log('❌', 'POST /ai/ask-doubt', err.response?.data?.message || err.message);
      }
    }

    // SUMMARY
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║          📊 SUMMARY                   ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warnings = results.filter(r => r.result?.includes('⚠️')).length;
    
    console.log(`✅ PASSED:  ${passed}`);
    console.log(`❌ FAILED:  ${failed}`);
    console.log(`⚠️  WARNINGS: ${warnings}\n`);
    
    if (failed === 0) {
      console.log('🎉 ALL CRITICAL ENDPOINTS WORKING!\n');
      console.log('READY FOR FRONTEND DEVELOPMENT ✨\n');
      process.exit(0);
    } else {
      console.log('⚠️ Some endpoints need attention\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

test();
