import { MetadataRoute } from 'next'
import { forumDb, visibleCategories } from '@/lib/forum-db'

export const revalidate = 3600 // mapa odświeża się co godzinę

// Forum (K12): publiczne wątki spoza strefy 18+ i karty wiedzy z treścią
async function forumUrls(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const cats = (await visibleCategories(false)).map((c: any) => c.id)
    const [{ data: threads }, { data: cards }, { data: claims }] = await Promise.all([
      forumDb.from('forum_threads').select('id, last_activity').eq('status', 'widoczny').in('category_id', cats).order('last_activity', { ascending: false }).limit(5000),
      forumDb.from('forum_cards').select('id, slug, updated_at').limit(5000),
      forumDb.from('forum_claims').select('card_id').not('card_id', 'is', null).eq('status', 'widoczny').limit(20000),
    ])
    const withContent = new Set((claims || []).map((c: any) => c.card_id))
    return [
      { url: `${baseUrl}/forum/karty`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
      { url: `${baseUrl}/forum/zasady`, lastModified: new Date('2026-11-02'), changeFrequency: 'monthly', priority: 0.3 },
      ...(threads || []).map((t: any) => ({ url: `${baseUrl}/forum/thread/${t.id}`, lastModified: new Date(t.last_activity), changeFrequency: 'weekly' as const, priority: 0.6 })),
      ...(cards || []).filter((c: any) => withContent.has(c.id)).map((c: any) => ({ url: `${baseUrl}/forum/karta/${c.slug}`, lastModified: new Date(c.updated_at), changeFrequency: 'weekly' as const, priority: 0.6 })),
    ]
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.kupmax.pl'
  const currentDate = new Date()

  return [
    ...(await forumUrls(baseUrl)),
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/forum`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/guestbook`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/webring`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/photos`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/downloads`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/radio`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/tetris`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/chat`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/private-chat`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/bulletin`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/mentor`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]
}
