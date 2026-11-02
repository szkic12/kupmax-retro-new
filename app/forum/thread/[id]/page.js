// Strona wątku renderowana na serwerze (K12): Google i asystenci AI widzą pytanie, odpowiedzi (też tekst z nagrań)
// i dane strukturalne QAPage. Wątki ze strefy 18+ i usunięte nie trafiają do wyszukiwarek.
import ThreadView from '@/components/Forum/ThreadView';
import { loadThread, publicThreadRow } from '@/lib/forum-thread';

export const dynamic = 'force-dynamic';

const BASE = 'https://www.kupmax.pl';
const clip = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : t;
};

async function load(id) {
  try {
    const row = await publicThreadRow(id);
    return row ? await loadThread(row) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await load(id);
  if (!data) return { title: 'Wątek | Forum kupmax', robots: { index: false, follow: false } };
  const t = data.thread;
  const url = `${BASE}/forum/thread/${t.id}`;
  const description = clip(t.message, 155) || clip(t.title, 155);
  return {
    title: `${clip(t.title, 60)} | Forum kupmax`,
    description,
    alternates: { canonical: url },
    openGraph: { title: t.title, description, url, type: 'article', siteName: 'kupmax.pl' },
  };
}

// QAPage: pytanie, odpowiedzi ludzi i AI (AI z podpisem), pełna odpowiedź z kawałków jako „zaakceptowana”
function qaJsonLd({ thread: t, posts }) {
  const url = `${BASE}/forum/thread/${t.id}`;
  const visible = posts.filter((p) => !p.removed && p.message);
  const answer = (p) => ({
    '@type': 'Answer',
    text: clip(p.message, 3000),
    dateCreated: p.date,
    url: `${url}#p-${p.id}`,
    author: p.isAi ? { '@type': 'Organization', name: 'AI kupmax (odpowiedź AI, może się mylić)' } : { '@type': 'Person', name: p.author?.nickname || 'Anonim' },
    upvoteCount: (p.claims || []).reduce((n, c) => n + (c.yes || 0) + (c.done || 0), 0),
  });
  const full = t.summary?.groups?.length
    ? {
      '@type': 'Answer',
      text: t.summary.groups.map((g) => `${g.title}: ${g.claims.map((c) => `${c.condition ? `${c.condition}: ` : ''}${c.body}`).join(' ')}`).join('\n'),
      url: `${url}#pelna`,
      dateCreated: t.lastActivity || t.date,
      author: { '@type': 'Organization', name: 'Forum kupmax (pełna odpowiedź z kawałków od ludzi)' },
      upvoteCount: t.summary.groups.reduce((n, g) => n + g.claims.reduce((m, c) => m + (c.yes || 0) + (c.done || 0), 0), 0),
    }
    : null;
  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: t.title,
      text: clip(t.message, 3000) || t.title,
      dateCreated: t.date,
      author: { '@type': 'Person', name: t.author?.nickname || 'Anonim' },
      answerCount: visible.length,
      ...(full ? { acceptedAnswer: full } : {}),
      ...(visible.length ? { suggestedAnswer: visible.map(answer) } : {}),
    },
  };
}

export default async function ThreadPage({ params }) {
  const { id } = await params;
  const data = await load(id);
  return (
    <>
      {data && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(qaJsonLd(data)).replace(/</g, '\\u003c') }} />}
      <ThreadView initial={data} />
    </>
  );
}
