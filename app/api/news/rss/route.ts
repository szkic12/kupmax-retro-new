import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Domyślne źródła RSS
const DEFAULT_RSS_SOURCES = [
  { id: '1', name: 'Hacker News', url: 'https://hnrss.org/frontpage', category: 'Tech', enabled: true },
  { id: '2', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Tech', enabled: true },
  { id: '3', name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'Tech', enabled: true },
  { id: '4', name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'Tech', enabled: true },
];

// Parsuj RSS/Atom feed
async function parseFeed(url: string): Promise<any[]> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'KUPMAX RSS Reader/1.0' },
      next: { revalidate: 300 } // Cache na 5 minut
    });

    if (!response.ok) {
      logger.error(`Failed to fetch ${url}: ${response.status}`);
      return [];
    }

    const text = await response.text();
    const items: any[] = [];

    // Prosty parser RSS/Atom
    // RSS format
    const rssItems = text.match(/<item>([\s\S]*?)<\/item>/gi) || [];
    for (const item of rssItems.slice(0, 10)) {
      const title = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || '';
      const link = item.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() || '';
      const description = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || '';
      const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || '';

      if (title && link) {
        items.push({
          title: title.replace(/<[^>]*>/g, '').substring(0, 200),
          link,
          description: description.replace(/<[^>]*>/g, '').substring(0, 300),
          pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        });
      }
    }

    // Atom format (jeśli RSS nie znalazł)
    if (items.length === 0) {
      const atomEntries = text.match(/<entry>([\s\S]*?)<\/entry>/gi) || [];
      for (const entry of atomEntries.slice(0, 10)) {
        const title = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
        const link = entry.match(/<link[^>]*href=["']([^"']*)["']/i)?.[1] || '';
        const summary = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1]?.trim() || '';
        const updated = entry.match(/<updated>([\s\S]*?)<\/updated>/i)?.[1]?.trim() || '';

        if (title && link) {
          items.push({
            title: title.replace(/<[^>]*>/g, '').substring(0, 200),
            link,
            description: summary.replace(/<[^>]*>/g, '').substring(0, 300),
            pubDate: updated ? new Date(updated).toISOString() : new Date().toISOString(),
          });
        }
      }
    }

    return items;
  } catch (error) {
    logger.error(`Error parsing feed ${url}:`, error);
    return [];
  }
}

// GET - pobierz źródła lub artykuły z RSS
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'sources';

    if (action === 'sources') {
      // Pobierz źródła z bazy lub domyślne
      const { data: sources } = await supabase
        .from('rss_sources')
        .select('*')
        .order('name');

      return NextResponse.json({
        sources: sources && sources.length > 0 ? sources : DEFAULT_RSS_SOURCES
      });
    }

    if (action === 'fetch') {
      // Pobierz artykuły ze wszystkich aktywnych źródeł
      const { data: sources } = await supabase
        .from('rss_sources')
        .select('*')
        .eq('enabled', true);

      const activeSources = sources && sources.length > 0 ? sources : DEFAULT_RSS_SOURCES.filter(s => s.enabled);

      const allItems: any[] = [];

      for (const source of activeSources) {
        const items = await parseFeed(source.url);
        for (const item of items) {
          allItems.push({
            ...item,
            source: source.name,
            sourceCategory: source.category,
          });
        }
      }

      // Sortuj po dacie
      allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

      return NextResponse.json({
        items: allItems.slice(0, 30), // Max 30 artykułów
        fetchedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    logger.error('RSS error:', error);
    return NextResponse.json({ error: 'Failed to fetch RSS' }, { status: 500 });
  }
}

// POST - dodaj nowe źródło RSS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, category } = body;

    if (!name || !url) {
      return NextResponse.json({ error: 'Nazwa i URL są wymagane' }, { status: 400 });
    }

    // Sprawdź czy źródło działa
    const testItems = await parseFeed(url);
    if (testItems.length === 0) {
      return NextResponse.json({ error: 'Nie udało się pobrać artykułów z tego URL. Sprawdź czy to poprawny feed RSS.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('rss_sources')
      .insert({
        name,
        url,
        category: category || 'General',
        enabled: true,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error adding RSS source:', error);
      return NextResponse.json({ error: 'Błąd dodawania źródła' }, { status: 500 });
    }

    return NextResponse.json({ source: data, message: 'Źródło dodane!' });

  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - usuń źródło RSS
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID jest wymagane' }, { status: 400 });
    }

    const { error } = await supabase
      .from('rss_sources')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting RSS source:', error);
      return NextResponse.json({ error: 'Błąd usuwania źródła' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Źródło usunięte!' });

  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
