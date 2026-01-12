import { NextRequest, NextResponse } from 'next/server';
import FileDatabase from '../../../../lib/file-database';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || 'uploadedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Get files from database with filters
    const filters = {
      category,
      search,
      sortBy,
      sortOrder
    };

    const result = FileDatabase.getPaginatedFiles(page, limit, filters);
    const stats = FileDatabase.getStats();

    return NextResponse.json({
      success: true,
      files: result.files,
      pagination: result.pagination,
      categories: stats.categories,
      stats: {
        totalFiles: stats.totalFiles,
        totalDownloads: stats.totalDownloads,
        totalSize: stats.totalSize,
      },
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
