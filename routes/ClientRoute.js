import express from "express";
import upload, { multerErrorHandler } from "../Middlewares/ClientMiddelware.js";

import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientStats,
  updateClientStatus
} from "../Controllers/ClientController.js";

const router = express.Router();

/* ===============================
   CLIENT STATISTICS (STATIC FIRST)
================================ */
router.get("/stats/overview", getClientStats);

/* ===============================
   CLIENT CRUD
================================ */

// CREATE CLIENT
router.post(
  "/",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "documents", maxCount: 20 },
    { name: "biometrics", maxCount: 10 }
  ]),
  multerErrorHandler,
  createClient
);

// GET ALL CLIENTS
router.get("/", getClients);

// GET CLIENT BY ID
router.get("/:id", getClientById);

// UPDATE CLIENT
router.put(
  "/:id",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "documents", maxCount: 20 },
    { name: "biometrics", maxCount: 10 }
  ]),
  multerErrorHandler,
  updateClient
);

// UPDATE CLIENT STATUS
router.patch("/:id/status", updateClientStatus);

// DELETE CLIENT
router.delete("/:id", deleteClient);

export default router;
