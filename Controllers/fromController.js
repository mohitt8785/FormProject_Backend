import Client from "../Models/formModel.js";

export const createClient = async (req, res) => {
  try {
    // ✅ Photo validation
    if (!req.files || !req.files.photo) {
      return res.status(400).json({
        success: false,
        message: "Photo is required ❌",
      });
    }

    // ✅ req.body se photo aur biometric fields remove karo
    const { photo, biometric, ...clientData } = req.body;

    // ✅ Clean data with file paths
    const finalData = {
      ...clientData,
      photo: req.files.photo[0].path,  // File ka path
      biometric: req.files.biometric ? req.files.biometric[0].path : null,
    };

    console.log("Creating client with data:", finalData);

    const client = await Client.create(finalData);

    res.status(201).json({
      success: true,
      message: "Client saved successfully ✅",
      client,
    });
  } catch (error) {
    console.error("Create client error:", error);
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
    
    // ✅ req.body se photo aur biometric remove karo
    const { photo, biometric, _id, createdAt, updatedAt, __v, ...updateData } = req.body;
    
    // ✅ Agar naye files upload hui hain
    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        updateData.photo = req.files.photo[0].path;
      }
      if (req.files.biometric && req.files.biometric[0]) {
        updateData.biometric = req.files.biometric[0].path;
      }
    }
    
    console.log("Updating client with data:", updateData);
    
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
    console.error("Update client error:", error);
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