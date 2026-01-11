import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = supabase
      .from('Product')
      .select('*', { count: 'exact' })
      .order('createdAt', { ascending: false });

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category);
    }

    // Search by name if provided
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Pagination
    const start = (page - 1) * perPage;
    query = query.range(start, start + perPage - 1);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      products: products || [],
      total: count || 0,
      page,
      perPage,
      hasMore: (count || 0) > start + perPage,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
