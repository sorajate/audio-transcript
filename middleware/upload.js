const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
fs.ensureDirSync(uploadsDir);

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = path.parse(file.originalname).name;
    const extension = path.extname(file.originalname);
    cb(null, `${originalName}-${uniqueSuffix}${extension}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed MIME types for audio and video files
  const allowedMimes = [
    'audio/wav',
    'audio/wave', 
    'audio/x-wav',
    'audio/mpeg',
    'audio/mp3',
    'video/mp4',
    'audio/mp4',
    'audio/m4a'
  ];

  // Check if the uploaded file type is allowed
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`Unsupported file type: ${file.mimetype}. Allowed types: wav, mp3, mp4`);
    error.code = 'UNSUPPORTED_FILE_TYPE';
    cb(error, false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
    files: 1 // Only allow 1 file at a time
  }
});

// Middleware function to handle single file upload
const uploadMiddleware = upload.single('audio');

// Enhanced middleware with error handling
const uploadWithErrorHandling = (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      // Handle different types of multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File too large. Maximum size allowed is 200MB.',
          code: 'FILE_TOO_LARGE'
        });
      }
      
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          error: 'Too many files. Only one file is allowed per request.',
          code: 'TOO_MANY_FILES'
        });
      }
      
      if (err.code === 'UNSUPPORTED_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          error: err.message,
          code: 'UNSUPPORTED_FILE_TYPE'
        });
      }
      
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          error: 'Unexpected field name. Please use "audio" as the field name.',
          code: 'UNEXPECTED_FIELD'
        });
      }
      
      // Handle other multer errors
      return res.status(400).json({
        success: false,
        error: 'File upload error: ' + err.message,
        code: 'UPLOAD_ERROR'
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please select an audio file.',
        code: 'NO_FILE'
      });
    }
    
    // File uploaded successfully, continue to next middleware
    next();
  });
};

// Cleanup function to remove uploaded files
const cleanupFile = async (filePath) => {
  try {
    if (filePath && await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      console.log(`Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error cleaning up file ${filePath}:`, error);
  }
};

module.exports = {
  uploadWithErrorHandling,
  cleanupFile,
  uploadsDir
}; 