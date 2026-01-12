import { NextRequest, NextResponse } from 'next/server';
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
  // Check MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Check extension
  const hasValidExtension = allowedExtensions.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!hasValidExtension) {
    return { valid: false, error: 'File extension not allowed' };
  }

  // Check file size (200MB limit)
  const maxSize = 200 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 200MB limit' };
  }

  // Check filename for path traversal
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { valid: false, error: 'Invalid file name' };
  }

  return { valid: true };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const description = formData.get('description') as string || '';
    const category = formData.get('category') as string || '';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 500 }
      );
    }

    // Add file to database
    const fileData = {
      id: Date.now().toString(),
      name: file.name,
      s3Key: uploadResult.key,
      size: file.size,
      type: file.type,
      description,
      category,
      uploadedAt: new Date().toISOString(),
    };

    const savedFile = FileDatabase.addFile(fileData);

    return NextResponse.json({
      success: true,
      file: savedFile,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
