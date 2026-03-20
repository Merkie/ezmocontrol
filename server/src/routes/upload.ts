import { Router } from "express";
import multer from "multer";
import { getFalClient } from "../lib/fal";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

export const uploadRouter = Router();

uploadRouter.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const apiKey = req.headers["x-fal-key"] as string;
    if (!apiKey) {
      res.status(401).json({ error: "Missing FAL API key" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    const fal = getFalClient(apiKey);
    const uint8 = new Uint8Array(file.buffer);
    const blob = new File([uint8], file.originalname, {
      type: file.mimetype,
    });
    const url = await fal.storage.upload(blob);

    res.json({ url });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(error.status || 500).json({
      error: error.message || "Upload failed",
    });
  }
});
