import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Rate limiter for general AI endpoints (doubt solver, etc.)
 * Limits: 30 requests per 15 minutes per IP
 * Prevents abuse and excessive API costs
 */
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests to AI service, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => true, // no rate limit in development
  keyGenerator: (req) => {
    return req.user?.id || ipKeyGenerator(req);
  },
});

/**
 * Stricter rate limiter for cost-intensive operations
 * (Quiz generation, etc.)
 * Limits: 10 requests per hour per user
 */
export const aiStrictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // increased for development
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || ipKeyGenerator(req);
  },
  skip: (req) => {
    return req.user?.role === "admin" || req.user?.role === "teacher";
  },
});


