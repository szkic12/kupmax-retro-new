import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Lazy initialization of S3 client
let s3 = null;

function getS3Client() {
  if (!s3) {
    // Trim env variables to remove any accidental whitespace/newlines
    const region = (process.env.AWS_REGION || '').trim();
    const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
    const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();

    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Initializing S3 client...');
      console.log('🔧 Region:', region);
      console.log('🔧 Has Access Key:', !!accessKeyId);
      console.log('🔧 Has Secret Key:', !!secretAccessKey);
    }

    s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3;
}

export class S3Service {
  constructor() {
    this.bucketName = (process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'kupmax-downloads').trim();
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 S3Service initialized with bucket:', this.bucketName);
    }
  }

  // Upload pliku do S3
  async uploadFile(fileBuffer, fileName, contentType) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: `downloads/${Date.now()}-${fileName}`,
      Body: fileBuffer,
      ContentType: contentType,
    });

    try {
      const result = await getS3Client().send(command);
      return {
        success: true,
        key: `downloads/${Date.now()}-${fileName}`,
        location: `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/downloads/${Date.now()}-${fileName}`,
        etag: result.ETag,
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error uploading file to S3:', error);
      }
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generowanie signed URL dla pobierania
  async getDownloadUrl(fileKey, fileName, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ResponseContentDisposition: `attachment; filename="${fileName}"`,
    });

    try {
      const url = await getSignedUrl(getS3Client(), command, { expiresIn });
      return {
        success: true,
        url,
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error generating download URL:', error);
      }
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generowanie presigned URL dla uploadu (client-side direct upload)
  async getPresignedUploadUrl(fileKey, contentType, expiresIn = 3600) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: contentType,
    });

    try {
      const url = await getSignedUrl(getS3Client(), command, { expiresIn });
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Generated presigned upload URL for: ${fileKey}`);
      }
      return url;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error generating presigned upload URL:', error);
      }
      return null;
    }
  }

  // Usuwanie pliku z S3
  async deleteFile(fileKey) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    try {
      await getS3Client().send(command);
      return {
        success: true,
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting file from S3:', error);
      }
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Sprawdzanie czy plik istnieje
  async fileExists(fileKey) {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    try {
      await getS3Client().send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  // Pobieranie metadanych pliku
  async getFileMetadata(fileKey) {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    try {
      const metadata = await getS3Client().send(command);
      return {
        success: true,
        metadata: {
          size: metadata.ContentLength,
          contentType: metadata.ContentType,
          lastModified: metadata.LastModified,
          etag: metadata.ETag,
        },
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting file metadata:', error);
      }
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Listowanie plików w S3
  async listFiles(prefix = 'downloads/') {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });

    try {
      const response = await getS3Client().send(command);
      return {
        success: true,
        files: response.Contents || [],
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error listing files from S3:', error);
      }
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // === NOWE METODY DLA JSON DATA ===

  // Zapisywanie danych JSON do S3
  async saveJsonData(key, data) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 saveJsonData called for ${key}`);
      console.log(`🔧 Bucket: ${this.bucketName}`);
      console.log(`🔧 Region: ${process.env.AWS_REGION}`);
      console.log(`🔧 Has Access Key: ${!!process.env.AWS_ACCESS_KEY_ID}`);
      console.log(`🔧 Has Secret Key: ${!!process.env.AWS_SECRET_ACCESS_KEY}`);
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: `data/${key}.json`,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    });

    try {
      await getS3Client().send(command);
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Saved ${key}.json to S3`);
      }
      return { success: true };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Error saving ${key}.json to S3:`, error.name, error.message);
        console.error(`❌ Full error:`, JSON.stringify(error, null, 2));
      }
      return { success: false, error: error.message };
    }
  }

  // Odczytywanie danych JSON z S3
  async loadJsonData(key, defaultData) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: `data/${key}.json`,
    });

    try {
      const response = await getS3Client().send(command);
      const bodyString = await response.Body.transformToString();
      const data = JSON.parse(bodyString);
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Loaded ${key}.json from S3`);
      }
      return { success: true, data };
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        if (process.env.NODE_ENV === 'development') {
          console.log(`📁 ${key}.json not found in S3, using default data`);
        }
        return { success: true, data: defaultData };
      }
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error loading ${key}.json from S3:`, error);
      }
      return { success: false, error: error.message, data: defaultData };
    }
  }
}

export default new S3Service();
