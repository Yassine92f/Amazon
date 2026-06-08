import path from 'path';
import crypto from 'crypto';
import { Router, type IRouter, type Request } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth';
import { AppError } from '../middlewares/errorHandler';

// Where uploaded files land on disk. Served statically from app.ts.
export const UPLOADS_DIR = path.resolve(__dirname, '../../../../uploads');

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }, // 5MB per file
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) cb(null, true);
    else cb(new AppError(400, 'Unsupported file type. Use JPEG, PNG, WebP, GIF or AVIF.'));
  },
});

const router: IRouter = Router();

// Absolute URL so the image resolves from the client (served on a different port).
function fileUrl(req: Request, filename: string): string {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

// POST /api/uploads — single image, field name "file".
router.post('/', authenticate, upload.single('file'), (req, res, next) => {
  if (!req.file) return next(new AppError(400, 'No file uploaded'));
  res.status(201).json({ success: true, data: { url: fileUrl(req, req.file.filename) } });
});

// POST /api/uploads/multiple — several images, field name "files".
router.post('/multiple', authenticate, upload.array('files', 10), (req, res, next) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) return next(new AppError(400, 'No files uploaded'));
  res.status(201).json({ success: true, data: { urls: files.map((f) => fileUrl(req, f.filename)) } });
});

export default router;
