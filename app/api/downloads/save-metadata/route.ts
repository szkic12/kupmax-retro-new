import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import FileDatabase from '../../../../lib/file-database';
import { randomUUID } from 'crypto';

// Save file metadata after direct S3 upload
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { s3Key, fileName, fileSize, fileType, description, category } = body;

    if (!s3Key || !fileName || !fileSize) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    logger.log(`Saving metadata for file: ${fileName}`);

    // Create file metadata
    const fileData = {
      id: randomUUID(),
      name: fileName,
      s3Key: s3Key,
      size: fileSize,
      type: fileType || 'application/octet-stream',
      description: description || '',
      category: category || '',
      uploadedAt: new Date().toISOString(),
    };

    // Save to database
    const savedFile = FileDatabase.addFile(fileData);

    logger.log(`File metadata saved: ${savedFile.id}`);

    return NextResponse.json({
      success: true,
      file: savedFile,
    });
  } catch (error) {
    logger.error('Error saving file metadata:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save file metadata' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 10;
