# OpenAI Integration - Production Setup Guide

## ⚙️ Environment Variables

Add these variables to your `.env` file in the root directory of `elearning-backend`:

```env
# ========================================
# OPENAI CONFIGURATION
# ========================================

# Get your API key from: https://platform.openai.com/account/api-keys
# Keep this SECRET - never commit to version control
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Model to use (defaults to gpt-4o-mini)
# Options: gpt-4o-mini, gpt-4o, gpt-4-turbo, gpt-3.5-turbo
OPENAI_MODEL=gpt-4o-mini

# Logging level
LOG_LEVEL=info

# ========================================
# DATABASE CONFIGURATION
# ========================================

# MongoDB connection string
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/elearning?retryWrites=true&w=majority

# ========================================
# JWT AUTHENTICATION
# ========================================

# Generate strong random secrets:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

JWT_SECRET=your-very-long-random-secret-key-here-change-this-in-production
JWT_REFRESH_SECRET=your-very-long-random-refresh-secret-key-here-change-this-in-production

# ========================================
# SERVER CONFIGURATION
# ========================================

PORT=5000
NODE_ENV=development

# ========================================
# CLOUDINARY CONFIGURATION (Optional)
# ========================================

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🔒 Security Best Practices

### 1. **API Key Management**
- ✅ Never commit `.env` to git
- ✅ Add `.env` to `.gitignore`
- ✅ Use different keys for dev/prod
- ✅ Rotate keys regularly (monthly)
- ✅ Store in secure secret management (AWS Secrets Manager, Vault, etc.)

### 2. **Rate Limiting**
- Doubt Solver: 30 requests per 15 minutes
- Quiz Generator: 10 requests per 1 hour (stricter for expensive operation)
- Admins bypass rate limiting

### 3. **Input Validation**
- Max prompt length: 5000 characters
- Max lesson content: 50000 characters
- Validation happens on both client and server
- Input sanitization prevents prompt injection

### 4. **Token Usage Tracking**
- All API calls logged to database
- Cost calculation included for billing
- Monitor usage in real-time
- Set billing alerts in OpenAI dashboard

## 📁 Folder Structure

```
src/
├── modules/
│   ├── ai/
│   │   ├── ai.controller.js       # Route handlers
│   │   ├── ai.service.js          # Business logic & OpenAI integration
│   │   ├── ai.routes.js           # API endpoints
│   │   └── ai.model.js            # MongoDB schemas
│   ├── auth/
│   ├── courses/
│   ├── enrollments/
│   └── [other modules...]
├── middlewares/
│   ├── auth.middleware.js         # JWT authentication
│   ├── role.middleware.js         # Role-based authorization
│   └── ai-rate-limit.middleware.js # Rate limiting for AI endpoints
├── validators/
│   └── ai.validator.js            # Input validation schemas
├── config/
│   ├── db.js
│   ├── cloudinary.js
│   └── [other configs...]
├── routes/
│   └── v1.routes.js               # Main API router (includes AI routes)
├── app.js                         # Express app setup
├── server.js                      # Server entry point
└── utils/
    └── [utility functions...]
```

## 🚀 Installation & Setup

### Step 1: Install Dependencies
```bash
cd elearning-backend

# Install OpenAI SDK (if not already installed)
npm install openai

# Verify installation
npm list openai
```

### Step 2: Configure Environment
```bash
# Copy and edit .env
cp .env.example .env

# Add your OPENAI_API_KEY to .env
```

### Step 3: Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Step 4: Test API Endpoints
```bash
# See Postman examples below
```

## 📊 API Endpoints Overview

### Doubt Solver Endpoints

| Method | Endpoint | Requires | Rate Limit |
|--------|----------|----------|-----------|
| POST | `/api/v1/ai/ask-doubt` | Student role | 30/15min |
| GET | `/api/v1/ai/chat-history/:lessonId` | Any auth | None |
| POST | `/api/v1/ai/feedback/:chatHistoryId` | Any auth | None |

### Quiz Generator Endpoints

| Method | Endpoint | Requires | Rate Limit |
|--------|----------|----------|-----------|
| POST | `/api/v1/ai/generate-quiz` | Teacher role | 10/hour |
| GET | `/api/v1/ai/quizzes/:courseId/:lessonId` | Any auth | None |
| GET | `/api/v1/ai/quiz/:quizId` | Any auth | None |
| PATCH | `/api/v1/ai/quiz/:quizId/publish` | Teacher role | None |
| DELETE | `/api/v1/ai/quiz/:quizId` | Teacher role | None |

### Stats Endpoints

| Method | Endpoint | Requires |
|--------|----------|----------|
| GET | `/api/v1/ai/stats` | Any auth |

## 📤 Request/Response Examples

### 1️⃣ Ask a Doubt

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/ai/ask-doubt \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "507f1f77bcf86cd799439011",
    "lessonId": "507f1f77bcf86cd799439012",
    "question": "What is photosynthesis and how does it work?",
    "lessonContent": "Photosynthesis is a process used by plants to convert light energy from the sun into chemical energy. This chemical energy is stored in glucose molecules...",
    "courseTitle": "Biology 101"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "answer": "Photosynthesis is the process by which plants convert sunlight into chemical energy stored in glucose. It occurs in two stages: the light-dependent reactions in the thylakoids of chloroplasts where light energy is converted into ATP and NADPH, and the light-independent reactions (Calvin cycle) in the stroma where these energy carriers are used to convert CO2 into glucose. This fundamental process is crucial for life on Earth as it produces oxygen and forms the basis of most food chains.",
    "tokensUsed": {
      "prompt": 287,
      "completion": 145,
      "total": 432
    },
    "chatHistoryId": "507f1f77bcf86cd799439013"
  },
  "message": "Doubt solved successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Question must be at least 3 characters long"
}
```

