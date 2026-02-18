import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Offline knowledge base - fallback gdy API nie działa
const offlineKnowledge: Record<string, string> = {
  // Powitania
  'cześć': 'Cześć! Jestem Clippy, asystent KUPMAX! 📎 Jak mogę Ci pomóc?',
  'hej': 'Hej! 👋 Miło Cię widzieć! Czym mogę służyć?',
  'siema': 'Siema! 😊 Co Cię tu sprowadza?',
  'witaj': 'Witaj na KUPMAX! Jestem Clippy - Twój pomocnik. O co chcesz zapytać?',
  'hello': 'Hello! 👋 Welcome to KUPMAX! How can I help you?',
  'hi': 'Hi there! 📎 I\'m Clippy, your KUPMAX assistant!',

  // O stronie
  'kupmax': 'KUPMAX to retro-stylowa strona portfolio i showcase! 🖥️ Znajdziesz tu sklep, galerię, forum, chat i wiele więcej - wszystko w stylu Windows 95!',
  'co to jest': 'KUPMAX to kreatywne portfolio w stylu retro Windows 95. Mamy sklep, galerię zdjęć, forum, chat, radio i gry! 🎮',
  'o stronie': 'KUPMAX to unikalna strona łącząca nostalgię lat 90 z nowoczesnymi funkcjami. Sprawdź nasze sekcje: Shop, Photos, Forum, Chat, Radio i więcej!',

  // Nawigacja
  'sklep': 'Sklep znajdziesz klikając ikonę 🛒 Shop.exe na pulpicie! Tam są produkty do kupienia.',
  'shop': 'Click the 🛒 Shop.exe icon on desktop to visit our shop!',
  'zdjęcia': 'Galeria zdjęć jest pod ikoną 📸 Photos.exe na pulpicie!',
  'photos': 'Check out 📸 Photos.exe on the desktop for our gallery!',
  'forum': 'Forum znajdziesz pod 🗨️ Forum.exe - dyskutuj z innymi użytkownikami!',
  'chat': 'Chat jest pod 💬 Chat.exe - rozmawiaj w czasie rzeczywistym!',
  'radio': 'Radio retro znajdziesz pod 📻 Radio.exe - posłuchaj muzyki!',
  'gra': 'Mamy grę BlockBlitz (Tetris) pod 🕹️ BlockBlitz.exe! Powodzenia! 🎮',
  'tetris': 'BlockBlitz (nasz Tetris) jest pod ikoną 🕹️ na pulpicie! Graj i bij rekordy!',
  'mentor': 'Mentor.exe 🎓 to narzędzie do nauki programowania! Możesz tam wgrać kod i dostać pomoc.',
  'download': 'Sekcja Downloads 💾 zawiera pliki do pobrania. Kliknij ikonę na pulpicie!',
  'pobieranie': 'Pliki do pobrania znajdziesz w 💾 Downloads na pulpicie!',

  // Pomoc
  'pomoc': 'Mogę pomóc z:\n• Nawigacją po stronie\n• Informacjami o funkcjach\n• Pytaniami o KUPMAX\n\nZapytaj o konkretną sekcję! 😊',
  'help': 'I can help with:\n• Site navigation\n• Feature information\n• Questions about KUPMAX\n\nAsk about any section! 📎',
  'co umiesz': 'Jestem Clippy! Mogę:\n📎 Pomóc w nawigacji\n📎 Wyjaśnić funkcje strony\n📎 Odpowiedzieć na pytania\n📎 Pokazać gdzie co jest\n\nPytaj śmiało!',

  // Techniczne
  'windows 95': 'Tak! KUPMAX jest stylizowany na Windows 95 - kultowy system z 1995 roku! 🖥️ Nostalgia at its finest!',
  'retro': 'KUPMAX to hołd dla ery Windows 95/98! Uwielbiamy retro estetykę lat 90. 💾',

  // Kontakt
  'kontakt': 'Możesz się z nami skontaktować przez Guestbook 📖 lub Forum 🗨️!',
  'contact': 'Reach us through the Guestbook 📖 or Forum 🗨️!',

  // Easter eggs
  'clippy': 'To ja! 📎 Oryginalny Clippy był w Microsoft Office 97-2003. Teraz pomagam na KUPMAX!',
  'kim jesteś': 'Jestem Clippy! 📎 Kiedyś pomagałem w Microsoft Office, teraz jestem asystentem KUPMAX w stylu retro!',
  'dziękuję': 'Nie ma za co! 😊 Zawsze do usług! Jeśli potrzebujesz czegoś jeszcze - pytaj!',
  'thanks': 'You\'re welcome! 📎 Happy to help anytime!',
  'dzięki': 'Spoko! 😊 Cieszę się, że mogłem pomóc!',
};

