import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path"; // ✅ FIX
import { fileURLToPath } from "url";

import connectDB from "./Config/ConnectDB.js";
import userRoutes from "./routes/userRoute.js";
import formRoutes from "./routes/formRoute.js";

dotenv.config();

const app = express();

// ✅ __dirname for ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// middleware
app.use(cors());
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

//  5. 404 Handler (optional but good practice)
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
