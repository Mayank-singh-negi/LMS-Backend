# ⚡ QUICK START GUIDE - Get AI Features Running in 5 Minutes

## 🎯 In This Guide:
This is the **fastest way** to get the AI module running. For detailed documentation, see other guides.

---

## ✅ Step 1: Update .env File (1 minute)

Open `.env` in the root directory and add/update these variables:

```env
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE
OPENAI_MODEL=gpt-4o-mini
LOG_LEVEL=info
```

**How to get OPENAI_API_KEY:**
1. Go to https://platform.openai.com/account/api-keys
2. Click "Create new secret key"
3. Copy the key and paste into .env
4. **DO NOT COMMIT .env TO GIT!**

---

## ✅ Step 2: Verify Installation (1 minute)

```bash
# Check OpenAI package is installed
npm list openai

# Should show: openai@latest

# If not installed, run:
npm install openai
```

---

## ✅ Step 3: Start Server (1 minute)

```bash
# Development mode with auto-reload
npm run dev

# You should see:
# ✓ Server running on port 5000
# ✓ Connected to MongoDB
# ✓ AI module loaded
```

---

## ✅ Step 4: Test First Endpoint (2 minutes)

### Test 1: Ask a Doubt (Doubt Solver)

**Using Postman or curl:**

```bash
curl -X POST http://localhost:5000/api/v1/ai/ask-doubt \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "507f1f77bcf86cd799439011",
    "lessonId": "507f1f77bcf86cd799439012",
    "question": "What is photosynthesis?",
    "lessonContent": "Photosynthesis is the process by which plants convert light energy into chemical energy. This takes place in two stages: light-dependent reactions and the Calvin cycle.",
    "courseTitle": "Biology 101"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "answer": "Photosynthesis is the process where plants convert sunlight...",
    "tokensUsed": {
      "prompt": 145,
      "completion": 89,
      "total": 234
    },
    "chatHistoryId": "507f1f77bcf86cd799439013"
  },
  "message": "Doubt solved successfully"
}
```

### Test 2: Generate a Quiz

```bash
curl -X POST http://localhost:5000/api/v1/ai/generate-quiz \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_TEACHER" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "507f1f77bcf86cd799439011",
    "lessonId": "507f1f77bcf86cd799439012",
    "lessonContent": "The water cycle is the continuous movement of water between Earth and the atmosphere. It includes evaporation, condensation, precipitation, and collection. The sun provides the energy that drives the water cycle, and gravity plays a key role in moving water around the globe."
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "quizId": "507f1f77bcf86cd799439014",
    "questions": [
      {
        "question": "What is the primary energy source for the water cycle?",
        "options": ["The sun", "Wind", "Ocean currents", "Gravity"],
        "correctAnswer": "The sun",
        "explanation": "The sun provides thermal energy..."
      }
    ],
    "tokensUsed": {
      "prompt": 287,
      "completion": 456,
      "total": 743
    }
  },
  "message": "Quiz generated successfully"
}
```

---

## 🎓 Common Issues & Quick Fixes

### Issue: "OPENAI_API_KEY not set"
```
❌ Solution: Check .env file has OPENAI_API_KEY=sk-...
✅ Verify file is in root directory (elearning-backend/.env)
✅ Restart server after updating .env
```

### Issue: "Unauthorized" (401)
```
❌ Solution: Check JWT token is valid
✅ Use token from /api/v1/auth/login endpoint
✅ Include "Bearer " prefix in Authorization header
```

### Issue: "Forbidden" (403)
```
❌ Solution: User doesn't have required role
✅ For quiz generation: Use teacher role token  
✅ For doubt solver: Use student token
```

### Issue: "Rate limited" (429)
```
❌ Solution: Too many requests
✅ Wait 15 minutes (doubt solver)
✅ Wait 1 hour (quiz generator)
```

### Issue: "Invalid JSON in response"
```
❌ Solution: Quiz parsing failed
✅ Regenerate quiz - usually works on retry
✅ Check lessonContent is long enough (min 100 chars)
```

---

## 📊 All Available Endpoints

### Doubt Solver
```
POST   /api/v1/ai/ask-doubt                  → Ask question
GET    /api/v1/ai/chat-history/:lessonId    → Get history
POST   /api/v1/ai/feedback/:chatHistoryId   → Mark helpful
```

