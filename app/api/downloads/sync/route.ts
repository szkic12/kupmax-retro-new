import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import S3Service from '../../../../lib/aws-s3';
import FileDatabase from '../../../../lib/file-database';

/**
 * Synchronize S3 files with database
 * GET /api/downloads/sync
 *
 * Scans S3 downloads/ folder and adds missing files to database
 */
export async function GET(req: NextRequest) {
  try {
    logger.log('🔄 Starting S3 → Database sync...');

    // 1. List all files from S3 downloads/ folder
    const s3Result = await S3Service.listFiles('downloads/');

    if (!s3Result.success) {
      logger.error('Failed to list S3 files:', s3Result.error);
      return NextResponse.json({
        success: false,
        error: 'Failed to list S3 files: ' + s3Result.error,
      }, { status: 500 });
    }

    const s3Files = s3Result.files || [];
    logger.log(`📦 Found ${s3Files.length} objects in S3 downloads/ folder`);

    // Filter out folders (objects ending with /)
    const realFiles = s3Files.filter((file: any) => !file.Key.endsWith('/'));
    logger.log(`📄 ${realFiles.length} are real files (excluding folders)`);

    // 2. Get current database
    const db = await FileDatabase.getDatabase();
    const existingKeys = new Set(db.files.map((f: any) => f.s3Key));

    // 3. Find files that are in S3 but not in database
    const missingFiles = realFiles.filter((file: any) => !existingKeys.has(file.Key));
    logger.log(`➕ Found ${missingFiles.length} files missing from database`);

    if (missingFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Database is already in sync with S3',
        totalS3Files: realFiles.length,
        totalDbFiles: db.files.length,
        addedFiles: 0,
      });
    }

    // 4. Add missing files to database
    const addedFiles = [];
    for (const s3File of missingFiles) {
      // Extract filename from S3 key (remove downloads/ prefix and timestamp)
      const fileName = s3File.Key.replace('downloads/', '').replace(/^\d+-/, '');

      // Guess category from file extension
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      const categoryMap: Record<string, string> = {
        'mp3': 'Audio',
        'wav': 'Audio',
        'ogg': 'Audio',
        'mp4': 'Video',
        'avi': 'Video',
        'mkv': 'Video',
        'jpg': 'Graphics',
        'jpeg': 'Graphics',
        'png': 'Graphics',
        'gif': 'Graphics',
        'exe': 'Utilities',
        'zip': 'Utilities',
        'rar': 'Utilities',
        'js': 'Development',
        'ts': 'Development',
        'py': 'Development',
      };

      const fileData = {
        id: crypto.randomUUID(),
        name: fileName,
        s3Key: s3File.Key,
        size: s3File.Size || 0,
        type: `application/${ext}`,
        description: `Imported from S3 (${new Date(s3File.LastModified).toLocaleDateString()})`,
        category: categoryMap[ext] || 'Other',
        uploadedAt: s3File.LastModified || new Date().toISOString(),
        downloadCount: 0,
      };

      const added = await FileDatabase.addFile(fileData);
      addedFiles.push(added);

      logger.log(`  ✅ Added: ${fileName} (${(s3File.Size / 1024).toFixed(1)} KB)`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${addedFiles.length} files from S3 to database`,
      totalS3Files: realFiles.length,
      totalDbFiles: db.files.length + addedFiles.length,
      addedFiles: addedFiles.length,
      files: addedFiles.map(f => ({ name: f.name, size: f.size, category: f.category })),
    });

  } catch (error) {
    logger.error('Error syncing S3 with database:', error);
    return NextResponse.json(
      { success: false, error: 'Sync failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
