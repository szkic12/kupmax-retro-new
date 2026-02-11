import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import s3Service from '../../../../lib/aws-s3.js';

// Wyłącz cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Domyślne kategorie
const DEFAULT_CATEGORIES = [
  {
    id: "1",
    name: "Pytania o produkty",
    description: "Zadawaj pytania o nasze retro produkty",
    icon: "🛒",
    threadCount: 0,
    lastActivity: null,
    color: "#4CAF50",
    order: 1
  },
  {
    id: "2",
    name: "Wspomnienia retro",
    description: "Dziel się wspomnieniami z dawnych czasów",
    icon: "📺",
    threadCount: 0,
    lastActivity: null,
    color: "#FF9800",
    order: 2
  },
  {
    id: "3",
    name: "Pomoc techniczna",
    description: "Problemy techniczne i pytania o działanie strony",
    icon: "🔧",
    threadCount: 0,
    lastActivity: null,
    color: "#2196F3",
    order: 3
  },
  {
    id: "4",
    name: "Ogólne dyskusje",
    description: "Rozmowy na różne tematy",
    icon: "💬",
    threadCount: 0,
    lastActivity: null,
    color: "#9C27B0",
    order: 4
  }
];

// Pobierz dane forum z S3
async function getForumData() {
  const result = await s3Service.loadJsonData('forum', {
    categories: DEFAULT_CATEGORIES,
    threads: [],
    posts: []
  });
  return result.data || { categories: DEFAULT_CATEGORIES, threads: [], posts: [] };
}

export async function GET(req: NextRequest) {
  try {
    const forumData = await getForumData();

    // Sortuj kategorie po kolejności
    const sortedCategories = forumData.categories.sort((a: any, b: any) => a.order - b.order);

    return NextResponse.json(
      { success: true, categories: sortedCategories },
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
