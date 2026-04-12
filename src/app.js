import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import v1Routes from "./routes/v1.routes.js";

const app = express();

app.use((req, res, next) => {
  if (req.headers['content-type']?.startsWith('multipart/form-data')) return next();
  express.json({ limit: "500mb" })(req, res, next);
});
app.use((req, res, next) => {
  if (req.headers['content-type']?.startsWith('multipart/form-data')) return next();
  express.urlencoded({ extended: true, limit: "500mb" })(req, res, next);
});
const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = [
      /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/,
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.onrender\.com$/,
    ];
    if (allowed.some(r => r.test(origin))) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
app.use(morgan("dev"));

// IMPORTANT
app.use("/api/v1", v1Routes);

app.get("/", (req, res) => {
  res.json({ message: "E-Learning Backend API Running 🚀" });
});

// Global error handler — always returns JSON
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";
  console.error(`[ERROR] ${req.method} ${req.path} →`, message);
  res.status(status).json({ message });
});

export default app;
