import express from "express";
import { requestOTP, verifyOTP, handleLogout } from "../Controllers/userController.js";

const router = express.Router();

// OTP-based authentication routes
router.post("/request-otp", requestOTP);  // Step 1: Send OTP
router.post("/verify-otp", verifyOTP);    // Step 2: Verify OTP & Login
router.post("/logout", handleLogout);

export default router;