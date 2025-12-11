import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import aiRoutes from "./routes/aiRoutes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", transactionRoutes);
app.use("/api", aiRoutes);

const port = 3001;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
