import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./Config/ConnectDB.js";
import userRoutes from "./routes/userRoute.js";
import formRoutes from "./routes/formRoute.js";

dotenv.config();

// ✅ DEBUG: Check if .env is loading
console.log("🔍 Environment Variables Check:");
console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ Loaded" : "❌ Missing");
console.log("PORT:", process.env.PORT);

const app = express();

// ✅ __dirname for ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://growthclient.netlify.app",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// DB
connectDB();

app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

// routes
app.use("/api/user", userRoutes);
app.use("/api/clients", formRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});