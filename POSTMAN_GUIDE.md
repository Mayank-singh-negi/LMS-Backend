# AI Module Testing Guide - Postman Collection

This guide provides ready-to-use Postman requests for testing all AI endpoints.

## 🔑 Setup Variables

Before running requests, set these Postman variables:

```
{{baseUrl}} = http://localhost:5000/api/v1
{{studentToken}} = JWT_TOKEN_OF_STUDENT_USER
{{teacherToken}} = JWT_TOKEN_OF_TEACHER_USER
{{courseId}} = 507f1f77bcf86cd799439011
{{lessonId}} = 507f1f77bcf86cd799439012
```

## 📋 Test Cases

### 1. ASK DOUBT - Basic Question

**Method:** POST  
**Endpoint:** `{{baseUrl}}/ai/ask-doubt`  
**Auth:** Bearer {{studentToken}}

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "courseId": "{{courseId}}",
  "lessonId": "{{lessonId}}",
  "question": "What is the difference between mitosis and meiosis?",
  "lessonContent": "Mitosis is a form of cell division that results in two daughter cells each having the same number and kind of chromosomes as the parent nucleus. Meiosis is a type of cell division that reduces the number of chromosomes in the daughter cells to half the number in the parent cell. This is necessary for sexually reproducing organisms.",
  "courseTitle": "Biology 101"
}
```

**Expected Status:** 200  
**Expected Response:** Answer with token usage

---

### 2. ASK DOUBT - Edge Case: Very Short Question

**Method:** POST  
**Endpoint:** `{{baseUrl}}/ai/ask-doubt`  
**Auth:** Bearer {{studentToken}}

**Body:**
```json
{
  "courseId": "{{courseId}}",
  "lessonId": "{{lessonId}}",
  "question": "ab",
  "lessonContent": "This is lesson content",
  "courseTitle": "Biology 101"
}
```

**Expected Status:** 400  
**Expected Error:** "Question must be at least 3 characters long"

---

### 3. ASK DOUBT - Edge Case: Missing Fields

**Method:** POST  
**Endpoint:** `{{baseUrl}}/ai/ask-doubt`  
**Auth:** Bearer {{studentToken}}

**Body:**
```json
{
  "courseId": "{{courseId}}",
  "lessonId": "{{lessonId}}",
  "question": "What is photosynthesis?"
}
```

**Expected Status:** 400  
**Expected Error:** "Missing required fields: lessonContent, courseTitle"

---

### 4. GENERATE QUIZ - Valid Request

**Method:** POST  
**Endpoint:** `{{baseUrl}}/ai/generate-quiz`  
**Auth:** Bearer {{teacherToken}}

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "courseId": "{{courseId}}",
  "lessonId": "{{lessonId}}",
  "lessonContent": "The water cycle is the process by which water moves around the Earth in different forms: liquid, solid, and gas. Evaporation is when water from oceans, lakes, and rivers turns into water vapor and rises into the atmosphere. Condensation is when this water vapor cools and turns back into liquid water droplets, forming clouds. Precipitation occurs when water falls from clouds as rain, snow, or hail. Finally, collection happens when water flows to oceans, lakes, and rivers, completing the cycle. This continuous cycle is driven by the sun's energy and is essential for life on Earth."
}
```

**Expected Status:** 201  
**Expected Response:** Array of 5 questions with options and correct answers

---

### 5. GENERATE QUIZ - Teacher Only (Wrong Role)

**Method:** POST  
**Endpoint:** `{{baseUrl}}/ai/generate-quiz`  
**Auth:** Bearer {{studentToken}}

**Body:**
```json
{
  "courseId": "{{courseId}}",
  "lessonId": "{{lessonId}}",
  "lessonContent": "Lesson content here..."
}
```

**Expected Status:** 403  
**Expected Error:** "Forbidden: Insufficient permissions"

---

### 6. GENERATE QUIZ - Insufficient Content

**Method:** POST  
**Endpoint:** `{{baseUrl}}/ai/generate-quiz`  
**Auth:** Bearer {{teacherToken}}

**Body:**
```json
{
  "courseId": "{{courseId}}",
  "lessonId": "{{lessonId}}",
  "lessonContent": "Short content"
}
```

**Expected Status:** 400  
**Expected Error:** "Lesson content must be at least 100 characters"

---

### 7. GET CHAT HISTORY

**Method:** GET  
**Endpoint:** `{{baseUrl}}/ai/chat-history/{{lessonId}}?limit=10`  
**Auth:** Bearer {{studentToken}}

**Expected Status:** 200  
**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userId": "...",
      "question": "...",
      "answer": "...",
      "tokensUsed": {...},
      "createdAt": "2024-02-25T10:30:00Z"
    }
  ],
  "count": 1
}
```

---

### 8. GET LESSON QUIZZES

**Method:** GET  
**Endpoint:** `{{baseUrl}}/ai/quizzes/{{courseId}}/{{lessonId}}`  
**Auth:** Bearer {{studentToken}}

**Expected Status:** 200  
**Expected Response:** Array of published quizzes for the lesson

---

### 9. PUBLISH QUIZ

**Method:** PATCH  
**Endpoint:** `{{baseUrl}}/ai/quiz/QUIZ_ID_HERE/publish`  
**Auth:** Bearer {{teacherToken}}

**Note:** Replace QUIZ_ID_HERE with actual quiz ID from generate-quiz response

**Expected Status:** 200  
**Expected Response:** Updated quiz with `isPublished: true`

---

### 10. MARK ANSWER HELPFUL

**Method:** POST  
**Endpoint:** `{{baseUrl}}/ai/feedback/CHAT_HISTORY_ID_HERE`  
**Auth:** Bearer {{studentToken}}

**Note:** Replace CHAT_HISTORY_ID_HERE with actual ID

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "isHelpful": true,
  "feedback": "This answer was very clear and helpful!"
}
```

