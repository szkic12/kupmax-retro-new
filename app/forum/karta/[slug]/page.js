// Karta wiedzy renderowana na serwerze (K12): Google widzi 4 szuflady z wiedzą od ludzi.
import CardView from '@/components/Forum/CardView';
import { cardPage } from '@/lib/forum-cards';

export const dynamic = 'force-dynamic';

const BASE = 'https://www.kupmax.pl';
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

async function load(slug) {
  try { return await cardPage(slug); } catch { return null; }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: 'Karta wiedzy | Forum kupmax', robots: { index: false, follow: false } };
  const name = data.card.name;
  const n = Object.values(data.drawers).reduce((s, l) => s + l.length, 0);
  const first = Object.values(data.drawers).flat()[0]?.body || '';
  const description = `${cap(name)}: jak rozpoznać, gdzie znaleźć, jak użyć i na co uważać. ${n} sprawdzanych przez ludzi wskazówek z forum kupmax. ${first}`.slice(0, 158);
  const url = `${BASE}/forum/karta/${data.card.slug}`;
  return {
    title: `${cap(name)}: jak rozpoznać, użyć, pułapki | Forum kupmax`,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${cap(name)} | karta wiedzy kupmax`, description, url, type: 'article', siteName: 'kupmax.pl' },
    ...(n === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CardPage({ params }) {
  const { slug } = await params;
  const data = await load(slug);
  const ld = data && {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: data.card.name,
    url: `${BASE}/forum/karta/${data.card.slug}`,
    inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Karty wiedzy forum kupmax', url: `${BASE}/forum/karty` },
    description: Object.values(data.drawers).flat().slice(0, 3).map((c) => c.body).join(' '),
  };
  return (
    <>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />}
      <CardView initial={data ? { success: true, ...data } : null} />
    </>
  );
}
