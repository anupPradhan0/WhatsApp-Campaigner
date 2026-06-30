import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Cb = multer.FileFilterCallback;

const storage = multer.diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    const destinationPath = path.join(__dirname, "..", "..", "public", "uploads");
    cb(null, destinationPath);
  },

  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: Cb
): void => {
  const allowedMimeTypes = [
    // images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    // video
    "video/mp4",
    "video/quicktime",
    "video/webm",
    // documents
    "application/pdf",
  ];

  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|mp4|mov|webm|pdf)$/i;

  const fileExtension = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  const isValidMimeType = allowedMimeTypes.includes(mimeType);
  const isValidExtension = allowedExtensions.test(fileExtension);

  if (isValidMimeType && isValidExtension) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Allowed: images (JPG, PNG, GIF, WebP), video (MP4, MOV, WebM), and PDF."
      )
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
    files: 2,
  },
  fileFilter,
});

export function multerErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size too large. Maximum size is 5MB.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "You can only upload one file at a time.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected field name.",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  if (err instanceof Error) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error.",
    });
  }
  next();
}

export function getFileTypeCategory(
  mimetype: string
): "image" | "video" | "pdf" | null {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype === "application/pdf") return "pdf";
  return null;
}

export { upload };
export default upload;
