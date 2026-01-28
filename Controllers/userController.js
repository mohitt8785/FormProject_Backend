import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../Models/userModel.js";

export const handleSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).json({ message: "User registered", token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const handleLogin = async (req, res) => {
  try {
    console.log("req.body", req.body);

    const { email, password } = req.body;

    console.log("email:", email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and Password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.log("LOGIN ERROR:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

export const handleLogout = async (req, res) => {
  try {
    // JWT is stateless, so logout is handled client-side by removing the token
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
