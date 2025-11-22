/*
  Simple migration script to upload local files in backend/uploads to S3 and optionally
  print mapping so you can update DB entries.

  Usage:
    AWS_REGION=ap-southeast-1 AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... S3_BUCKET=your-bucket node scripts/migrate-uploads-to-s3.js
*/

const fs = require('fs');
const path = require('path');
const { uploadFileToS3 } = require('../src/lib/s3');

const uploadsDir = path.join(__dirname, '..', 'uploads');

async function walkAndUpload(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkAndUpload(fullPath);
    } else if (entry.isFile()) {
      const relativeKey = path.relative(uploadsDir, fullPath).replace(/\\\\/g, '/');
      const s3Key = `uploads/${relativeKey}`;
      console.log('Uploading', fullPath, 'as', s3Key);
      try {
        const url = await uploadFileToS3(fullPath, s3Key, process.env.S3_BUCKET);
        console.log('Uploaded =>', url);
      } catch (e) {
        console.error('Failed:', fullPath, e);
      }
    }
  }
}

(async () => {
  if (!process.env.S3_BUCKET) {
    console.error('S3_BUCKET not set');
    process.exit(1);
  }
  if (!fs.existsSync(uploadsDir)) {
    console.error('uploads dir not found:', uploadsDir);
    process.exit(1);
  }
  await walkAndUpload(uploadsDir);
  console.log('Done');
})();
