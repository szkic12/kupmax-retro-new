import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Knowledge base for common programming questions
const knowledgeBase: Record<string, string> = {
  'react hooks': `**React Hooks** to funkcje pozwalające używać stanu i innych funkcji React w komponentach funkcyjnych.

**Podstawowe Hooks:**
- \`useState\` - zarządzanie stanem lokalnym
- \`useEffect\` - efekty uboczne (fetch, subskrypcje)
- \`useContext\` - dostęp do kontekstu
- \`useRef\` - referencje do elementów DOM
- \`useMemo\` - memoizacja wartości
- \`useCallback\` - memoizacja funkcji

**Przykład useState:**
\`\`\`jsx
const [count, setCount] = useState(0);
\`\`\`

**Zasady Hooks:**
1. Wywołuj tylko na najwyższym poziomie
2. Wywołuj tylko w komponentach React lub własnych Hooks`,

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

**Przypadki użycia:**
- Pobieranie danych (fetch)
- Subskrypcje (WebSocket, events)
- Manipulacja DOM
- Timery

**Dependency array:**
- \`[]\` - tylko przy montowaniu (componentDidMount)
- \`[value]\` - gdy value się zmieni
- brak - przy każdym renderze (rzadko potrzebne)`,

  'next.js app router': `**Next.js App Router** (od wersji 13+) to nowy system routingu.

**Kluczowe różnice od Pages Router:**
1. Folder \`app/\` zamiast \`pages/\`
2. React Server Components domyślnie
3. Nowe specjalne pliki:
   - \`page.tsx\` - strona
   - \`layout.tsx\` - layout
   - \`loading.tsx\` - loading UI
   - \`error.tsx\` - error boundary

**Pobieranie danych:**
\`\`\`tsx
// Bezpośrednio w komponencie!
async function Page() {
  const data = await fetch('...');
  return <div>{data}</div>;
}
\`\`\`

**Nie potrzebujesz już:**
- getServerSideProps
- getStaticProps
- getStaticPaths`,

  'typescript': `**TypeScript** - JavaScript z typami.

**Podstawowe typy:**
\`\`\`ts
let name: string = "Jan";
let age: number = 25;
let isActive: boolean = true;
let items: string[] = ["a", "b"];
\`\`\`

**Interface vs Type:**
\`\`\`ts
// Interface - dla obiektów
interface User {
  name: string;
  age: number;
}

// Type - bardziej elastyczny
type ID = string | number;
\`\`\`

**Generics:**
\`\`\`ts
function identity<T>(arg: T): T {
  return arg;
}
\`\`\``,

  'async await': `**async/await** - nowoczesna obsługa asynchroniczności.

**Składnia:**
\`\`\`js
async function fetchData() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
\`\`\`

**Porównanie z Promise:**
\`\`\`js
// Promise chain (stary sposób)
fetch(url)
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

// async/await (nowoczesny)
const data = await fetch(url).then(r => r.json());
\`\`\`

**Równoległe wywołania:**
\`\`\`js
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts()
]);
\`\`\``,

  'supabase': `**Supabase** - open-source alternatywa dla Firebase.

**Funkcje:**
- PostgreSQL database
- Authentication
- Realtime subscriptions
- Storage
- Edge Functions

**Przykład użycia:**
\`\`\`ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Pobieranie danych
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('active', true);

// Insert
await supabase.from('users').insert({ name: 'Jan' });
\`\`\``,

  'tailwind css': `**Tailwind CSS** - utility-first CSS framework.

**Popularne klasy:**
\`\`\`html
<!-- Flexbox -->
<div class="flex items-center justify-between">

<!-- Spacing -->
<div class="p-4 m-2 space-y-4">

<!-- Colors -->
<div class="bg-blue-500 text-white">

<!-- Responsive -->
<div class="text-sm md:text-base lg:text-lg">

<!-- Hover/Focus -->
<button class="hover:bg-blue-600 focus:ring-2">
\`\`\`

**Konfiguracja (tailwind.config.js):**
\`\`\`js
module.exports = {
  content: ['./app/**/*.tsx'],
  theme: {
    extend: {
      colors: {
        primary: '#000080'
      }
    }
  }
}
\`\`\``,

  'git': `**Git** - system kontroli wersji.

**Podstawowe komendy:**
\`\`\`bash
# Inicjalizacja
git init

# Status
git status

# Dodanie plików
git add .

# Commit
git commit -m "Opis zmian"

# Push
git push origin main

# Pull
git pull origin main

# Branch
git checkout -b feature/new-feature
git merge feature/new-feature
\`\`\`

**Dobre praktyki:**
- Commituj często, małe zmiany
- Pisz czytelne opisy commitów
- Używaj branchy dla nowych funkcji
- Regularnie pull'uj zmiany`
};

// Find best matching answer from knowledge base
function findAnswer(question: string): string | null {
  const questionLower = question.toLowerCase();

  for (const [key, answer] of Object.entries(knowledgeBase)) {
    if (questionLower.includes(key)) {
      return answer;
    }
  }

  // Check for partial matches
  const keywords = questionLower.split(/\s+/);
  for (const [key, answer] of Object.entries(knowledgeBase)) {
    const keyWords = key.split(/\s+/);
    const matches = keyWords.filter(kw => keywords.some(qw => qw.includes(kw) || kw.includes(qw)));
    if (matches.length > 0) {
      return answer;
    }
  }

  return null;
}

// Generate contextual response
function generateResponse(question: string): string {
  // Check knowledge base first
  const kbAnswer = findAnswer(question);
  if (kbAnswer) {
    return kbAnswer;
  }

  const questionLower = question.toLowerCase();

  // Greeting
  if (questionLower.match(/^(cze[sś][cć]|hej|siema|dzie[nń]\s*dobry|witaj)/)) {
    return `**Witaj w KUPMAX Mentor!**

Jestem Twoim asystentem do nauki programowania. Mogę pomóc Ci z:

- Wyjaśnieniem konceptów programistycznych
- React, Next.js, TypeScript
- Supabase, bazy danych
- Git i kontrola wersji
- Tailwind CSS i stylowanie
- I wiele więcej!

**Jak mogę Ci dzisiaj pomóc?**

*Wskazówka: Użyj zakładki "Walidator Kodu" aby sprawdzić czy kod z kursu jest aktualny!*`;
  }

  // Help/capabilities
  if (questionLower.match(/co\s+(umiesz|potrafisz|możesz)|pomoc|help/)) {
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

**Zadaj mi pytanie!** Na przykład:
- "Jak działa useEffect?"
- "Wyjaśnij App Router w Next.js"
- "Jak używać async/await?"`;
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Wiadomość jest wymagana' },
        { status: 400 }
      );
    }

    // Generate response
    const response = generateResponse(message);

    return NextResponse.json({
      response,
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
