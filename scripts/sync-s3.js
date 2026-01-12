// Script to sync S3 files with local database
const { S3Client, ListObjectsV2Command, HeadObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucketName = process.env.AWS_S3_BUCKET_NAME || 'kupmax-downloads';

async function syncS3Files() {
  console.log('🔄 Syncing S3 files with local database...');
  console.log('Bucket:', bucketName);
  console.log('Region:', process.env.AWS_REGION);

  try {
    // List all files in S3
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'downloads/',
    });

    const response = await s3.send(command);
    const s3Files = response.Contents || [];

    console.log(`Found ${s3Files.length} files in S3`);

    // Load existing database
    const dbPath = path.resolve('./data/downloads.json');
    let db = {
      files: [],
      downloadStats: {},
      totalDownloads: 0,
      totalSize: 0
    };

    if (fs.existsSync(dbPath)) {
      db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      console.log(`Existing database has ${db.files.length} files`);
    }

    // Get existing file keys
    const existingKeys = new Set(db.files.map(f => f.s3Key));

    // Add new files from S3
    let newFilesCount = 0;
    for (const s3File of s3Files) {
      if (!existingKeys.has(s3File.Key) && s3File.Key !== 'downloads/') {
        const fileName = s3File.Key.replace('downloads/', '');

        // Get file metadata
        const headCommand = new HeadObjectCommand({
          Bucket: bucketName,
          Key: s3File.Key,
        });

        let contentType = 'application/octet-stream';
        try {
          const metadata = await s3.send(headCommand);
          contentType = metadata.ContentType || 'application/octet-stream';
        } catch (e) {
          console.log(`Could not get metadata for ${s3File.Key}`);
        }

        const newFile = {
          id: Date.now().toString() + newFilesCount,
          name: fileName,
          s3Key: s3File.Key,
          size: s3File.Size,
          type: contentType,
          downloads: 0,
          uploadedAt: s3File.LastModified.toISOString(),
          description: `Plik zsynchronizowany z S3 - ${fileName}`,
          category: 'Synchronized',
          tags: []
        };

        db.files.push(newFile);
        db.totalSize += s3File.Size;
        newFilesCount++;
        console.log(`+ Added: ${fileName} (${(s3File.Size / 1024).toFixed(2)} KB)`);
      }
    }

    // Save updated database
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    console.log(`\n✅ Sync complete!`);
    console.log(`   New files added: ${newFilesCount}`);
    console.log(`   Total files in database: ${db.files.length}`);
    console.log(`   Total size: ${(db.totalSize / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('❌ Error syncing S3:', error.message);
    if (error.Code === 'NoSuchBucket') {
      console.error('   The bucket does not exist or you do not have access.');
    }
  }
}

syncS3Files();
