const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-random-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
    }
});

// File filter - only PDF
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    }
});

class UploadService {
    /**
     * Upload multiple PDF documents
     * @param {Array} files - Array of uploaded files from multer
     * @returns {Array} Array of document objects with url and filename
     */
    uploadDocuments(files) {
        try {
            if (!files || files.length === 0) {
                throw new Error('No files provided');
            }

            const documents = files.map(file => ({
                filename: file.filename,
                originalName: file.originalname,
                url: `/uploads/documents/${file.filename}`,
                size: file.size,
                uploadedAt: new Date()
            }));

            logger.info(`Uploaded ${documents.length} document(s)`);
            return documents;
        } catch (error) {
            logger.error('Error in uploadDocuments:', error);
            throw error;
        }
    }

    /**
     * Delete a document file
     * @param {string} filename - Filename to delete
     */
    deleteDocument(filename) {
        try {
            const filePath = path.join(uploadDir, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                logger.info(`Deleted document: ${filename}`);
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Error deleting document:', error);
            throw error;
        }
    }

    /**
     * Get multer upload middleware
     */
    getUploadMiddleware() {
        return upload;
    }
}

module.exports = new UploadService();