**Error Response (429 - Rate Limited):**
```json
{
  "success": false,
  "message": "Too many requests to AI service, please try again later"
}
```

### 2️⃣ Generate Quiz

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/ai/generate-quiz \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "507f1f77bcf86cd799439011",
    "lessonId": "507f1f77bcf86cd799439012",
    "lessonContent": "The mitochondria is the powerhouse of the cell. It contains inner and outer membranes. The matrix contains enzymes for the citric acid cycle. The cristae increase surface area. Mitochondria produce ATP through oxidative phosphorylation. This is why cells with high energy demands have many mitochondria. Glucose is broken down in glycolysis first, then pyruvate enters mitochondria for the citric acid cycle."
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "quizId": "507f1f77bcf86cd799439014",
    "questions": [
      {
        "question": "What is the primary function of mitochondria?",
        "options": [
          "Producing ATP through oxidative phosphorylation",
          "Storing genetic information",
          "Synthesizing proteins",
          "Breaking down lipids"
        ],
        "correctAnswer": "Producing ATP through oxidative phosphorylation",
        "explanation": "Mitochondria are known as the powerhouse of the cell because they generate ATP, the cell's energy currency, through the process of oxidative phosphorylation in the inner membrane. While mitochondria do store some DNA, they are not the primary storage location for genetic information."
      },
      {
        "question": "What structures increase the surface area inside mitochondria?",
        "options": [
          "Cristae",
          "Matrix",
          "Outer membrane",
          "Inner membrane"
        ],
        "correctAnswer": "Cristae",
        "explanation": "The cristae are folds of the inner mitochondrial membrane. These folds dramatically increase the surface area available for the electron transport chain and chemiosmosis, allowing for more efficient ATP production. This is why cells with high energy demands have mitochondria with particularly extensive cristae."
      }
    ],
    "tokensUsed": {
      "prompt": 412,
      "completion": 876,
      "total": 1288
    }
  },
  "message": "Quiz generated successfully"
}
```

### 3️⃣ Get Chat History

**Request:**
```bash
curl -X GET "http://localhost:5000/api/v1/ai/chat-history/507f1f77bcf86cd799439012?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "507f1f77bcf86cd799439001",
      "courseId": "507f1f77bcf86cd799439011",
      "lessonId": "507f1f77bcf86cd799439012",
      "question": "What is photosynthesis?",
      "answer": "...",
      "tokensUsed": {
        "promptTokens": 287,
        "completionTokens": 145,
        "totalTokens": 432
      },
      "model": "gpt-4o-mini",
      "isHelpful": true,
      "createdAt": "2024-02-25T10:30:00Z"
    }
  ],
  "count": 1
}
```

### 4️⃣ Publish Quiz

**Request:**
```bash
curl -X PATCH http://localhost:5000/api/v1/ai/quiz/507f1f77bcf86cd799439014/publish \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "isPublished": true,
    "publishedAt": "2024-02-25T10:35:00Z"
  },
  "message": "Quiz published successfully"
}
```

### 5️⃣ Mark Answer Helpful

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/ai/feedback/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isHelpful": true,
    "feedback": "Great explanation! Very clear and helpful."
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "isHelpful": true,
    "feedback": "Great explanation! Very clear and helpful."
  },
  "message": "Feedback recorded successfully"
}
```

### 6️⃣ Get User AI Statistics

**Request:**
```bash
curl -X GET http://localhost:5000/api/v1/ai/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "doubtSolver": {
      "questionsAsked": 15,
      "tokensUsed": 6480,
      "costUSD": 0.97
    },
    "quizGenerator": {
      "quizzesGenerated": 3,
      "tokensUsed": 3864,
      "costUSD": 0.58
    },
    "total": {
      "tokensUsed": 10344,
      "costUSD": 1.55
    }
  }
}
```

## 💾 MongoDB Schemas

