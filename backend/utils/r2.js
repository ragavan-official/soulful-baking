import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'coursevideo';

if (!accessKeyId || !secretAccessKey || !endpoint) {
  console.warn('Warning: Cloudflare R2 credentials are not fully configured in environment variables.');
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

export const R2_BUCKET_NAME = bucketName;
