import Client from "../Models/formModel.js";

export const createClient = async (req, res) => {
  try {
    const clientData = {
      ...req.body,
      photo: req.files.photo,
      // 🟢 Biometric optional - agar hai toh save karo, nahi toh skip
      biometric: req.files.biometric ? req.files.biometric[0].path : null,
    };

    const client = await Client.create(clientData);

    res.status(201).json({
      success: true,
      message: "Client saved successfully ✅",
      client,
    });
  } catch (error) {
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

    const updateData = { ...req.body };

    // ✅ Only agar NEW files upload hui hain
    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        updateData.photo = req.files.photo[0].path;
        console.log("✅ New photo uploaded:", req.files.photo[0].path);
      }
      if (req.files.biometric && req.files.biometric[0]) {
        updateData.biometric = req.files.biometric[0].path;
      }
    }

    // ✅ Remove photo from updateData if it's a string (old path)
    if (
      typeof updateData.photo === "string" &&
      updateData.photo.includes("uploads/")
    ) {
      delete updateData.photo;
      console.log("⏭️ Skipping photo - keeping existing");
    }

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
    console.error("Update error:", error);
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
