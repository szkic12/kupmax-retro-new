import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import S3Service from '../../../../lib/aws-s3';
import FileDatabase from '../../../../lib/file-database';

// Allowed MIME types
const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/zip',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'audio/mpeg',
  'audio/wav'
];

// Allowed extensions
const allowedExtensions = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf', '.zip', '.txt', '.md',
  '.doc', '.docx', '.mp4', '.mp3', '.wav'
];

function validateFile(file: File) {
  // Check extension first (more reliable than MIME type)
  const hasValidExtension = allowedExtensions.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!hasValidExtension) {
    return { valid: false, error: `File extension not allowed: ${file.name}. Allowed: ${allowedExtensions.join(', ')}` };
  }

  // Check MIME type (allow empty for backwards compatibility)
  if (file.type && !allowedMimeTypes.includes(file.type)) {
    // Try to infer MIME type from extension
    const ext = file.name.toLowerCase().split('.').pop();
    const mimeMap: Record<string, string> = {
      'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
      'gif': 'image/gif', 'webp': 'image/webp', 'pdf': 'application/pdf',
      'zip': 'application/zip', 'txt': 'text/plain', 'md': 'text/markdown',
      'mp4': 'video/mp4', 'mp3': 'audio/mpeg', 'wav': 'audio/wav'
    };

    if (!ext || !mimeMap[ext]) {
      logger.warn(`Unknown MIME type for file: ${file.name} (${file.type})`);
    }
  }

  // Check file size (200MB limit)
  const maxSize = 200 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds 200MB limit: ${(file.size / 1024 / 1024).toFixed(2)}MB` };
  }

  // Check filename for path traversal
  if (file.name.includes('..')) {
    return { valid: false, error: 'Invalid file name (path traversal detected)' };
  }

  return { valid: true };
}

export async function POST(req: NextRequest) {
  try {
    logger.log('Upload request received');

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const description = formData.get('description') as string || '';
    const category = formData.get('category') as string || '';

    logger.log(`Received ${files.length} files in 'files' field`);

    // Support single file upload (backwards compatibility)
    const singleFile = formData.get('file') as File | null;
    if (singleFile && files.length === 0) {
      logger.log('Using single file from "file" field');
      files.push(singleFile);
    }

    if (files.length === 0) {
      logger.error('No files in request');
      return NextResponse.json(
        { success: false, error: 'No files uploaded' },
        { status: 400 }
      );
    }

    logger.log(`Processing ${files.length} file(s)`);
    files.forEach((f, i) => {
      logger.log(`File ${i}: ${f.name} (${f.type}, ${(f.size / 1024).toFixed(2)}KB)`);
    });

    const uploadedFiles: any[] = [];
    const errors: string[] = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to S3
        const uploadResult = await S3Service.uploadFile(
          buffer,
          file.name,
          file.type
        );

        if (!uploadResult.success) {
          errors.push(`${file.name}: ${uploadResult.error}`);
          continue;
        }

        // Add file to database
        const fileData = {
          id: `${Date.now()}-${i}`,
          name: file.name,
          s3Key: uploadResult.key,
          size: file.size,
          type: file.type,
          description: files.length === 1 ? description : '',
          category,
          uploadedAt: new Date().toISOString(),
        };

        const savedFile = FileDatabase.addFile(fileData);
        uploadedFiles.push(savedFile);
      } catch (error: any) {
        logger.error(`Error uploading file ${file.name}:`, error);
        errors.push(`${file.name}: ${error.message}`);
      }
    }

    // Return results
    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'All uploads failed', errors },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      file: uploadedFiles[0], // backwards compatibility
      errors: errors.length > 0 ? errors : undefined,
      partialSuccess: errors.length > 0,
    });
  } catch (error) {
    logger.error('Error uploading files:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Vercel configuration
export const runtime = 'nodejs';
export const maxDuration = 300;
