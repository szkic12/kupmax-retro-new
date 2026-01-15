import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// Fallback knowledge base if database is empty
const fallbackKnowledge: Record<string, string> = {
  'react hooks': `**React Hooks** to funkcje pozwalające używać stanu i innych funkcji React w komponentach funkcyjnych.

**Podstawowe Hooks:**
- \`useState\` - zarządzanie stanem lokalnym
- \`useEffect\` - efekty uboczne (fetch, subskrypcje)
- \`useContext\` - dostęp do kontekstu
- \`useRef\` - referencje do elementów DOM
- \`useMemo\` - memoizacja wartości
- \`useCallback\` - memoizacja funkcji`,

  'useeffect': `**useEffect** - Hook do obsługi efektów ubocznych.

**Składnia:**
\`\`\`jsx
useEffect(() => {
  // Kod efektu
  return () => {
    // Cleanup (opcjonalne)
  };
}, [dependencies]);
\`\`\`

**Dependency array:**
- \`[]\` - tylko przy montowaniu
- \`[value]\` - gdy value się zmieni`,

  'next.js app router': `**Next.js App Router** (od wersji 13+) to nowy system routingu.

**Kluczowe różnice od Pages Router:**
1. Folder \`app/\` zamiast \`pages/\`
2. React Server Components domyślnie
3. Nowe specjalne pliki: page.tsx, layout.tsx, loading.tsx, error.tsx

**Pobieranie danych - bezpośrednio w komponencie!**`,

  'typescript': `**TypeScript** - JavaScript z typami.

**Podstawowe typy:**
\`\`\`ts
let name: string = "Jan";
let age: number = 25;
let isActive: boolean = true;
\`\`\``,

  'async await': `**async/await** - nowoczesna obsługa asynchroniczności.

\`\`\`js
async function fetchData() {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}
\`\`\``,

  'supabase': `**Supabase** - open-source alternatywa dla Firebase.

**Funkcje:** PostgreSQL, Authentication, Realtime, Storage, Edge Functions`,

  'git': `**Git** - system kontroli wersji.

**Podstawowe komendy:**
\`\`\`bash
git init
git add .
git commit -m "message"
git push origin main
\`\`\``
};

// Fetch knowledge from database
async function getKnowledge(query: string): Promise<string | null> {
  try {
    // Search in database
    const { data, error } = await supabase
      .from('mentor_knowledge')
      .select('content, title, priority')
      .eq('is_active', true)
      .ilike('topic', `%${query.toLowerCase()}%`)
      .order('priority', { ascending: false })
      .limit(1);

    if (error) {
      console.log('Database not available, using fallback knowledge');
      return findFallbackAnswer(query);
    }

    if (data && data.length > 0) {
      return data[0].content;
    }

    // Try partial match in database
    const words = query.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length < 3) continue;

      const { data: partialData } = await supabase
        .from('mentor_knowledge')
        .select('content, title, priority')
        .eq('is_active', true)
        .ilike('topic', `%${word}%`)
        .order('priority', { ascending: false })
        .limit(1);

      if (partialData && partialData.length > 0) {
        return partialData[0].content;
      }
    }

    // Fallback to hardcoded knowledge
    return findFallbackAnswer(query);
  } catch (e) {
    console.log('Error fetching knowledge, using fallback');
    return findFallbackAnswer(query);
  }
}

// Find answer in fallback knowledge base
function findFallbackAnswer(question: string): string | null {
  const questionLower = question.toLowerCase();

  for (const [key, answer] of Object.entries(fallbackKnowledge)) {
    if (questionLower.includes(key)) {
      return answer;
    }
  }

  // Check for partial matches
  const keywords = questionLower.split(/\s+/);
  for (const [key, answer] of Object.entries(fallbackKnowledge)) {
    const keyWords = key.split(/\s+/);
    const matches = keyWords.filter(kw => keywords.some(qw => qw.includes(kw) || kw.includes(qw)));
    if (matches.length > 0) {
      return answer;
    }
  }

  return null;
}