### ChatHistory Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  courseId: ObjectId,
  lessonId: ObjectId,
  question: String,
  answer: String,
  tokensUsed: {
    promptTokens: Number,
    completionTokens: Number,
    totalTokens: Number
  },
  model: String,
  isHelpful: Boolean,
  feedback: String,
  createdAt: Date,
  updatedAt: Date
}
```

### GeneratedQuiz Collection
```javascript
{
  _id: ObjectId,
  courseId: ObjectId,
  lessonId: ObjectId,
  createdBy: ObjectId,
  lessonContent: String,
  questions: [
    {
      question: String,
      options: [String],
      correctAnswer: String,
      explanation: String
    }
  ],
  tokensUsed: {
    promptTokens: Number,
    completionTokens: Number,
    totalTokens: Number
  },
  model: String,
  isPublished: Boolean,
  publishedAt: Date,
  status: "pending" | "generating" | "completed" | "failed",
  errorMessage: String,
  createdAt: Date,
  updatedAt: Date
}
```

### TokenUsage Collection (Cost Tracking)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  type: "doubt_solver" | "quiz_generator",
  tokensUsed: Number,
  costUSD: Number,
  model: String,
  referenceId: ObjectId,
  referenceModel: "ChatHistory" | "GeneratedQuiz",
  createdAt: Date
}
```

## 🌊 Streaming Response Example (Coming Soon)

For long AI responses, streaming can improve UX:

```javascript
// In ai.controller.js - streaming example
export const askDoubtWithStreaming = async (req, res) => {
  // ... validation code ...

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    stream: true,
  });

  let fullContent = '';

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    fullContent += content;
    res.write(`data: ${JSON.stringify({ content })}\n\n`);
  }

  // Save to DB after stream completes
  await ChatHistory.create({
    userId,
    courseId,
    lessonId,
    question,
    answer: fullContent,
    // ...
  });

  res.write('data: [DONE]\n\n');
  res.end();
};
```

## 📈 Cost Optimization Tips

### 1. **Use Cheaper Models**
- `gpt-4o-mini` - Best value (~$0.00015/1K prompt tokens)
- `gpt-3.5-turbo` - Good for simple tasks
- `gpt-4o` - Higher quality but 2x cost

### 2. **Optimize Prompts**
- Shorter prompts = fewer tokens
- Be specific to reduce output tokens
- Reuse system prompts (don't repeat)

### 3. **Caching**
```javascript
// Cache common answers to avoid re-querying
const cache = new Map();

const getCachedAnswer = (questionHash) => {
  return cache.get(questionHash);
};

const cacheAnswer = (questionHash, answer) => {
  cache.set(questionHash, answer);
};
```

### 4. **Token Limits**
- Set `max_tokens: 1000` for doubt solver
- Set `max_tokens: 2000` for quiz generator
- Prevents cost runaway

### 5. **Rate Limiting**
- Already implemented in middleware
- Prevents abuse and excessive costs
- Track usage per user

### 6. **Batch Operations**
- Generate multiple quizzes in one request (future enhancement)
- Reduces overhead

## 🔍 Monitoring & Debugging

### View Logs
```bash
# Development
tail -f ai-service.log
tail -f ai-controller.log

# Or use grep
grep "error" ai-service.log
grep "OpenAI API" ai-service.log
```

### Check OpenAI Usage
```bash
# Visit OpenAI dashboard
https://platform.openai.com/account/billing/overview

# Monitor costs in real-time
# Set up billing alerts at $5, $10, $20+
```

### Database Queries
```javascript
// Check token usage by user
db.tokenusages.aggregate([
  { $match: { userId: ObjectId("...") } },
  { $group: {
    _id: "$type",
    total: { $sum: "$tokensUsed" },
    cost: { $sum: "$costUSD" }
  }}
])

// Check helpful answers
db.chathistories.find({ isHelpful: true }).count()
```

## 🚨 Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| 401 - Unauthorized | Invalid API key | Check OPENAI_API_KEY in .env |
| 429 - Rate Limited | Too many requests | Wait or upgrade OpenAI plan |
| 500 - Server Error | OpenAI down | Retry after 5 minutes |
| 400 - Bad Request | Invalid input | Check validation messages |
| 422 - Invalid JSON | Quiz parsing failed | Regenerate quiz |

## ✅ Checklist Before Production

- [ ] OPENAI_API_KEY set in production environment
- [ ] .env file NOT committed to git
- [ ] Rate limiting configured correctly
- [ ] Error handling tested
- [ ] Unit tests written
- [ ] Integration tests passed
- [ ] Monitoring/logging set up
- [ ] Cost alerts configured
- [ ] JWT secrets strong and unique
- [ ] Database backups configured
- [ ] CORS settings appropriate
- [ ] Input validation working
- [ ] API rate limits tested
- [ ] Token usage tracking verified

## 📞 Support & Troubleshooting

For issues:
1. Check logs: `ai-service.log`, `ai-controller.log`
2. Visit: https://status.openai.com (OpenAI status)
3. Check API usage: https://platform.openai.com/account/api-keys
4. Review error messages in response

## 📚 Additional Resources

- OpenAI API Docs: https://platform.openai.com/docs
- Rate Limiting Guide: https://platform.openai.com/docs/guides/rate-limits
- Best Practices: https://platform.openai.com/docs/guides/production-best-practices
- Pricing: https://openai.com/pricing
