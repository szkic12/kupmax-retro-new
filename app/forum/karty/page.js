// Spis kart wiedzy renderowany na serwerze (K12)
import CardsIndex from '@/components/Forum/CardsIndex';
import { cardList } from '@/lib/forum-cards';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Karty wiedzy | Forum kupmax',
  description: 'Wiedza z forum kupmax ułożona w karty: jak rozpoznać, gdzie znaleźć, jak użyć i na co uważać. Każdą wskazówkę sprawdzają ludzie.',
  alternates: { canonical: 'https://www.kupmax.pl/forum/karty' },
};

export default async function KartyPage() {
  let cards = null;
  try { cards = await cardList(); } catch { /* przeglądarka dociągnie sama */ }
  return <CardsIndex initial={cards} />;
}
