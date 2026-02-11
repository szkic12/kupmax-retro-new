import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Mock photo data (replace with Supabase later)
const mockPhotos = Array.from({ length: 20 }, (_, i) => ({
  id: `photo-${i + 1}`,
  url: `/images/slider-${(i % 3) + 1}.jpg`, // Reuse slider images for now
  thumbnail: `/images/slider-${(i % 3) + 1}.jpg`,
  title: `Photo ${i + 1}`,
  description: `Retro photo ${i + 1} from the gallery`,
  timestamp: Date.now() - i * 86400000,
  category: i % 2 === 0 ? 'landscapes' : 'portraits',
}));

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '12');
    const category = searchParams.get('category');

    let photos = mockPhotos;

    // Filter by category if provided
    if (category) {
      photos = photos.filter((p) => p.category === category);
    }

    // Pagination
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedPhotos = photos.slice(start, end);

    return NextResponse.json({
      photos: paginatedPhotos,
      total: photos.length,
      page,
      perPage,
      hasMore: end < photos.length,
    });
  } catch (error) {
    logger.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}
