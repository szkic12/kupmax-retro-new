import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Lazy initialization of S3 client
let s3 = null;

function getS3Client() {
  if (!s3) {
    console.log('🔧 Initializing S3 client...');
    console.log('🔧 Region:', process.env.AWS_REGION);
    console.log('🔧 Has Access Key:', !!process.env.AWS_ACCESS_KEY_ID);
    console.log('🔧 Has Secret Key:', !!process.env.AWS_SECRET_ACCESS_KEY);

    s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3;
}

export class S3Service {
  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'kupmax-downloads';
    console.log('🔧 S3Service initialized with bucket:', this.bucketName);
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
      console.error('Error uploading file to S3:', error);
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
      console.error('Error generating download URL:', error);
      return {
        success: false,
        error: error.message,
      };
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
      console.error('Error deleting file from S3:', error);
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
      console.error('Error getting file metadata:', error);
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
      console.error('Error listing files from S3:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // === NOWE METODY DLA JSON DATA ===

  // Zapisywanie danych JSON do S3
  async saveJsonData(key, data) {
    console.log(`🔧 saveJsonData called for ${key}`);
    console.log(`🔧 Bucket: ${this.bucketName}`);
    console.log(`🔧 Region: ${process.env.AWS_REGION}`);
    console.log(`🔧 Has Access Key: ${!!process.env.AWS_ACCESS_KEY_ID}`);
    console.log(`🔧 Has Secret Key: ${!!process.env.AWS_SECRET_ACCESS_KEY}`);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: `data/${key}.json`,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    });

    try {
      await getS3Client().send(command);
      console.log(`✅ Saved ${key}.json to S3`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error saving ${key}.json to S3:`, error.name, error.message);
      console.error(`❌ Full error:`, JSON.stringify(error, null, 2));
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
      console.log(`✅ Loaded ${key}.json from S3`);
      return { success: true, data };
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        console.log(`📁 ${key}.json not found in S3, using default data`);
        return { success: true, data: defaultData };
      }
      console.error(`Error loading ${key}.json from S3:`, error);
      return { success: false, error: error.message, data: defaultData };
    }
  }
}

export default new S3Service();
