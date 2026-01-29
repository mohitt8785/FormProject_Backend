import Client from "../Models/formModel.js";
import cloudinary from "../Config/cloudinary.js";

// Helper function to upload to Cloudinary
const uploadSingleFile = async (file, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      },
    );

    uploadStream.end(file.buffer);
  });
};

export const createClient = async (req, res) => {
  try {
    console.log("📥 Received files:", req.files);
    console.log("📝 Received body:", req.body);

    // Validate photo
    if (!req.files || !req.files.photo || !req.files.photo[0]) {
      return res.status(400).json({
        success: false,
        message: "Photo is required ❌",
      });
    }

    // Upload photo to Cloudinary
    const photoUrl = await uploadSingleFile(
      req.files.photo[0],
      "growth-clients/photos",
    );

    // Upload biometric if exists
    let biometricUrl = null;
    if (req.files.biometric && req.files.biometric[0]) {
      biometricUrl = await uploadSingleFile(
        req.files.biometric[0],
        "growth-clients/biometrics",
      );
    }

    // Clean data
    const { photo, biometric, ...clientData } = req.body;

    const finalData = {
      ...clientData,
      photo: photoUrl,
      biometric: biometricUrl,
    };

    console.log("✅ Creating client with data:", finalData);

    const client = await Client.create(finalData);

    res.status(201).json({
      success: true,
      message: "Client saved successfully ✅",
      client,
    });
  } catch (error) {
    console.error("❌ Create client error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;

    const { photo, biometric, _id, createdAt, updatedAt, __v, ...updateData } =
      req.body;

    console.log("📝 Update request for:", id);
    console.log("📥 Files received:", req.files);

    // Upload new photo if provided
    if (req.files && req.files.photo && req.files.photo[0]) {
      const photoUrl = await uploadSingleFile(
        req.files.photo[0],
        "growth-clients/photos",
      );
      updateData.photo = photoUrl;
      console.log("✅ New photo uploaded:", photoUrl);
    }

    // Upload new biometric if provided
    if (req.files && req.files.biometric && req.files.biometric[0]) {
      const biometricUrl = await uploadSingleFile(
        req.files.biometric[0],
        "growth-clients/biometrics",
      );
      updateData.biometric = biometricUrl;
      console.log("✅ New biometric uploaded:", biometricUrl);
    }

    console.log("🔄 Updating with data:", updateData);

    const updatedClient = await Client.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedClient) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Client updated successfully ✅",
      client: updatedClient,
    });
  } catch (error) {
    console.error("❌ Update client error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedClient = await Client.findByIdAndDelete(id);

    if (!deletedClient) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Optional: Delete from Cloudinary
    // You can extract public_id from URL and delete

    res.status(200).json({
      success: true,
      message: "Client deleted successfully ✅",
      client: deletedClient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
