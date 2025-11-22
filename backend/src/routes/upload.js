const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// Configure multer for file uploads
const getStorage = (subDir = '') => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = subDir ? `uploads/${subDir}/` : 'uploads/';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
};

const fileFilter = (req, file, cb) => {
  // Accept image files and documents (PDF, DOC, DOCX)
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) and documents (PDF, DOC, DOCX) are allowed'), false);
  }
};

// Default upload (for backward compatibility)
const upload = multer({
  storage: getStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for documents
  }
});

// Document upload (stores directly in documents directory)
const documentUpload = multer({
  storage: getStorage('documents'),
  fileFilter: (req, file, cb) => {
    // Only accept document files
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only document files (PDF, DOC, DOCX) are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for documents
  }
});

// Single image upload
const { uploadFileToS3 } = (() => {
  try {
    return require('../lib/s3');
  } catch (e) {
    return {};
  }
})();

// Single file upload (image or document)
router.post('/single', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    const localPath = req.file.path;
    const filename = req.file.filename;
    const isDocument = req.file.mimetype.includes('pdf') || req.file.mimetype.includes('msword') || req.file.mimetype.includes('wordprocessingml');

    // Determine upload directory based on file type
    const uploadSubDir = isDocument ? 'documents' : 'images';
    const uploadDir = `uploads/${uploadSubDir}/`;
    
    // Create subdirectory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Move file to appropriate subdirectory only if it's not already there
    const newPath = path.join(uploadDir, filename);
    if (localPath !== newPath) {
      fs.renameSync(localPath, newPath);
    }

    // If S3 environment is configured, upload to S3 and return S3 URL
    if (process.env.S3_BUCKET && uploadFileToS3) {
      try {
        const key = `uploads/${uploadSubDir}/${filename}`;
        const s3Url = await uploadFileToS3(newPath, key, process.env.S3_BUCKET);
        return res.json({
          success: true,
          message: isDocument ? 'Document uploaded successfully (S3)' : 'Image uploaded successfully (S3)',
          data: {
            url: s3Url,
            filename: filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype,
            type: isDocument ? 'document' : 'image'
          }
        });
      } catch (s3err) {
        console.error('S3 upload failed, falling back to local file:', s3err);
        // continue to return local URL
      }
    }

    const fileUrl = `/uploads/${uploadSubDir}/${filename}`;
    
    res.json({
      success: true,
      message: isDocument ? 'Document uploaded successfully' : 'Image uploaded successfully',
      data: {
        url: fileUrl,
        filename: filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        type: isDocument ? 'document' : 'image'
      }
    });
  } catch (error) {
    console.error('Single upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file'
    });
  }
});

// Multiple files upload (images or documents)
router.post('/multiple', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided'
      });
    }

    const results = [];
    for (const file of req.files) {
      const filename = file.filename;
      const localPath = file.path;
      const isDocument = file.mimetype.includes('pdf') || file.mimetype.includes('msword') || file.mimetype.includes('wordprocessingml');
      
      // Determine upload directory based on file type
      const uploadSubDir = isDocument ? 'documents' : 'images';
      const uploadDir = `uploads/${uploadSubDir}/`;
      
      // Create subdirectory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Move file to appropriate subdirectory only if it's not already there
      const newPath = path.join(uploadDir, filename);
      if (localPath !== newPath && fs.existsSync(localPath)) {
        fs.renameSync(localPath, newPath);
      }

      const finalPath = fs.existsSync(newPath) ? newPath : localPath;

      if (process.env.S3_BUCKET && uploadFileToS3) {
        try {
          const key = `uploads/${uploadSubDir}/${filename}`;
          const s3Url = await uploadFileToS3(finalPath, key, process.env.S3_BUCKET);
          results.push({ 
            url: s3Url, 
            filename, 
            originalName: file.originalname, 
            size: file.size,
            mimeType: file.mimetype,
            type: isDocument ? 'document' : 'image'
          });
          continue;
        } catch (s3err) {
          console.error('S3 upload failed for file', filename, s3err);
          // fallthrough to local
        }
      }

      results.push({ 
        url: `/uploads/${uploadSubDir}/${filename}`, 
        filename, 
        originalName: file.originalname, 
        size: file.size,
        mimeType: file.mimetype,
        type: isDocument ? 'document' : 'image'
      });
    }

    res.json({ 
      success: true, 
      message: 'Files uploaded successfully', 
      data: { files: results, count: results.length } 
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files'
    });
  }
});

// Document upload endpoint for registration (no auth required, but rate limited)
router.post('/documents/public', documentUpload.array('documents', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No document files provided'
      });
    }

    const results = [];
    for (const file of req.files) {
      const filename = file.filename;
      const localPath = file.path;

      if (process.env.S3_BUCKET && uploadFileToS3) {
        try {
          const key = `uploads/documents/${filename}`;
          const s3Url = await uploadFileToS3(localPath, key, process.env.S3_BUCKET);
          results.push({ 
            url: s3Url, 
            filename, 
            originalName: file.originalname, 
            size: file.size,
            mimeType: file.mimetype
          });
          continue;
        } catch (s3err) {
          console.error('S3 upload failed for document', filename, s3err);
        }
      }

      results.push({ 
        url: `/uploads/documents/${filename}`, 
        filename, 
        originalName: file.originalname, 
        size: file.size,
        mimeType: file.mimetype
      });
    }

    res.json({ 
      success: true, 
      message: 'Documents uploaded successfully', 
      data: { documents: results, count: results.length } 
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload documents'
    });
  }
});

// Document upload endpoint (specifically for organizer documents) - requires auth
router.post('/documents', authenticate, documentUpload.array('documents', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No document files provided'
      });
    }

    const results = [];
    for (const file of req.files) {
      const filename = file.filename;
      const localPath = file.path; // Already in uploads/documents/

      if (process.env.S3_BUCKET && uploadFileToS3) {
        try {
          const key = `uploads/documents/${filename}`;
          const s3Url = await uploadFileToS3(localPath, key, process.env.S3_BUCKET);
          results.push({ 
            url: s3Url, 
            filename, 
            originalName: file.originalname, 
            size: file.size,
            mimeType: file.mimetype
          });
          continue;
        } catch (s3err) {
          console.error('S3 upload failed for document', filename, s3err);
        }
      }

      results.push({ 
        url: `/uploads/documents/${filename}`, 
        filename, 
        originalName: file.originalname, 
        size: file.size,
        mimeType: file.mimetype
      });
    }

    res.json({ 
      success: true, 
      message: 'Documents uploaded successfully', 
      data: { documents: results, count: results.length } 
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload documents'
    });
  }
});

module.exports = router;