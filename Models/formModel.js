import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true },
    fatherName: { type: String, required: true },
    gender: { type: String, required: true },
    dob: { type: String , required: true },
    age: { type: Number, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true  },
    address: { type: String, required: true },
    country: { type: String, required: true },
    familyMembers: { type: Number, required: true  },

    photo: { type: String, required: true },
    biometric: { type: String, required: false },
  },
  { timestamps: true },
);

export default mongoose.model("Client", clientSchema);
