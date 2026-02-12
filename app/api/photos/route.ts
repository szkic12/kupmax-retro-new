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
    const perPage = parseInt(searchParams.get('per_page') || searchParams.get('perPage') || '8');
    const category = searchParams.get('category');

    let photos = mockPhotos;

    // Filter by category if provided
    if (category) {
      photos = photos.filter((p) => p.category === category);
    }

    // Map mock data to match the component's expectations (imageUrl, altText, etc.)
    const mappedPhotos = photos.map(p => ({
      id: p.id,
      imageUrl: p.url,
      altText: p.title,
      productName: p.title,
      productSlug: p.id,
      width: 800,
      height: 600,
      isMainImage: true
    }));

    // Pagination
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedPhotos = mappedPhotos.slice(start, end);

    return NextResponse.json({
      success: true,
      photos: paginatedPhotos,
      pagination: {
        total: photos.length,
        page,
        per_page: perPage,
        has_next: end < photos.length,
      }
    });
  } catch (error) {
    logger.error('Error fetching photos:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}
