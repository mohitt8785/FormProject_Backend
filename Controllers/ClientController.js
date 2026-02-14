import Client from "../Models/ClientModel.js";
import cloudinary from "../Config/cloudinary.js";
import fs from "fs";

/* =========================
   Helper: Upload to Cloudinary + Remove Temp File
========================= */
const uploadToCloudinary = async (filePath, folderName) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: folderName,
  });

  // remove temp file after upload
  fs.unlinkSync(filePath);

  return result.secure_url;
};

const extractCloudinaryPublicId = (assetUrl) => {
  try {
    if (!assetUrl || typeof assetUrl !== "string") return null;
    const url = new URL(assetUrl);
    const uploadMarker = "/upload/";
    const uploadIndex = url.pathname.indexOf(uploadMarker);
    if (uploadIndex === -1) return null;

    let publicPath = url.pathname.slice(uploadIndex + uploadMarker.length);
    // Strip optional version segment: v123456789/
    publicPath = publicPath.replace(/^v\d+\//, "");
    // Strip extension
    publicPath = publicPath.replace(/\.[^/.]+$/, "");

    return publicPath || null;
  } catch {
    return null;
  }
};

const deleteFromCloudinary = async (assetUrl) => {
  const publicId = extractCloudinaryPublicId(assetUrl);
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("⚠️ Cloudinary delete failed:", error.message);
  }
};

