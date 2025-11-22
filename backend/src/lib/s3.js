const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-1';

let s3 = null;

function getS3Client() {
  if (!s3) {
    s3 = new S3Client({ region: REGION });
  }
  return s3;
}

async function uploadFileToS3(localFilePath, key, bucket) {
  const fileStream = fs.createReadStream(localFilePath);
  const contentType = mime.lookup(localFilePath) || 'application/octet-stream';

  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileStream,
    ContentType: contentType,
    ACL: 'public-read'
  });

  await client.send(command);
  return `https://${bucket}.s3.${REGION}.amazonaws.com/${encodeURI(key)}`;
}

module.exports = {
  uploadFileToS3,
};
