import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { forumDb, toCategory, visibleCategories } from '@/lib/forum-db';

// Wyłącz cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const cats = await visibleCategories();

    // Liczba wątków i ostatnia aktywność w każdej kategorii
    const { data: rows, error } = await forumDb
      .from('forum_threads').select('category_id, last_activity').eq('status', 'widoczny');
    if (error) throw error;
    const stats: Record<string, { count: number; last: string | null }> = {};
    for (const r of rows || []) {
      const s = (stats[r.category_id] ||= { count: 0, last: null });
      s.count++;
      if (!s.last || r.last_activity > s.last) s.last = r.last_activity;
    }

    return NextResponse.json(
      { success: true, categories: cats.map((c, i) => toCategory(c, i, stats[c.id])) },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    logger.error('Error fetching forum categories:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
