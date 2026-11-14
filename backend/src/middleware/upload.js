// Profile picture upload (multipart/form-data), using Multer.
// Runs after auth and before the validators, because Multer is what fills req.body
// with the text fields of a multipart form. JSON requests pass straight through.
//
// Safety rules:
// - only JPEG, PNG and WebP, max UPLOAD_MAX_MB, exactly one file in the "profile_picture" field
// - the file name is a random UUID + an extension chosen by us (never the user's file name)
// - after saving, the first bytes of the file are checked, so a renamed .exe/.html
//   with a fake "image/png" type is rejected
// - if the request fails at any later point, the error handler deletes the file
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const config = require('../config/env');
const AppError = require('../utils/AppError');

// Allowed types -> the extension we give the saved file.
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const WRONG_TYPE_MESSAGE = 'Profile picture must be a JPEG, PNG or WebP image';
const ONE_FILE_MESSAGE = "Only one file, in the field 'profile_picture', is allowed";

// Make sure the folder exists before Multer tries to write into it.
fs.mkdirSync(config.uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: config.uploadsDir,
  filename: (req, file, cb) => {
    // A random name means no clashes, no guessing, and no path tricks like "../../x".
    cb(null, `${crypto.randomUUID()}${ALLOWED_TYPES[file.mimetype]}`);
  },
});

// First check: the type the client declared. (Easy to fake, hence the byte check below.)
function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES[file.mimetype]) return cb(null, true);
  cb(new AppError(WRONG_TYPE_MESSAGE, 400));
}

const multerSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.uploadMaxMb * 1024 * 1024, // bytes
    files: 1,
    fields: 10, // the employee form has 7 text fields
    fieldSize: 1024, // max bytes per text field (our longest field, email, is 254)
    fieldNameSize: 100,
  },
}).single('profile_picture');

// Second check: the "magic bytes" at the start of the file must match the declared type.
// These signatures are fixed by each image format's specification.
function matchesSignature(header, mimetype) {
  const startsWith = (bytes, offset = 0) => bytes.every((b, i) => header[offset + i] === b);

  if (mimetype === 'image/jpeg') return startsWith([0xff, 0xd8, 0xff]);
  if (mimetype === 'image/png') return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (mimetype === 'image/webp') {
    // "RIFF" + 4 bytes of file size + "WEBP"
    return startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8);
  }
  return false;
}

async function readFileHeader(filePath) {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const header = Buffer.alloc(12);
    await handle.read(header, 0, 12, 0);
    return header;
  } finally {
    await handle.close();
  }
}

// Turns Multer's error codes into friendly 400 messages in our standard error shape.
function toAppError(err) {
  if (err instanceof AppError) return err; // e.g. the wrong-type error from fileFilter

  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return new AppError(`Profile picture must be ${config.uploadMaxMb} MB or smaller`, 400);
      case 'LIMIT_FILE_COUNT':
      case 'LIMIT_UNEXPECTED_FILE':
        return new AppError(ONE_FILE_MESSAGE, 400);
      default:
        // Too many fields, a field that is too long, etc.
        return new AppError('The form data is too large or has too many fields', 400);
    }
  }

  // Broken multipart body (e.g. the upload was cut off halfway).
  return new AppError('Malformed multipart form data', 400);
}

function uploadProfilePicture(req, res, next) {
  multerSingle(req, res, async (err) => {
    // If Multer fails it removes any partly written file itself.
    if (err) return next(toAppError(err));

    // No file sent: nothing to check (the picture is optional).
    if (!req.file) return next();

    try {
      const header = await readFileHeader(req.file.path);
      if (!matchesSignature(header, req.file.mimetype)) {
        // The error handler sees req.file and deletes the saved file.
        return next(new AppError(WRONG_TYPE_MESSAGE, 400));
      }
      next();
    } catch (readErr) {
      next(readErr);
    }
  });
}

module.exports = uploadProfilePicture;
