import mongoose from "mongoose";

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("MongoDB connected successfully");
    } catch (err) {
        console.error("MongoDB error:", err.message);
    }
}

export default connectDB;