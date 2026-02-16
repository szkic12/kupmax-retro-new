import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

// AI Kupmax API URL
const AI_KUPMAX_API = process.env.AI_KUPMAX_API_URL || 'https://ai.kupmax.pl';

// Supabase for checking activePlanets
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || searchParams.get('perPage') || '20');

    // If source=products, fetch from ai.kupmax.pl
    if (source === 'products') {
      try {
        // First, get companies with activePlanets >= 3
        const { data: verifiedCompanies } = await supabase
          .from('Company')
          .select('id, name, activePlanets')
          .gte('activePlanets', 3);

        const verifiedCompanyIds = new Set((verifiedCompanies || []).map(c => c.id));
        const companyNames: Record<string, string> = {};
        (verifiedCompanies || []).forEach(c => {
          companyNames[c.id] = c.name;
        });

        // Fetch products from ai.kupmax.pl API
        const response = await fetch(`${AI_KUPMAX_API}/api/products?limit=100`, {
          headers: {
            'Content-Type': 'application/json',
          },
          next: { revalidate: 300 }, // Cache for 5 minutes
        });

        if (!response.ok) {
          throw new Error(`API response: ${response.status}`);
        }

        const data = await response.json();

        // Filter products - only from companies with activePlanets >= 3
        // seller.id in API = Company.id (sellerId in Product table)
        const photos: any[] = [];

        if (data.products && Array.isArray(data.products)) {
          data.products.forEach((product: any) => {
            const sellerId = product.seller?.id;
            // Check if seller (company) has activePlanets >= 3
            if (sellerId && verifiedCompanyIds.has(sellerId) && product.images && product.images.length > 0) {
              // Add each product image as a photo
              product.images.forEach((image: any, index: number) => {
                photos.push({
                  id: `${product.id}-${index}`,
                  image_url: typeof image === 'string' ? image : image.url,
                  imageUrl: typeof image === 'string' ? image : image.url,
                  title: product.name,
                  productName: product.name,
                  productSlug: product.slug,
                  companyName: companyNames[sellerId] || product.seller?.name,
                });
              });
            }
          });
        }

        // Pagination
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const paginatedPhotos = photos.slice(start, end);

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
      } catch (apiError) {
        logger.error('Error fetching from ai.kupmax.pl:', apiError);
        // Return empty array on error
        return NextResponse.json({
          success: true,
          photos: [],
          pagination: {
            total: 0,
            page,
            per_page: perPage,
            has_next: false,
          },
          message: 'Could not fetch products from ai.kupmax.pl'
        });
      }
    }

    // Default: return mock/slider photos for backward compatibility
    const mockPhotos = Array.from({ length: 20 }, (_, i) => ({
      id: `photo-${i + 1}`,
      imageUrl: `/images/slider-${(i % 3) + 1}.jpg`,
      image_url: `/images/slider-${(i % 3) + 1}.jpg`,
      title: `Photo ${i + 1}`,
      productName: `Photo ${i + 1}`,
      productSlug: `photo-${i + 1}`,
      width: 800,
      height: 600,
      isMainImage: true
    }));

    const category = searchParams.get('category');
    let photos = mockPhotos;

    if (category) {
      // Simple category filter for mock data
      photos = mockPhotos.filter((_, i) => {
        if (category === 'landscapes') return i % 2 === 0;
        if (category === 'portraits') return i % 2 === 1;
        return true;
      });
    }

    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedPhotos = photos.slice(start, end);

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
