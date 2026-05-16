import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { logger } from '@/lib/logger';
import FileDatabase from '../../../../lib/file-database';
import { randomUUID } from 'crypto';

const ADMIN_EMAILS = ['kontakt@kupmax.pl', 'investcrewe@gmail.com'];

// Rate limiting: map of IP -> { count, resetAt }
const metadataRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isMetadataRateLimited(ip: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = metadataRateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    metadataRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxRequests;
}

// Save file metadata after direct S3 upload
export async function POST(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Rate limiting check
    if (isMetadataRateLimited(ip, 10, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Maximum 10 metadata saves per minute.' },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { s3Key, fileName, fileSize, fileType, description, category, availableForDownload } = body;

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
      availableForDownload: availableForDownload !== false,
    };

    // Save to database (now async with S3 storage)
    const savedFile = await FileDatabase.addFile(fileData);

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
