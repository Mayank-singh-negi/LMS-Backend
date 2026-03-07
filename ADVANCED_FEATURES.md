# 🚀 Advanced Features & Best Practices

## Table of Contents
1. [Advanced Prompt Engineering](#advanced-prompt-engineering)
2. [Streaming Responses](#streaming-responses)
3. [Caching Strategies](#caching-strategies)
4. [Batch Processing](#batch-processing)
5. [Cost Optimization](#cost-optimization)
6. [Production Monitoring](#production-monitoring)
7. [Scaling Tips](#scaling-tips)

---

## Advanced Prompt Engineering

### 1. Context-Aware Prompts

Current implementation uses lesson context. Here's how to enhance it:

```javascript
// ai.service.js - Enhanced version

const buildAdvancedDoubtPrompt = (lesson, question, userProfile) => {
  return `You are an expert tutor specializing in ${lesson.subject}.

Student Profile:
- Level: ${userProfile.level}  // beginner, intermediate, advanced
- Previous_misconceptions: ${userProfile.misconceptions}
- Learning_style: ${userProfile.learningStyle}

Lesson Context:
- Title: ${lesson.title}
- Duration: ${lesson.duration} minutes
- Difficulty: ${lesson.difficulty}

Content:
${lesson.content}

Student Question: "${question}"

Instructions:
1. Assess the student's current knowledge level
2. Identify any potential misconceptions
3. Provide answer tailored to their learning style:
   - Visual learners: Use diagrams/descriptions
   - Kinesthetic learners: Use real-world examples
   - Auditory learners: Use analogies/explanations
4. Include 1-2 follow-up questions for deeper understanding
5. Suggest resources if needed

Respond in ${userProfile.language}.`;
};
```

### 2. Few-Shot Examples in Prompts

Add examples to guide AI output:

```javascript
const buildQuizWithExamples = (lessonContent) => {
  return `Generate 5 multiple choice questions with examples.

EXAMPLE 1:
{
  "question": "What is the mitochondria?",
  "options": [
    "Powerhouse of the cell that produces ATP",
    "Structure that stores genetic material",
    "Organelle that synthesizes proteins",
    "Part of the cell membrane"
  ],
  "correctAnswer": "Powerhouse of the cell that produces ATP",
  "explanation": "The mitochondria is responsible for cellular respiration and ATP production..."
}

EXAMPLE 2:
...more examples...

Now generate 5 original questions from this lesson:
${lessonContent}`;
};
```

### 3. Temperature Settings for Different Tasks

```javascript
// In ai.service.js

// For doubt solver (needs creativity & variation)
const doubtSolverOptions = {
  temperature: 0.7,  // Balanced: consistent but not robotic
  top_p: 0.9,        // Nucleus sampling for diversity
};

// For quiz generator (needs correctness)
const quizGeneratorOptions = {
  temperature: 0.3,  // Lower: more deterministic
  top_p: 0.9,        // Ensures logical consistency
};

// For brainstorming (needs creativity)
const brainstormingOptions = {
  temperature: 0.9,  // Higher: more creative variations
  top_p: 1.0,        // Allow wider range
};
```

---

## Streaming Responses

### Why Streaming?
- Better UX for long responses
- Reduced latency perception
- Lower memory usage
- Real-time feedback

### Implementation

```javascript
// routes for streaming
router.post(
  "/ask-doubt-stream",
  authenticate,
  aiRateLimiter,
  validateAskDoubt,
  askDoubtStreamController
);

// In ai.controller.js
export const askDoubtStreamController = async (req, res) => {
  try {
    const { courseId, lessonId, question, lessonContent, courseTitle } =
      req.body;
    const userId = req.user.id;

    // Validate inputs
    const sanitizedQuestion = sanitizeInput(question);

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const messages = [
      {
        role: "system",
        content: buildDoubtSolverSystemPrompt(lessonContent, courseTitle),
      },
      {
        role: "user",
        content: sanitizedQuestion,
      },
    ];

    logger.info("Starting streaming doubt solver", {
      userId,
      courseId,
      lessonId,
    });

    // Create streaming request
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,  // Enable streaming
    });

    let fullContent = '';
    let promptTokens = 0;
    let completionTokens = 0;

    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullContent += content;
        // Send chunk to client as Server-Sent Event
        res.write(`data: ${JSON.stringify({
          type: 'content',
          content: content
        })}\n\n`);
      }

      // Capture usage info
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens;
        completionTokens = chunk.usage.completion_tokens;
      }
    }

    // Save to database after streaming completes
    const chatHistory = await ChatHistory.create({
      userId,
      courseId,
      lessonId,
      question: sanitizedQuestion,
      answer: fullContent,
      tokensUsed: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    });

    // Send completion signal
    res.write(`data: ${JSON.stringify({
      type: 'done',
      tokensUsed: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens
      },
      chatHistoryId: chatHistory._id
    })}\n\n`);

    res.end();

  } catch (error) {
    logger.error("Error in askDoubtStreamController:", error);

    // Send error as Server-Sent Event
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message
    })}\n\n`);

    res.end();
  }
};
```

### Client-Side Usage

```javascript
// React example
function DoubSolverStream() {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const askDoubtStream = async (payload) => {
    setAnswer('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/ai/ask-doubt-stream', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'content') {
              setAnswer(prev => prev + data.content);
            } else if (data.type === 'done') {
              console.log('Streaming complete', data.tokensUsed);
            } else if (data.type === 'error') {
              console.error('Stream error:', data.error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }

    setLoading(false);
  };

  return (
    <div>
      <button onClick={() => askDoubtStream(...)}>
        Ask with Streaming
      </button>
      <div className="streaming-answer">
        {answer}
      </div>
    </div>
  );
}
```

---

## Caching Strategies

### 1. Redis Caching

```javascript
// Install redis
npm install redis

// config/cache.js
import { createClient } from 'redis';

const redisClient = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
});

redisClient.connect();

export default redisClient;
```

### 2. Cache Common Answers

```javascript
// In ai.service.js
import redisClient from '../config/cache.js';

const getCachedAnswer = async (lessonId, questionHash) => {
  const cacheKey = `doubt:${lessonId}:${questionHash}`;
  const cached = await redisClient.get(cacheKey);
  return cached ? JSON.parse(cached) : null;
};

const setCachedAnswer = async (lessonId, questionHash, answer, ttl = 86400) => {
  const cacheKey = `doubt:${lessonId}:${questionHash}`;
  await redisClient.setEx(cacheKey, ttl, JSON.stringify(answer));
};

export const askDoubtWithCache = async ({
  userId,
  courseId,
  lessonId,
  question,
  lessonContent,
  courseTitle,
}) => {
  // Generate hash of normalized question
  const crypto = require('crypto');
  const normalized = question.toLowerCase().trim();
  const questionHash = crypto
    .createHash('md5')
    .update(normalized)
    .digest('hex');

  // Check cache
  const cached = await getCachedAnswer(lessonId, questionHash);
  if (cached) {
    logger.info("Using cached answer");
    return {
      success: true,
      answer: cached.answer,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },  // Free
      cached: true,
      chatHistoryId: null,
    };
  }

  // Call API if not cached
  const result = await askDoubt({
    userId,
    courseId,
    lessonId,
    question,
    lessonContent,
    courseTitle,
  });

  // Cache the result
  await setCachedAnswer(lessonId, questionHash, {
    answer: result.answer,
    explanation: "Cached result from previous query",
  });

  return {
    ...result,
    cached: false,
  };
};
```

### 3. Cache TTL Strategy

```javascript
// Different cache durations for different types
const CACHE_DURATIONS = {
  COMMON_ANSWERS: 7 * 24 * 60 * 60,      // 7 days
  QUIZ_RESULTS: 24 * 60 * 60,            // 1 day
  USER_STATS: 60 * 60,                    // 1 hour
  LESSON_CONTENT: 30 * 24 * 60 * 60,     // 30 days
};
```

---

## Batch Processing

### Bulk Quiz Generation

```javascript
// Enhanced route for batch processing
router.post(
  "/generate-quizzes-batch",
  authenticate,
  authorize("teacher", "admin"),
  validateBatchQuizGeneration,
  generateQuizzesBatchController
);

// In ai.controller.js
export const generateQuizzesBatchController = async (req, res) => {
  const { lessons } = req.body;  // Array of lesson objects
  const userId = req.user.id;

  // Start async job
  const jobId = generateJobId();

  // Return immediately
  res.status(202).json({
    success: true,
    jobId,
    message: "Processing batch quizzes",
    estimatedTime: `${lessons.length * 5} seconds`,
  });

  // Process in background
  processBatchQuizzes(jobId, lessons, userId).catch(error => {
    logger.error("Batch processing error:", error);
  });
};

// Background processing
async function processBatchQuizzes(jobId, lessons, userId) {
  const results = [];
  const errors = [];

  for (const lesson of lessons) {
    try {
      const result = await generateQuiz({
        userId,
        courseId: lesson.courseId,
        lessonId: lesson.lessonId,
        lessonContent: lesson.content,
      });
      
      results.push({
        lessonId: lesson.lessonId,
        quizId: result.quizId,
        status: 'completed'
      });

      // Save progress to Redis
      await saveJobProgress(jobId, {
        total: lessons.length,
        completed: results.length,
        errors: errors.length
      });

    } catch (error) {
      errors.push({
        lessonId: lesson.lessonId,
        error: error.message
      });
    }

    // Rate limiting: wait between API calls
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Store final results
  await saveJobResults(jobId, { results, errors });
}

// Check job status endpoint
router.get("/batch-jobs/:jobId", authenticate, async (req, res) => {
  const { jobId } = req.params;
  const status = await getJobStatus(jobId);
  return res.json({ success: true, data: status });
});
```

---

## Cost Optimization

### 1. Model Selection Strategy

```javascript
// Use cheaper models for simpler tasks
export const selectOptimalModel = (task, contentLength) => {
  // For short responses, use cheaper model
  if (contentLength < 500 && task === 'doubt_solver') {
    return 'gpt-3.5-turbo';  // Much cheaper
  }

  // For quiz generation, use balanced model
  if (task === 'quiz_generator') {
    return 'gpt-4o-mini';  // Good balance of quality & cost
  }

  // For complex reasoning, use premium
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
};

// Updated service call
export const askDoubt = async (...) => {
  const model = selectOptimalModel('doubt_solver', lessonContent.length);
  const response = await openai.chat.completions.create({
    model,  // Use selected model
    // ... rest of config
  });
};
```

### 2. Budget Alerts

```javascript
// In a scheduled job (every hour)
export const checkUserBudgets = async () => {
  const users = await User.find();

  for (const user of users) {
    const stats = await getUserAIStats(user._id);
    const monthlyCost = stats.total.costUSD * 30;  // Projected monthly

    if (monthlyCost > user.aiBudgetLimit) {
      // Send alert email
      await sendBudgetAlert(user.email, monthlyCost, user.aiBudgetLimit);

      // Rate limit the user
      if (monthlyCost > user.aiBudgetLimit * 1.5) {
        await disableAIFeatures(user._id);
      }
    }
  }
};
```

### 3. Token Limit Enforcement

```javascript
// Prevent runaway costs
export const enforceTokenLimits = (tokens) => {
  const MAX_TOKENS_PER_RESPONSE = {
    doubt_solver: 1000,
    quiz_generator: 2000,
  };

  const MONTHLY_BUDGET_PER_USER = {
    student: 100000,      // ~$15/month
    teacher: 500000,      // ~$75/month
    admin: Infinity,
  };

  return {
    // Clamp tokens
    clamped: Math.min(tokens, MAX_TOKENS_PER_RESPONSE[type]),
    
    // Check monthly usage
    exceedsMonthly: userMonthlyTokens > MONTHLY_BUDGET_PER_USER[role],
  };
};
```

---

## Production Monitoring

### 1. Real-time Monitoring Dashboard

```javascript
// Dashboard API endpoint
router.get("/admin/ai-dashboard", authenticate, authorize("admin"), async (req, res) => {
  const stats = {
    // Usage stats
    totalTokensToday: await getTotalTokensToday(),
    totalCostToday: await getTotalCostToday(),
    
    // Performance stats
    averageResponseTime: await getAverageResponseTime(),
    errorRate: await getErrorRate(),
    
    // User stats
    activeUsers: await getActiveUsersCount(),
    topUsers: await getTopUsersByUsage(),
    
    // OpenAI stats
    openaiStatusPage: 'https://status.openai.com',
    currentUsagePercent: await getOpenAIUsagePercent(),
  };

  res.json({ success: true, data: stats });
});
```

### 2. Alert System

```javascript
// Set up alerts
const alerts = [
  {
    condition: () => getTotalCostToday() > 100,
    message: "Daily cost exceeded $100",
    severity: "critical",
    action: () => notifyAdmins()
  },
  {
    condition: () => getErrorRate() > 0.05,
    message: "Error rate exceeded 5%",
    severity: "warning",
    action: () => logIncident()
  },
  {
    condition: () => getAverageResponseTime() > 5000,
    message: "Average response time > 5s",
    severity: "warning",
    action: () => investigateSlowdown()
  }
];

// Check alerts periodically
setInterval(async () => {
  for (const alert of alerts) {
    if (await alert.condition()) {
      await alert.action();
    }
  }
}, 60000);  // Every minute
```

### 3. Logging Best Practices

```javascript
// Structured logging
logger.info('AI_REQUEST', {
  operationType: 'ask_doubt',
  userId: user._id,
  courseId: course._id,
  inputLength: question.length,
  model: 'gpt-4o-mini',
  temperature: 0.7,
  timestamp: new Date(),
});

logger.info('AI_RESPONSE', {
  operationType: 'ask_doubt',
  userId: user._id,
  outputLength: answer.length,
  tokensUsed: response.usage.total_tokens,
  costUSD: calculateCost(response.usage),
  responseTime: Date.now() - startTime,
  timestamp: new Date(),
});

logger.error('AI_ERROR', {
  operationType: 'ask_doubt',
  userId: user._id,
  error: error.message,
  stack: error.stack,
  timestamp: new Date(),
});
```

---

## Scaling Tips

### 1. Horizontal Scaling

```javascript
// Use job queue (Bull/RabbitMQ) for async processing
import Queue from 'bull';

const quizGenerationQueue = new Queue('quiz-generation');

// Add job
quizGenerationQueue.add(
  { userId, courseId, lessonId, lessonContent },
  { delay: 0, removeOnComplete: true }
);

// Process job
quizGenerationQueue.process(async (job) => {
  return await generateQuiz(job.data);
});

// This allows multiple workers to process quizzes in parallel
```

### 2. Database Sharding

```javascript
// For millions of records, shard by userId
const getShard = (userId) => {
  const hash = crypto.createHash('md5').update(userId).digest('hex');
  const shardNumber = parseInt(hash.substr(0, 8), 16) % NUM_SHARDS;
  return shardNumber;
};

// Connect to appropriate shard database
const getShardedDB = (userId) => {
  const shardNumber = getShard(userId);
  return dbShards[shardNumber];
};
```

### 3. Read Replicas

```javascript
// MongoDB read preferences
const ChatHistory = mongoose.model('ChatHistory', schema, {
  // Read from secondary for analytics queries
  readPreference: 'secondaryPreferred'
});

// Separate read and write connections
const primaryDB = mongoose.createConnection(PRIMARY_URI);
const secondaryDB = mongoose.createConnection(SECONDARY_URI);

// Use for high-volume reads
secondaryDB.model('ChatHistory', schema).find(query);
```

### 4. CDN for Static Content

```javascript
// Serve quiz images/media via CDN
const getQuizMediaURL = (mediaId) => {
  return `https://cdn.elearning.com/quiz/${mediaId}`;
};
```

---

## Summary of Advanced Features

| Feature | Benefit | Complexity |
|---------|---------|-----------|
| Streaming | Better UX, lower latency | Medium |
| Caching | Reduced API calls, faster responses | Medium |
| Batch Processing | Scale up operations | High |
| Cost Optimization | Reduce OpenAI costs | Low-Medium |
| Monitoring | Early issue detection | Medium |
| Scaling | Handle millions of users | High |

**Recommended Phase-in:**
1. Start with basic features (Week 1)
2. Add caching (Week 2-3)
3. Add monitoring (Week 4-5)
4. Add streaming (Week 6-7)
5. Add batch processing when needed (Week 8+)
6. Scale infrastructure as needed

---

## 🎯 Conclusion

Your AI module is production-ready. Use these advanced features as your user base grows.

**Keep it simple first, optimize later!** 🚀
