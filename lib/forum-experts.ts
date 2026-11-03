// Zasada Brata: problem jest „potwierdzony” dopiero, gdy co najmniej 3 fachowców niezależnie powie to samo
// (i „tak” przeważa). 3× „tak się nie robi” = odpowiedź AI jest zła. Po terminie przydatności kategorii dzwonimy od nowa.
type Row = Record<string, any>;
export const POTRZEBA = 3;

export function stanFachowcow(calls: Row[], shelfMonths = 36) {
  const tak = calls.filter((c) => c.verdict === 'tak');
  const nie = calls.filter((c) => c.verdict === 'nie');
  const werdykt = tak.length >= POTRZEBA && tak.length > nie.length ? 'tak' : nie.length >= POTRZEBA && nie.length > tak.length ? 'nie' : null;
  const daty = (werdykt === 'tak' ? tak : nie).map((c) => c.called_at).filter(Boolean).sort();
  // Data potwierdzenia = dzień, w którym odezwał się trzeci fachowiec
  const kiedy = werdykt ? daty[POTRZEBA - 1] || daty[daty.length - 1] : null;
  const przeterminowane = !!kiedy && Date.now() - new Date(kiedy).getTime() > shelfMonths * 30.44 * 86400000;
  return { tak: tak.length, nie: nie.length, werdykt, kiedy, przeterminowane };
}
