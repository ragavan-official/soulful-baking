import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { authenticateToken } from '../middleware/auth.js';
import { r2Client, R2_BUCKET_NAME } from '../utils/r2.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

let bucket;
const getBucket = () => {
  if (!bucket) {
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'media'
    });
  }
  return bucket;
};

// @route   POST /api/media/upload
// @desc    Upload a file (image/video) to Cloudflare R2
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Determine target folder prefix
    const folder = req.file.mimetype.startsWith('video/') ? 'video/' : 'photo/';
    
    // Generate unique key
    const fileExtension = req.file.originalname.split('.').pop() || '';
    const uniqueId = crypto.randomUUID();
    const key = `${folder}${uniqueId}${fileExtension ? '.' + fileExtension : ''}`;

    const uploadParams = {
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    };

    console.log(`Uploading file to R2: Bucket=${R2_BUCKET_NAME}, Key=${key}, Mime=${req.file.mimetype}`);
    await r2Client.send(new PutObjectCommand(uploadParams));
    console.log(`R2 Upload Success: Key=${key}`);

    // Build a dynamic base URL from the incoming request so it works on both
    // localhost and the deployed server without needing any env var.
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({
      fileId: key,
      url: `${baseUrl}/api/media/${key}`
    });
  } catch (error) {
    console.error('R2 Upload handler error:', error);
    res.status(500).json({ message: 'Server error during file upload to Cloudflare R2' });
  }
});

// @route   GET /api/media/:key(*)
// @desc    Retrieve/Stream media from R2 (supports HTTP range requests for videos), fallback to GridFS
router.get('/:key(*)', async (req, res) => {
  const key = req.params.key;

  // 1. If it looks like an R2 key (starts with 'photo/' or 'video/', or contains a slash)
  if (key.includes('/')) {
    try {
      const getObjectParams = {
        Bucket: R2_BUCKET_NAME,
        Key: key
      };

      const range = req.headers.range;
      if (range) {
        getObjectParams.Range = range;
      }

      const s3Response = await r2Client.send(new GetObjectCommand(getObjectParams));

      // Copy headers from S3/R2 response to Express response
      res.setHeader('Content-Type', s3Response.ContentType || 'application/octet-stream');
      
      if (s3Response.ContentLength) {
        res.setHeader('Content-Length', s3Response.ContentLength);
      }
      
      if (s3Response.ContentRange) {
        res.setHeader('Content-Range', s3Response.ContentRange);
        res.status(206);
      } else {
        res.status(200);
      }

      if (s3Response.AcceptRanges) {
        res.setHeader('Accept-Ranges', s3Response.AcceptRanges);
      }

      // Pipe the stream to express response
      s3Response.Body.pipe(res);
      return;
    } catch (err) {
      if (err.name === 'NoSuchKey' || err.name === 'NotFound') {
        console.error(`File not found in R2: Key=${key}`);
        return res.status(404).json({ message: 'File not found in storage' });
      }
      console.error(`Error fetching file from R2: Key=${key}`, err);
      return res.status(500).json({ message: 'Error retrieving file from Cloudflare R2' });
    }
  }

  // 2. Legacy fallback: GridFS for standard ObjectID media
  try {
    if (!mongoose.Types.ObjectId.isValid(key)) {
      return res.status(400).json({ message: 'Invalid media ID format' });
    }
    const fileId = new mongoose.Types.ObjectId(key);
    const mediaBucket = getBucket();
    
    const files = await mediaBucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'File not found in GridFS' });
    }

    const file = files[0];
    const range = req.headers.range;

    // Handle range requests for streaming video
    if (range && file.contentType && file.contentType.startsWith('video/')) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
      const chunksize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${file.length}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': file.contentType
      });

      const downloadStream = mediaBucket.openDownloadStream(fileId, {
        start,
        end: end + 1 // end in GridFS is exclusive
      });
      downloadStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': file.length,
        'Content-Type': file.contentType || 'application/octet-stream'
      });
      const downloadStream = mediaBucket.openDownloadStream(fileId);
      downloadStream.pipe(res);
    }
  } catch (error) {
    console.error('Media streaming error from GridFS:', error);
    res.status(500).json({ message: 'Error retrieving media' });
  }
});

export default router;
