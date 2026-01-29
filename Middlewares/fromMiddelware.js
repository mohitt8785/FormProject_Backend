import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../Config/cloudinary.js";

// Cloudinary storage for photos
const photoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "growth-clients/photos",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  },
});

// Cloudinary storage for biometrics
const biometricStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "growth-clients/biometrics",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
  },
});

const upload = multer({
  storage: multer.memoryStorage(), // Temporary memory storage
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Custom upload function
export const uploadToCloudinary = {
  photo: multer({ storage: photoStorage }),
  biometric: multer({ storage: biometricStorage }),
};

export default upload;
