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
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));

// IMPORTANT
app.use("/api/v1", v1Routes);

app.get("/", (req, res) => {
  res.json({ message: "E-Learning Backend API Running 🚀" });
});

export default app;