### Quiz Generator
```
POST   /api/v1/ai/generate-quiz              → Generate MCQs
GET    /api/v1/ai/quizzes/:courseId/:lessonId → List quizzes
GET    /api/v1/ai/quiz/:quizId               → Get specific quiz
PATCH  /api/v1/ai/quiz/:quizId/publish       → Publish quiz
DELETE /api/v1/ai/quiz/:quizId               → Delete quiz
```

### Statistics
```
GET    /api/v1/ai/stats                      → Get user stats
```

---

## 🔍 Check Logs for Debugging

```bash
# Watch logs in real-time
tail -f ai-service.log

# Or search for errors
grep "error" ai-service.log

# Check specific operation
grep "ask_doubt" ai-service.log
```

---

## 💰 Monitor Your Costs

1. **Check daily usage:**
   ```bash
   # Get user stats endpoint
   GET /api/v1/ai/stats
   ```

2. **View OpenAI dashboard:**
   - Go to https://platform.openai.com/account/usage/overview
   - Check estimated monthly cost
   - Set up billing alerts ($5, $10, $20+)

3. **Expected costs (GPT-4o-mini):**
   - 1 doubt solver question: ~$0.0001-0.0002
   - 1 quiz generation: ~$0.0005-0.001

---

## 🚀 Next Steps

1. **For Production Setup:**
   - See `AI_SETUP_GUIDE.md`
   - Configure strong JWT secrets
   - Set up monitoring

2. **For Advanced Features:**
   - See `ADVANCED_FEATURES.md`
   - Streaming responses
   - Caching strategies
   - Batch processing

3. **For Testing:**
   - See `POSTMAN_GUIDE.md`
   - Complete API examples
   - Error scenarios
   - Rate limit testing

4. **For Deep Understanding:**
   - See `AI_IMPLEMENTATION_SUMMARY.md`
   - Architecture explanation
   - Database schema details
   - Security implementation

---

## ✨ Features You Now Have

✅ **AI Doubt Solver**
- Students ask questions
- AI answers using lesson context
- Chat history saved
- Rate limited to prevent abuse

✅ **Auto Quiz Generator**
- Teachers generate MCQs
- 5 questions per generation
- Safe JSON parsing
- Publish/unpublish quizzes

✅ **Cost Tracking**
- Track tokens used
- Calculate costs
- Monitor per-user budget
- Generate usage reports

✅ **Security**
- JWT authentication
- Role-based authorization
- Input validation
- Rate limiting
- Error handling

✅ **Monitoring**
- Structured logging
- Token usage tracking
- Cost monitoring
- Error tracking

---

## 🎯 What's Working Right Now

✅ Database: MongoDB schemas ready
✅ API: All 9 endpoints functional
✅ Security: Authentication & validation active
✅ Rate Limiting: Implemented
✅ Logging: Structured logging active
✅ Error Handling: Graceful error responses

---

## 📝 Production Checklist

Before deploying to production:

- [ ] OPENAI_API_KEY set securely
- [ ] .env file NOT in git
- [ ] JWT secrets are strong
- [ ] Database backups enabled
- [ ] Monitoring configured
- [ ] Rate limits tested
- [ ] Error handling verified
- [ ] Logging working
- [ ] Cost alerts set up

---

## 💬 Troubleshooting

**Can't connect to MongoDB?**
```bash
# Test connection
node -e "require('mongoose').connect(process.env.MONGO_URI).then(() => console.log('OK'))"
```

**OpenAI API key not working?**
```bash
# Test key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY"
```

**Need to see detailed errors?**
```bash
# Enable detailed logging
LOG_LEVEL=debug npm run dev
```

---

## 📞 Quick Reference

| Need | Location |
|------|----------|
| Setup guide | `AI_SETUP_GUIDE.md` |
| Postman examples | `POSTMAN_GUIDE.md` |
| Advanced features | `ADVANCED_FEATURES.md` |
| Full implementation | `AI_IMPLEMENTATION_SUMMARY.md` |
| Environment variables | `.env.example` |
| API code | `src/modules/ai/` |

---

## 🎉 You're Done!

Your AI module is **production-ready and running**. 

Next: Test endpoints with Postman (see `POSTMAN_GUIDE.md`)

**Happy learning! 🚀**
