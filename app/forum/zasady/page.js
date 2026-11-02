// Zasady forum kupmax.pl: regulamin, punkt kontaktowy, zgłaszanie i odwołania (DSA), oznaczanie AI (AI Act).
import Link from 'next/link';

export const metadata = {
  title: 'Zasady forum | kupmax.pl',
  description: 'Zasady forum z głosem na kupmax.pl: czego nie wolno, strefa 18+, zgłaszanie wpisów, moderacja, odwołania i kontakt.',
  alternates: { canonical: 'https://www.kupmax.pl/forum/zasady' },
};

export default function ZasadyForum() {
  return (
    <div className="zasady-page">
      <div className="window">
        <div className="title-bar">📜 Zasady forum</div>
        <div className="content">
          <p className="crumbs"><Link href="/forum">← Wróć na forum</Link></p>
          <h1>Zasady forum kupmax.pl</h1>
          <p>Obowiązują od 2 listopada 2026. Piszemy prosto, żeby każdy wiedział, na czym stoi.</p>

          <h2>§1. Kto prowadzi forum i jak się z nami skontaktować</h2>
          <p>
            Forum prowadzi <b>KUPMAX PSA</b>, ul. Piłsudskiego 74/320, 50-020 Wrocław, KRS 0001224803, NIP 8971967476.
          </p>
          <p>
            <b>Punkt kontaktowy</b> dla użytkowników oraz dla urzędów, Komisji Europejskiej i Europejskiej Rady ds. Usług Cyfrowych:
            {' '}<a href="mailto:kontakt@kupmax.pl">kontakt@kupmax.pl</a>, tel. +48 539 977 433. Piszemy po polsku i po angielsku.
          </p>

          <h2>§2. Czego nie wolno</h2>
          <ol>
            <li>Wrzucać treści niezgodnych z prawem.</li>
            <li>Obrażać, nękać, grozić i szerzyć nienawiść wobec ludzi lub grup.</li>
            <li>Publikować cudzych danych osobowych ani cudzego wizerunku czy głosu bez zgody tej osoby.</li>
            <li>Wrzucać pornografii i zdjęć nagości. Dotyczy to też strefy 18+.</li>
            <li>Spamować, reklamować się bez zgody i oszukiwać.</li>
            <li>Publikować czegokolwiek, co krzywdzi dzieci albo im zagraża.</li>
          </ol>
          <p>Za złamanie zasad usuwamy wpis. Gdy ktoś łamie je wiele razy, możemy zablokować mu pisanie.</p>

          <h2>§3. Strefa 18+</h2>
          <p>
            Strefa 18+ jest na rozmowy dorosłych o sprawach dla dorosłych. Widzą ją tylko osoby zalogowane, które w profilu potwierdziły,
            że mają ukończone 18 lat. Goście i wyszukiwarki jej nie widzą. Potwierdzenie można w każdej chwili cofnąć w profilu.
          </p>

          <h2>§4. Głos, zdjęcia i modele 3D</h2>
          <ul>
            <li>Przed nagraniem wybierasz tryb: <b>mój głos</b>, <b>zmieniony</b>, <b>lektor</b> albo <b>sam tekst</b>. Po własnym głosie można cię rozpoznać. Zmieniony głos utrudnia to, ale sposób mówienia zostaje.</li>
            <li>W trybie lektor i sam tekst nagranie zamieniamy na tekst i nie zapisujemy go.</li>
            <li>Zdjęcia zmniejszamy i czyścimy z ukrytych danych, np. miejsca zrobienia zdjęcia.</li>
            <li>Nie wrzucaj nagrań, zdjęć ani skanów innych ludzi bez ich zgody.</li>
          </ul>

          <h2>§5. Sztuczna inteligencja</h2>
          <ul>
            <li>Wszystko, co tworzy AI, jest oznaczone: lektor AI czyta z oznaczeniem „📻 czyta lektor AI”, a odpowiedzi AI mają podpis, że pisała je AI.</li>
            <li>Pod nowym wątkiem od razu odpowiada „🤖 AI kupmax” z podpisem „AI, może się mylić”. Możesz to wyłączyć przy pisaniu wątku. W strefie 18+ AI nie odpowiada.</li>
            <li>AI może się mylić. Każdy może je poprawić guzikiem „🎤 popraw AI”. AI odpowiada, czy przyznaje rację, a trafne poprawki liczą się przy twoim nicku (🏆).</li>
            <li>Odpowiedzi AI pisze model Claude firmy Anthropic. Trafia tam treść wątku i zdjęcia z wątku, tylko do napisania odpowiedzi. Nie wysyłamy tam twojego maila ani nagrań głosu.</li>
            <li>Mowę na tekst zamienia usługa OpenAI. Nagranie trafia tam tylko do zamiany.</li>
            <li>Twoje wpisy uczą model AI kupmax <b>tylko za twoją zgodą</b>, zaznaczoną w profilu. Dotyczy to samego tekstu, bez nagrań głosu. Zgodę cofasz w profilu w każdej chwili.</li>
          </ul>

          <h2>§6. Zgłaszanie wpisów</h2>
          <p>
            Przy każdym wpisie jest przycisk <b>🚩 zgłoś</b>. Zgłosić może każdy, także bez konta. Napisz, co jest nie tak.
            Jeśli wpis łamie prawo, napisz które. Podaj e-mail, żebyśmy mogli dać znać, co postanowiliśmy.
            Przy treściach zagrażających dzieciom e-mail nie jest potrzebny.
          </p>
          <p>
            Jeśli komuś grozi niebezpieczeństwo, dzwoń <b>112</b>. Materiały z wykorzystaniem dzieci zgłoś też na
            {' '}<a href="https://dyzurnet.pl" target="_blank" rel="noreferrer">dyzurnet.pl</a>.
            Gdy wpis wskazuje na przestępstwo zagrażające czyjemuś życiu lub bezpieczeństwu, powiadamiamy policję lub prokuraturę.
          </p>
          <p>Kto wielokrotnie wysyła oczywiście bezpodstawne zgłoszenia, może stracić możliwość zgłaszania.</p>

          <h2>§7. Jak moderujemy</h2>
          <ul>
            <li>Każde zgłoszenie sprawdza człowiek. Nie używamy automatów do usuwania wpisów.</li>
            <li>Po usuniętym wpisie zostaje ślad z powodem usunięcia, widoczny dla wszystkich w tym miejscu.</li>
            <li>Autor dostaje powiadomienie przy swoim profilu na forum: co usunęliśmy, dlaczego i na podstawie którego punktu zasad.</li>
            <li>Osoba zgłaszająca dostaje od nas e-mail z decyzją.</li>
          </ul>

          <h2>§8. Odwołanie</h2>
          <p>
            Nie zgadzasz się z decyzją? Napisz na <a href="mailto:kontakt@kupmax.pl?subject=Odwołanie od decyzji moderacji forum">kontakt@kupmax.pl</a>
            {' '}w ciągu 6 miesięcy od decyzji. Sprawdzimy sprawę jeszcze raz i odpowiemy bez zbędnej zwłoki.
            Masz też prawo pójść do sądu, skorzystać z certyfikowanego organu pozasądowego rozstrzygania sporów (art. 21 aktu o usługach cyfrowych)
            albo złożyć skargę do koordynatora do spraw usług cyfrowych.
          </p>

          <h2>§9. Twoje konto i dane</h2>
          <p>
            Konto na forum jest wspólne z bossxd.com i ai.kupmax.pl. Nick, awatar i zgody zmieniasz w profilu forum.
            W sprawie swoich danych osobowych pisz na <a href="mailto:kontakt@kupmax.pl">kontakt@kupmax.pl</a>.
          </p>

          <p className="crumbs"><Link href="/forum">← Wróć na forum</Link></p>
        </div>
      </div>
      <style>{`
        .zasady-page { min-height: 100vh; background: #008080; padding: 20px 16px; font-family: 'MS Sans Serif', Tahoma, sans-serif; }
        .zasady-page .window { max-width: 820px; margin: 0 auto; background: #c0c0c0; border: 3px outset #fff; }
        .zasady-page .title-bar { background: linear-gradient(90deg, #000080, #1084d0); color: #fff; padding: 4px 8px; font-weight: bold; }
        .zasady-page .content { background: #fff; margin: 8px; padding: 16px 20px; color: #000; line-height: 1.6; font-size: 15px; }
        .zasady-page h1 { font-size: 24px; color: #000080; margin: 0 0 8px; }
        .zasady-page h2 { font-size: 17px; color: #000080; margin: 24px 0 6px; }
        .zasady-page a { color: #000080; }
        .zasady-page .crumbs { font-size: 14px; }
        .zasady-page ol, .zasady-page ul { padding-left: 22px; }
        @media (max-width: 480px) { .zasady-page { padding: 8px; } .zasady-page .content { padding: 12px; margin: 4px; } }
      `}</style>
    </div>
  );
}
