import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import aiRoutes from "./routes/aiRoutes";
import budgetRoutes from "./routes/budgetRoutes";
import recurringRoutes from "./routes/recurringRoutes";

const app = express();
const origins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : undefined;
app.use(cors({ origin: origins ?? true }));
app.use(helmet());
app.use(compression());
app.use(morgan("tiny"));
app.use(express.json({ limit: "1mb" }));

if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET in environment");
}

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

app.use("/api/auth", authRoutes);
app.use("/api", transactionRoutes);
app.use("/api", aiRoutes);
app.use("/api", budgetRoutes);
app.use("/api", recurringRoutes);

export default app;
