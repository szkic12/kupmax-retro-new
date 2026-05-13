import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { firestore } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SITE_URL = 'https://kupmax.pl';
const SITE_NAME = 'KupMax';
const SITE_DESC = 'KupMax — marketplace modeli 3D, muzyki i produktów niezależnych twórców';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function rssItem({
  title,
  link,
  description,
  pubDate,
  category,
  enclosureUrl,
}: {
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  category: string;
  enclosureUrl?: string;
}): string {
  const enclosure = enclosureUrl
    ? `<enclosure url="${escapeXml(enclosureUrl)}" type="model/gltf-binary" />`
    : '';
  return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate.toUTCString()}</pubDate>
      <guid isPermaLink="false">${escapeXml(link)}</guid>
      <category>${escapeXml(category)}</category>
      ${enclosure}
    </item>`;
}

export async function GET(_req: NextRequest) {
  const items: { date: Date; xml: string }[] = [];

  // 1. Modele 3D z Firestore
  try {
    const snapshot = await firestore
      .collection('models3D')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    for (const doc of snapshot.docs) {
      const d = doc.data();
      const date = d.createdAt?.toDate?.() ?? new Date();
      items.push({
        date,
        xml: rssItem({
          title: `[Model 3D] ${d.displayName || d.title || 'Nowy model'}`,
          link: `${SITE_URL}/vibe3d/${doc.id}`,
          description: d.userDescription || d.displayDescription || 'Nowy model 3D dostępny w aplikacji Vibe3D.',
          pubDate: date,
          category: d.category || '3D Models',
          enclosureUrl: d.modelUrl,
        }),
      });
    }
  } catch (_e) {}

  // 2. Produkty z Supabase
  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, price, category, created_at, images')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    for (const p of products || []) {
      const date = new Date(p.created_at);
      const img = Array.isArray(p.images) ? p.images[0] : undefined;
      items.push({
        date,
        xml: rssItem({
          title: `[Produkt] ${p.name}`,
          link: `${SITE_URL}/shop/${p.id}`,
          description: `${p.description?.substring(0, 200) || ''} — Cena: ${p.price} PLN`,
          pubDate: date,
          category: p.category || 'Produkty',
          enclosureUrl: img,
        }),
      });
    }
  } catch (_e) {}

  // 3. Wątki forum z Supabase (S3 JSON)
  try {
    const res = await fetch(`${SITE_URL}/api/forum/threads?limit=10&sortBy=date`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const json = await res.json();
      for (const t of json.threads || []) {
        const date = new Date(t.date || t.createdAt || Date.now());
        items.push({
          date,
          xml: rssItem({
            title: `[Forum] ${t.title}`,
            link: `${SITE_URL}/forum/thread/${t.id}`,
            description: t.content?.substring(0, 300) || t.title,
            pubDate: date,
            category: 'Forum',
          }),
        });
      }
    }
  } catch (_e) {}

  // Sortuj wszystko po dacie malejąco
  items.sort((a, b) => b.date.getTime() - a.date.getTime());

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESC}</description>
    <language>pl</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/api/rss" rel="self" type="application/rss+xml" />
    <atom:link href="https://pubsubhubbub.appspot.com/" rel="hub" />
    <atom:link href="https://pubsubhubbub.superfeedr.com/" rel="hub" />
    <image>
      <url>${SITE_URL}/favicon.ico</url>
      <title>${SITE_NAME}</title>
      <link>${SITE_URL}</link>
    </image>
    ${items.slice(0, 50).map((i) => i.xml).join('')}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  });
}
