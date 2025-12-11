import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import aiRoutes from "./routes/aiRoutes";
import budgetRoutes from "./routes/budgetRoutes";
import recurringRoutes from "./routes/recurringRoutes";

dotenv.config();

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
app.use(cors({ origin: CLIENT_URL }));
app.use(helmet());
app.use(compression());
app.use(morgan("tiny"));
app.use(express.json());

if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET in environment");
  process.exit(1);
}

app.use("/api/auth", authRoutes);
app.use("/api", transactionRoutes);
app.use("/api", aiRoutes);
app.use("/api", budgetRoutes);
app.use("/api", recurringRoutes);

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
