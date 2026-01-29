import express from "express";
import upload from "../Middlewares/fromMiddelware.js";

import {
  createClient,
  getClients,
  updateClient,
  deleteClient,
} from "../Controllers/fromController.js";

const router = express.Router();

// create client
router.post(
  "/",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "biometric", maxCount: 1 },
  ]),
  createClient,
);

router.get("/", getClients);
router.delete("/:id", deleteClient);
router.put(
  "/:id",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "biometric", maxCount: 1 },
  ]),

  updateClient,
);

export default router;
