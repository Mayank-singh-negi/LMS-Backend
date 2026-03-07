import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Rate limiter for general AI endpoints (doubt solver, etc.)
 * Limits: 30 requests per 15 minutes per IP
 * Prevents abuse and excessive API costs
 */
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: {
    success: false,
    message: "Too many requests to AI service, please try again later",
  },
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users (optional)
    return req.user?.role === "admin";
  },
  // Use user ID if authenticated, otherwise use IP (with proper IPv6 handling)
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
  max: 10, // 10 requests per hour per user
  message: {
    success: false,
    message:
      "Quiz generation limit reached. Maximum 10 quizzes per hour. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID as key (with proper IPv6 handling for non-authenticated requests)
  keyGenerator: (req) => {
    return req.user?.id || ipKeyGenerator(req);
  },
  // Skip for admin users
  skip: (req) => {
    return req.user?.role === "admin";
  },
});

export default {
  aiRateLimiter,
  aiStrictRateLimiter,
};
