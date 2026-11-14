// Small helpers for profile picture files in the uploads folder.
const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const logger = require('./logger');

// URL path stored in MongoDB and used by the browser, e.g. "/uploads/<uuid>.png".
function toPublicPath(filename) {
  return `/uploads/${filename}`;
}

// Deletes an uploaded file. Accepts a stored public path ("/uploads/x.png")
// or a full disk path (req.file.path from Multer).
//
// Path-traversal safety: path.basename() keeps only the last part of the path, so even a
// value like "/uploads/../../server.js" becomes "server.js", and we then always join it
// with OUR uploads folder. A file outside that folder can never be deleted.
async function deleteUpload(storedPath) {
  if (!storedPath) return;

  const filename = path.basename(storedPath);
  if (!filename || filename.startsWith('.')) return; // never touch .gitkeep or other hidden files

  try {
    await fs.promises.unlink(path.join(config.uploadsDir, filename));
  } catch (err) {
    // Already gone is fine (that's what we wanted). Anything else is logged, not thrown:
    // a leftover file must not turn a successful request into an error.
    if (err.code !== 'ENOENT') {
      logger.warn('Could not delete uploaded file', { filename, error: err.message });
    }
  }
}

module.exports = { toPublicPath, deleteUpload };
