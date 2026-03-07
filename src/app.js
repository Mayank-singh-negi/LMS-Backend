import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import v1Routes from "./routes/v1.routes.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// IMPORTANT
app.use("/api/v1", v1Routes);

app.get("/", (req, res) => {
  res.json({ message: "E-Learning Backend API Running 🚀" });
});

export default app;
