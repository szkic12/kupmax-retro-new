import { NextRequest, NextResponse } from 'next/server';
import S3Service from '../../../../../lib/aws-s3';
import FileDatabase from '../../../../../lib/file-database';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find file in database
    const file = FileDatabase.getFileById(id);

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Generate signed URL for download
    const downloadResult = await S3Service.getDownloadUrl(
      file.s3Key,
      file.name
    );

    if (!downloadResult.success) {
      return NextResponse.json(
        { success: false, error: downloadResult.error },
        { status: 500 }
      );
    }

    // Increment download count in database
    const updatedFile = FileDatabase.incrementDownload(id);

    // Return download URL
    return NextResponse.json({
      success: true,
      downloadUrl: downloadResult.url,
      file: updatedFile,
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