/* =========================
   CREATE CLIENT
========================= */
export const createClient = async (req, res) => {
  try {
    const body = req.body;

    console.log("📥 Incoming Body:", body);
    console.log("📁 Files Received:", req.files);

    /* =========================
       REQUIRED FIELDS
    ========================= */
    const requiredFields = [
      "clientName",
      "surname",
      "contact",
      "gender",
      "maritalStatus",
      "nationality",
      "aadhaarCardNo",
      "panCardNo",
      "fatherName",
      "fatherSurname",
      "fatherPhone",
      "motherName",
      "motherSurname",
      "motherPhone",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required ❌`,
        });
      }
    }

    /* =========================
       PHOTO REQUIRED
    ========================= */
    if (!req.files?.photo?.[0]) {
      return res.status(400).json({
        success: false,
        message: "Live photo is required ❌",
      });
    }

    /* =========================
       UPLOAD PHOTO TO CLOUDINARY
    ========================= */
    const photoUrl = await uploadToCloudinary(
      req.files.photo[0].path,
      "clients/photos",
    );

    /* =========================
       BUILD CLIENT DATA
    ========================= */
    let clientData = {
      ...body,
      photo: photoUrl,
      photoCapturedAt: new Date(),
      familyMembersCount: Number(body.familyMembersCount) || 0,
    };

    /* =========================
       DOCUMENTS (OPTIONAL)
    ========================= */
    clientData.documents = [];

    if (req.files?.documents && body.documents) {
      const documentsMeta =
        typeof body.documents === "string"
          ? JSON.parse(body.documents)
          : body.documents;

      for (let i = 0; i < req.files.documents.length; i++) {
        const docFile = req.files.documents[i];

        const docUrl = await uploadToCloudinary(
          docFile.path,
          "clients/documents",
        );

        clientData.documents.push({
          documentType: documentsMeta[i]?.documentType || "Other",
          imageUrl: docUrl,
        });
      }
    }

    /* =========================
       BIOMETRICS (OPTIONAL)
    ========================= */
    clientData.biometricData = [];

    if (req.files?.biometrics && body.biometricData) {
      const biometricMeta =
        typeof body.biometricData === "string"
          ? JSON.parse(body.biometricData)
          : body.biometricData;

      for (let i = 0; i < req.files.biometrics.length; i++) {
        const bioFile = req.files.biometrics[i];

        const bioUrl = await uploadToCloudinary(
          bioFile.path,
          "clients/biometrics",
        );

        clientData.biometricData.push({
          fingerType: biometricMeta[i]?.fingerType || "Unknown",
          fingerprintUrl: bioUrl,
          quality: biometricMeta[i]?.quality || 0,
        });
      }
    }

    /* =========================
       SAVE CLIENT
    ========================= */
    const client = await Client.create(clientData);

    res.status(201).json({
      success: true,
      message: "Client registered successfully ✅",
      client,
    });
  } catch (error) {
    console.error("❌ Create Client Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   GET ALL CLIENTS
========================= */
export const getClients = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 100 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.registrationStatus = status;

    if (search) {
      query.$or = [
        { clientName: { $regex: search, $options: "i" } },
        { surname: { $regex: search, $options: "i" } },
        { contact: { $regex: search, $options: "i" } },
        { nationality: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Client.countDocuments(query);

    const clients = await Client.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      clients,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Get Clients Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   GET CLIENT BY ID
========================= */
export const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found ❌",
      });
    }

    res.status(200).json({
      success: true,
      client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   UPDATE CLIENT
========================= */
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const existingClient = await Client.findById(id);

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: "Client not found ❌",
      });
    }

    let updateData = { ...body };

    // 🚫 biometric abhi disable hai
    delete updateData.biometricData;

    /* =========================
       UPDATE PHOTO
    ========================= */
    if (req.files?.photo?.[0]) {
      const previousPhoto = existingClient.photo;
      const photoUrl = await uploadToCloudinary(
        req.files.photo[0].path,
        "clients/photos",
      );

      updateData.photo = photoUrl;
      updateData.photoCapturedAt = new Date();

      if (previousPhoto && previousPhoto !== photoUrl) {
        await deleteFromCloudinary(previousPhoto);
      }
    }

    /* =========================
       UPDATE DOCUMENTS
    ========================= */
    if (body.documents) {
      const documentsMeta =
        typeof body.documents === "string"
          ? JSON.parse(body.documents)
          : body.documents;
      const normalizedDocumentsMeta = Array.isArray(documentsMeta)
        ? documentsMeta
        : [documentsMeta];

      const uploadedDocuments = req.files?.documents || [];
      const documentsByType = new Map();

      // Start from current DB documents to prevent accidental data loss on partial payloads.
      existingClient.documents?.forEach((doc) => {
        if (doc?.documentType && doc?.imageUrl) {
          documentsByType.set(doc.documentType, {
            documentType: doc.documentType,
            imageUrl: doc.imageUrl,
          });
        }
      });

      for (const documentMeta of normalizedDocumentsMeta) {
        const documentType = documentMeta?.documentType || "Other";
        const uploadIndex = Number(documentMeta?.uploadIndex);
        const hasUpload =
          Number.isInteger(uploadIndex) &&
          uploadIndex >= 0 &&
          uploadIndex < uploadedDocuments.length;

        if (hasUpload) {
          const previousDocument = documentsByType.get(documentType);
          const docUrl = await uploadToCloudinary(
            uploadedDocuments[uploadIndex].path,
            "clients/documents",
          );

          documentsByType.set(documentType, {
            documentType,
            imageUrl: docUrl,
          });

          if (
            previousDocument?.imageUrl &&
            previousDocument.imageUrl !== docUrl
          ) {
            await deleteFromCloudinary(previousDocument.imageUrl);
          }
          continue;
        }

        if (documentMeta?.imageUrl) {
          documentsByType.set(documentType, {
            documentType,
            imageUrl: documentMeta.imageUrl,
          });
        }
      }

      updateData.documents = Array.from(documentsByType.values());
    }

    /* =========================
       UPDATE BIOMETRICS
    ========================= */
    if (req.files?.biometrics && body.biometricData) {
      const biometricMeta = JSON.parse(body.biometricData);

      updateData.biometricData = [];

      for (let i = 0; i < req.files.biometrics.length; i++) {
        const bioUrl = await uploadToCloudinary(
          req.files.biometrics[i].path,
          "clients/biometrics",
        );

        updateData.biometricData.push({
          fingerType: biometricMeta[i]?.fingerType || "Unknown",
          fingerprintUrl: bioUrl,
          quality: biometricMeta[i]?.quality || 0,
        });
      }
    }

    updateData.familyMembersCount = Number(body.familyMembersCount) || 0;

    const updatedClient = await Client.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Client updated successfully ✅",
      client: updatedClient,
    });
  } catch (error) {
    console.error("❌ Update Client Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   UPDATE CLIENT STATUS
========================= */
export const updateClientStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { registrationStatus, remarks } = req.body;

    if (!registrationStatus) {
      return res.status(400).json({
        success: false,
        message: "registrationStatus is required ❌",
      });
    }

    const client = await Client.findByIdAndUpdate(
      id,
      { registrationStatus, remarks },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "Client status updated successfully ✅",
      client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   DELETE CLIENT
========================= */
export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found ❌",
      });
    }

    res.status(200).json({
      success: true,
      message: "Client deleted successfully ✅",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   CLIENT STATS
========================= */
export const getClientStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const data = {
      total: await Client.countDocuments(),
      today: await Client.countDocuments({
        createdAt: { $gte: todayStart, $lt: tomorrowStart },
      }),
      pending: await Client.countDocuments({ registrationStatus: "Pending" }),
      completed: await Client.countDocuments({
        registrationStatus: "Completed",
      }),
      rejected: await Client.countDocuments({ registrationStatus: "Rejected" }),
    };

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