**Expected Status:** 200

---

### 11. GET USER AI STATISTICS

**Method:** GET  
**Endpoint:** `{{baseUrl}}/ai/stats`  
**Auth:** Bearer {{studentToken}}

**Expected Status:** 200  
**Expected Response:**
```json
{
  "success": true,
  "data": {
    "doubtSolver": {
      "questionsAsked": 5,
      "tokensUsed": 2350,
      "costUSD": 0.35
    },
    "quizGenerator": {
      "quizzesGenerated": 2,
      "tokensUsed": 2576,
      "costUSD": 0.39
    },
    "total": {
      "tokensUsed": 4926,
      "costUSD": 0.74
    }
  }
}
```

---

### 12. GET QUIZ BY ID

**Method:** GET  
**Endpoint:** `{{baseUrl}}/ai/quiz/QUIZ_ID_HERE`  
**Auth:** Bearer {{studentToken}}

**Expected Status:** 200  
**Expected Response:** Quiz object with all questions

---

### 13. DELETE QUIZ

**Method:** DELETE  
**Endpoint:** `{{baseUrl}}/ai/quiz/QUIZ_ID_HERE`  
**Auth:** Bearer {{teacherToken}}

**Expected Status:** 200  
**Expected Response:**
```json
{
  "success": true,
  "message": "Quiz deleted successfully"
}
```

---

## 🧪 Advanced Testing Scenarios

### Scenario 1: Rate Limiting Test

Make 31 requests to `/api/v1/ai/ask-doubt` in less than 15 minutes (exceeds 30 limit)

**31st Request Expected Response:**
```
Status: 429
{
  "success": false,
  "message": "Too many requests to AI service, please try again later"
}
```

### Scenario 2: Complete Workflow

1. **Generate a quiz** (POST /ai/generate-quiz)
   - Save the `quizId` from response

2. **Get the quiz** (GET /ai/quiz/{quizId})
   - Verify questions are present

3. **Publish the quiz** (PATCH /ai/quiz/{quizId}/publish)
   - Verify `isPublished: true`

4. **Get published quizzes for lesson** (GET /ai/quizzes/{courseId}/{lessonId})
   - Verify your quiz appears in results

### Scenario 3: Doubt Solver Workflow

1. **Ask a doubt** (POST /ai/ask-doubt)
   - Save the `chatHistoryId` from response

2. **Get chat history** (GET /ai/chat-history/{lessonId})
   - Verify your question appears

3. **Mark helpful** (POST /ai/feedback/{chatHistoryId})
   - Mark as helpful with feedback

4. **Check stats** (GET /ai/stats)
   - Verify `doubtSolver.questionsAsked` increased

---

## 📊 Performance Testing

### Load Testing Example (using Apache Bench)

```bash
# Test doubt solver endpoint
ab -n 50 -c 10 -H "Authorization: Bearer {{studentToken}}" \
  -p request.json \
  -T application/json \
  http://localhost:5000/api/v1/ai/ask-doubt

# This sends 50 requests with 10 concurrent connections
```

### Expected Results:
- Requests within rate limit: 200 OK
- Requests exceeding limit: 429 Too Many Requests
- Response time: <500ms for most requests

---

## 🐛 Debugging Tips

### 1. Check Request Format
```bash
# Use verbose logging
curl -v -X POST http://localhost:5000/api/v1/ai/ask-doubt \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @payload.json
```

### 2. Validate JSON
```javascript
// Paste JSON in browser console
JSON.parse('{"test": "valid"}')
```

### 3. Monitor Logs
```bash
tail -f ai-service.log
```

### 4. Check Database
```javascript
// MongoDB shell
db.chathistories.findOne()
db.generatedquizzes.findOne()
db.tokenusages.findOne()
```

---

## Postman Collection JSON

Import this into Postman:

```json
{
  "info": {
    "name": "E-Learning AI Module",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Doubt Solver",
      "item": [
        {
          "name": "Ask Doubt",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/ai/ask-doubt",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{studentToken}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"courseId\": \"{{courseId}}\", \"lessonId\": \"{{lessonId}}\", \"question\": \"What is photosynthesis?\", \"lessonContent\": \"...\", \"courseTitle\": \"Biology 101\"}"
            }
          }
        }
      ]
    }
  ]
}
```

---

## ✅ Validation Checklist

Before deploying:

- [ ] Test all endpoints with valid data
- [ ] Verify error handling (400, 401, 403, 429, 500)
- [ ] Check rate limiting works
- [ ] Verify role-based access controls
- [ ] Test with invalid MongoDB IDs
- [ ] Test with very long inputs
- [ ] Verify JWT token validation
- [ ] Check database persistence
- [ ] Monitor OpenAI API calls
- [ ] Verify cost tracking