// Find best matching answer from offline knowledge
function findOfflineAnswer(question: string): string {
  const questionLower = question.toLowerCase().trim();

  // Direct match
  for (const [key, answer] of Object.entries(offlineKnowledge)) {
    if (questionLower.includes(key) || key.includes(questionLower)) {
      return answer;
    }
  }

  // Partial word match
  const words = questionLower.split(/\s+/);
  for (const word of words) {
    if (word.length < 3) continue;
    for (const [key, answer] of Object.entries(offlineKnowledge)) {
      if (key.includes(word) || word.includes(key)) {
        return answer;
      }
    }
  }

  // Default response
  return `Hmm, nie jestem pewien jak odpowiedzieć na to pytanie offline. 🤔

Mogę pomóc z:
• **Nawigacja** - zapytaj "gdzie sklep?" lub "gdzie forum?"
• **O stronie** - zapytaj "co to KUPMAX?"
• **Funkcje** - zapytaj o konkretną ikonę na pulpicie

Spróbuj zapytać inaczej! 📎`;
}

// Try to get answer from Supabase Q&A database
async function findSupabaseAnswer(question: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('clippy_qa')
      .select('answer, keywords')
      .eq('is_active', true);

    if (error || !data || data.length === 0) {
      return null;
    }

    const questionLower = question.toLowerCase();

    // Search through Q&A entries
    for (const entry of data) {
      const keywords = entry.keywords || [];
      for (const keyword of keywords) {
        if (questionLower.includes(keyword.toLowerCase())) {
          return entry.answer;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Search products in database
async function searchProducts(question: string): Promise<string | null> {
  try {
    const questionLower = question.toLowerCase();

    // Check if question is about products/shop
    const productKeywords = ['produkt', 'sklep', 'kup', 'cena', 'ile kosztuje', 'macie', 'sprzedajecie', 'laptop', 'klawiatura', 'rezystor', 'zawias'];
    const isProductQuestion = productKeywords.some(kw => questionLower.includes(kw));

    if (!isProductQuestion) return null;

    const { data, error } = await supabase
      .from('Product')
      .select('name, description, price, currency, stock')
      .eq('moderationStatus', 'APPROVED')
      .limit(10);

    if (error || !data || data.length === 0) {
      return null;
    }

    // Search for matching products
    const matches = data.filter(product => {
      const name = product.name?.toLowerCase() || '';
      const desc = product.description?.toLowerCase() || '';
      return questionLower.split(/\s+/).some(word =>
        word.length > 2 && (name.includes(word) || desc.includes(word))
      );
    });

    if (matches.length > 0) {
      const productList = matches.slice(0, 3).map(p =>
        `• **${p.name}** - ${p.price} ${p.currency}${p.stock ? ` (${p.stock} szt.)` : ''}`
      ).join('\n');

      return `🛒 Znalazłem te produkty w sklepie:\n\n${productList}\n\nWejdź do Shop.exe na pulpicie żeby zobaczyć więcej! 📎`;
    }

    // If asking about products but no match, list some
    if (questionLower.includes('produkt') || questionLower.includes('sklep') || questionLower.includes('macie')) {
      const productList = data.slice(0, 4).map(p =>
        `• **${p.name}** - ${p.price} ${p.currency}`
      ).join('\n');

      return `🛒 Oto niektóre produkty w sklepie:\n\n${productList}\n\nWejdź do Shop.exe żeby zobaczyć wszystkie! 📎`;
    }

    return null;
  } catch {
    return null;
  }
}

// Search news in database
async function searchNews(question: string): Promise<string | null> {
  try {
    const questionLower = question.toLowerCase();

    // Check if question is about news
    const newsKeywords = ['news', 'nowości', 'aktualności', 'co nowego', 'ogłoszenie', 'wiadomości'];
    const isNewsQuestion = newsKeywords.some(kw => questionLower.includes(kw));

    if (!isNewsQuestion) return null;

    const { data, error } = await supabase
      .from('news')
      .select('title, content, category, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) {
      return '📰 Nie ma jeszcze żadnych newsów. Sprawdź później! 📎';
    }

    const newsList = data.slice(0, 3).map(n =>
      `• **${n.title}** [${n.category || 'Ogólne'}]`
    ).join('\n');

    return `📰 Najnowsze wiadomości:\n\n${newsList}\n\nKliknij News.exe na pulpicie żeby przeczytać więcej! 📎`;
  } catch {
    return null;
  }
}

// Search forum threads
async function searchForum(question: string): Promise<string | null> {
  try {
    const questionLower = question.toLowerCase();

    // Check if question is about forum
    const forumKeywords = ['forum', 'wątek', 'dyskusja', 'post', 'temat', 'pytanie'];
    const isForumQuestion = forumKeywords.some(kw => questionLower.includes(kw));

    if (!isForumQuestion) return null;

    const { data, error } = await supabase
      .from('forum_threads')
      .select('title, category, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) {
      return '🗨️ Forum czeka na pierwszy wątek! Może Ty go założysz? Kliknij Forum.exe! 📎';
    }

    const threadList = data.slice(0, 3).map(t =>
      `• **${t.title}** [${t.category || 'Ogólne'}]`
    ).join('\n');

    return `🗨️ Najnowsze wątki na forum:\n\n${threadList}\n\nDołącz do dyskusji w Forum.exe! 📎`;
  } catch {
    return null;
  }
}

// Get dynamic knowledge from all sources
async function getDynamicKnowledge(question: string): Promise<string | null> {
  // Try products first
  const productAnswer = await searchProducts(question);
  if (productAnswer) return productAnswer;

  // Try news
  const newsAnswer = await searchNews(question);
  if (newsAnswer) return newsAnswer;

  // Try forum
  const forumAnswer = await searchForum(question);
  if (forumAnswer) return forumAnswer;

  return null;
}

// System prompt for Claude API
const systemPrompt = `Jesteś Clippy, nostalgiczny asystent AI ze stylem z lat 90. Pracujesz dla strony KUPMAX - retro portfolio i showcase.

Twoja osobowość:
- Przyjazny, pomocny i trochę quirky (jak oryginalny Clippy)
- Używasz polskiego języka
- Czasami dodajesz emotikony 😊
- Jesteś entuzjastyczny i pozytywny
- Masz wiedzę o:
  * KUPMAX - stronie portfolio/showcase w stylu Windows 95
  * Sekcje: Shop, Photos, Forum, Chat, Radio, Downloads, Mentor, BlockBlitz (Tetris)
  * Windows 95 i nostalgii lat 90
  * Ogólnych tematach technicznych
  * 3D modelingu, grafice, web development

Odpowiadaj zwięźle ale pomocnie. Jeśli nie wiesz czegoś, przyznaj się do tego uczciwie.`;

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 20 requests per minute per IP (AI costs money)
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(`clippy-chat:${clientIP}`, 20, 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          message: '⏳ Zbyt wiele wiadomości! Poczekaj chwilę przed następną.',
          source: 'ratelimit',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const userQuestion = lastMessage?.content || '';

    // Try Claude API first (if API key exists and has credits)
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey && apiKey.length > 10) {
      try {
        const anthropic = new Anthropic({ apiKey });

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages,
        });

        const assistantMessage = response.content[0];
        const messageText = assistantMessage.type === 'text' ? assistantMessage.text : '';

        return NextResponse.json({
          message: messageText,
          source: 'ai' // Let frontend know this is AI response
        });
      } catch (apiError: any) {
        logger.log('Claude API unavailable, falling back to offline mode:', apiError?.message);
        // Fall through to offline mode
      }
    }

    // FALLBACK 1: Try dynamic knowledge (products, news, forum)
    const dynamicAnswer = await getDynamicKnowledge(userQuestion);
    if (dynamicAnswer) {
      return NextResponse.json({
        message: dynamicAnswer,
        source: 'database'
      });
    }

    // FALLBACK 2: Try Supabase Q&A
    const supabaseAnswer = await findSupabaseAnswer(userQuestion);
    if (supabaseAnswer) {
      return NextResponse.json({
        message: supabaseAnswer,
        source: 'database'
      });
    }

    // FALLBACK 3: Use hardcoded offline knowledge
    const offlineAnswer = findOfflineAnswer(userQuestion);

    return NextResponse.json({
      message: offlineAnswer,
      source: 'offline'
    });

  } catch (error: any) {
    logger.error('Chat error:', error);

    return NextResponse.json({
      message: 'Ups! Coś poszło nie tak. 😅 Spróbuj ponownie za chwilę!',
      source: 'error'
    });
  }
}
