import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true },
    fatherName: { type: String, required: true },
    fatherPhone: { type: String, required: true },
    gender: { type: String, required: true },
    dob: { type: Date, required: false },
    age: { type: Number, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    Nationality: { type: String, required: true },
    relationship: { 
      type: String, 
      required: true,
      enum: ["Married", "Unmarried"]
    },
    occupation: { type: String, required: false },
    photo: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("Client", clientSchema);