// Generate contextual response
async function generateResponse(question: string): Promise<string> {
  const questionLower = question.toLowerCase();

  // Greeting
  if (questionLower.match(/^(cze[sś][cć]|hej|siema|dzie[nń]\s*dobry|witaj|hello|hi)/)) {
    return `**Witaj w KUPMAX Mentor!**

Jestem Twoim asystentem do nauki programowania. Mogę pomóc Ci z:

- Wyjaśnieniem konceptów programistycznych
- React, Next.js, TypeScript
- Supabase, bazy danych
- Git i kontrola wersji
- I wiele więcej!

**Jak mogę Ci dzisiaj pomóc?**

*Wskazówka: Użyj zakładki "Walidator Kodu" aby sprawdzić czy kod z kursu jest aktualny!*`;
  }

  // Help/capabilities
  if (questionLower.match(/co\s+(umiesz|potrafisz|możesz)|pomoc|help|czym/)) {
    return `**Mogę Ci pomóc z:**

**Programowanie:**
- React & React Hooks
- Next.js (App Router)
- TypeScript
- JavaScript ES6+

**Backend & Bazy danych:**
- Supabase
- PostgreSQL
- REST API

**Narzędzia:**
- Git & GitHub
- Tailwind CSS
- VS Code

**Specjalne funkcje:**
- Walidacja kodu z kursów (zakładka "Walidator Kodu")
- Wykrywanie przestarzałych wzorców
- Aktualizacja kodu do najnowszych standardów

**Zadaj mi pytanie!**`;
  }

  // Error help
  if (questionLower.includes('błąd') || questionLower.includes('error') || questionLower.includes('nie działa')) {
    return `**Pomoc z błędami**

Żebym mógł Ci pomóc z błędem, potrzebuję:

1. **Pełny tekst błędu** - skopiuj całą wiadomość
2. **Kod który powoduje błąd** - użyj zakładki "Walidator Kodu"
3. **Co próbujesz osiągnąć** - opisz cel

**Popularne błędy:**
- \`Cannot read property of undefined\` - sprawdź czy zmienna istnieje
- \`Module not found\` - sprawdź import i czy pakiet jest zainstalowany
- \`Hydration failed\` - różnica między serwerem a klientem w Next.js
- \`TypeError\` - niezgodność typów w TypeScript

**Wklej kod w zakładce "Walidator Kodu" - automatycznie znajdę problemy!**`;
  }

  // Check knowledge base (database or fallback)
  const kbAnswer = await getKnowledge(question);
  if (kbAnswer) {
    return kbAnswer;
  }

  // Default response for unknown questions
  return `**Nie mam gotowej odpowiedzi na to pytanie.**

Mogę jednak pomóc Ci z:
- React Hooks (useState, useEffect, etc.)
- Next.js App Router
- TypeScript basics
- async/await
- Supabase
- Tailwind CSS
- Git

**Spróbuj zapytać inaczej lub bardziej szczegółowo.**

*Wskazówka: Jeśli masz kod z kursu który nie działa, wklej go w zakładce "Walidator Kodu"!*`;
}

// Save chat message to database (optional)
async function saveChatMessage(sessionId: string, role: string, content: string) {
  try {
    await supabase.from('mentor_chat_history').insert({
      session_id: sessionId,
      role,
      content: content.substring(0, 2000) // Limit content length
    });
  } catch (e) {
    // Silently fail - tracking is optional
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Wiadomość jest wymagana' },
        { status: 400 }
      );
    }

    // Generate session ID if not provided
    const chatSessionId = sessionId || `session_${Date.now()}`;

    // Save user message (optional)
    await saveChatMessage(chatSessionId, 'user', message);

    // Generate response
    const response = await generateResponse(message);

    // Save assistant response (optional)
    await saveChatMessage(chatSessionId, 'assistant', response);

    return NextResponse.json({
      response,
      sessionId: chatSessionId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Błąd podczas generowania odpowiedzi' },
      { status: 500 }
    );
  }
}
