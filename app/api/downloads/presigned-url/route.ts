import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { logger } from '@/lib/logger';
import S3Service from '../../../../lib/aws-s3';

const ADMIN_EMAILS = ['kontakt@kupmax.pl', 'investcrewe@gmail.com'];

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // max 20 presigned URLs na godzinę per admin
function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(email);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + 3600_000 });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Generate presigned URL for direct S3 upload
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    if (!checkRateLimit(session.user.email)) {
      return NextResponse.json({ success: false, error: 'Rate limit: max 20 uploadów na godzinę' }, { status: 429 });
    }

    const body = await req.json();
    const { fileName, fileType, fileSize } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { success: false, error: 'fileName and fileType are required' },
        { status: 400 }
      );
    }

    // Validate file size (200MB limit)
    const maxSize = 200 * 1024 * 1024;
    if (fileSize && fileSize > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 200MB limit' },
        { status: 400 }
      );
    }

    // Generate unique S3 key
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `downloads/${timestamp}-${sanitizedFileName}`;

    logger.log(`Generating presigned URL for: ${s3Key}`);

    // Generate presigned URL (valid for 1 hour)
    const presignedUrl = await S3Service.getPresignedUploadUrl(s3Key, fileType, 3600);

    if (!presignedUrl) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate presigned URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      uploadUrl: presignedUrl,
      s3Key,
      fileName: sanitizedFileName,
    });
  } catch (error) {
    logger.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 10;
