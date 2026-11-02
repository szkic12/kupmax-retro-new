// Zasady moderacji forum (DSA): kategorie zgłoszeń i powody usunięcia, wspólne dla formularza, API i panelu.

export const CATEGORIES = {
  nielegalne: 'Treść niezgodna z prawem',
  obraza: 'Obrażanie, nękanie, mowa nienawiści',
  dane: 'Cudze dane osobowe albo wizerunek bez zgody',
  nagosc: 'Pornografia albo nagość',
  spam: 'Spam, reklama bez zgody, oszustwo',
  dzieci: 'Treść zagrażająca dzieciom',
  inne: 'Inne złamanie zasad forum',
} as const;
export type Category = keyof typeof CATEGORIES;
export const isCategory = (c: unknown): c is Category => typeof c === 'string' && c in CATEGORIES;

// Paragraf regulaminu (/forum/zasady), na który powołuje się usunięcie
export const RULE: Record<Category, string> = {
  nielegalne: '§2 pkt 1',
  obraza: '§2 pkt 2',
  dane: '§2 pkt 3',
  nagosc: '§2 pkt 4',
  spam: '§2 pkt 5',
  dzieci: '§2 pkt 6',
  inne: '§2',
};

// Tekst zapisywany w removed_reason: powód + podstawa + opcjonalna notatka moderatora
export function reasonText(cat: Category, note?: string) {
  const n = (note || '').trim().slice(0, 500);
  return `${CATEGORIES[cat]} (zasady forum ${RULE[cat]}).${n ? ` ${n}` : ''}`;
}
