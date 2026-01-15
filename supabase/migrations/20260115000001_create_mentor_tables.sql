-- Tabele dla KUPMAX Mentor - Walidator Kursów i Asystent Nauki
-- Przechowuje wiedzę w bazie danych zamiast w kodzie

-- =====================================================
-- TABELA: mentor_patterns - Wzorce przestarzałego kodu
-- =====================================================
CREATE TABLE IF NOT EXISTS mentor_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT NOT NULL, -- javascript, typescript, python, java, csharp, php
  framework TEXT DEFAULT 'none', -- react, nextjs, vue, angular, express, django, etc.
  pattern_regex TEXT NOT NULL, -- Regex do wykrywania wzorca
  pattern_type TEXT NOT NULL, -- np. "Przestarzały wzorzec", "Przestarzały API"
  description TEXT NOT NULL, -- Opis problemu
  old_code TEXT NOT NULL, -- Przykład starego kodu
  new_code TEXT NOT NULL, -- Przykład nowego kodu
  explanation TEXT NOT NULL, -- Wyjaśnienie dlaczego zmiana jest potrzebna
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('error', 'warning', 'info')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_patterns_language ON mentor_patterns(language);
CREATE INDEX IF NOT EXISTS idx_mentor_patterns_framework ON mentor_patterns(framework);
CREATE INDEX IF NOT EXISTS idx_mentor_patterns_active ON mentor_patterns(is_active);

-- =====================================================
-- TABELA: mentor_knowledge - Baza wiedzy dla chatu
-- =====================================================
CREATE TABLE IF NOT EXISTS mentor_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL, -- Słowo kluczowe/temat (np. "react hooks", "useeffect")
  title TEXT NOT NULL, -- Tytuł odpowiedzi
  content TEXT NOT NULL, -- Pełna treść odpowiedzi (markdown)
  category TEXT DEFAULT 'general', -- general, react, nextjs, typescript, python, git, etc.
  priority INTEGER DEFAULT 0, -- Wyższy = bardziej preferowany przy wielu dopasowaniach
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_knowledge_topic ON mentor_knowledge(topic);
CREATE INDEX IF NOT EXISTS idx_mentor_knowledge_category ON mentor_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_mentor_knowledge_active ON mentor_knowledge(is_active);

-- =====================================================
-- TABELA: mentor_chat_history - Historia rozmów (opcjonalne)
-- =====================================================
CREATE TABLE IF NOT EXISTS mentor_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL, -- ID sesji użytkownika
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_chat_session ON mentor_chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_mentor_chat_created ON mentor_chat_history(created_at DESC);

-- =====================================================
-- TABELA: mentor_validations - Historia walidacji kodu
-- =====================================================
CREATE TABLE IF NOT EXISTS mentor_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_snippet TEXT NOT NULL,
  language TEXT NOT NULL,
  framework TEXT,
  course_source TEXT,
  status TEXT CHECK (status IN ('outdated', 'current', 'warning')),
  issues_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_validations_status ON mentor_validations(status);
CREATE INDEX IF NOT EXISTS idx_mentor_validations_created ON mentor_validations(created_at DESC);

-- =====================================================
-- TRIGGERY do aktualizacji updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_mentor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mentor_patterns_updated ON mentor_patterns;
CREATE TRIGGER trigger_mentor_patterns_updated
  BEFORE UPDATE ON mentor_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_mentor_updated_at();

DROP TRIGGER IF EXISTS trigger_mentor_knowledge_updated ON mentor_knowledge;
CREATE TRIGGER trigger_mentor_knowledge_updated
  BEFORE UPDATE ON mentor_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_mentor_updated_at();

-- =====================================================
-- DANE POCZĄTKOWE: Wzorce przestarzałego kodu
-- =====================================================
INSERT INTO mentor_patterns (language, framework, pattern_regex, pattern_type, description, old_code, new_code, explanation, severity) VALUES
-- React patterns
('javascript', 'react', 'class\s+\w+\s+extends\s+(React\.)?Component', 'Przestarzały wzorzec', 'Class Components są przestarzałe - użyj Functional Components z Hooks', 'class MyComponent extends React.Component', 'function MyComponent() { ... }', 'Od React 16.8 (2019) zalecane są Functional Components z Hooks. Są prostsze, łatwiejsze do testowania i oferują lepszą wydajność.', 'warning'),
('javascript', 'react', 'this\.setState\s*\(', 'Przestarzały API', 'this.setState jest z Class Components - użyj useState Hook', 'this.setState({ count: this.state.count + 1 })', 'const [count, setCount] = useState(0);\nsetCount(prev => prev + 1);', 'useState Hook jest nowoczesnym sposobem zarządzania stanem w React. Jest prostszy i bardziej czytelny.', 'warning'),
('javascript', 'react', 'componentDidMount|componentWillUnmount|componentDidUpdate', 'Przestarzały cykl życia', 'Lifecycle methods z Class Components - użyj useEffect Hook', 'componentDidMount() { fetch(...) }', 'useEffect(() => { fetch(...) }, []);', 'useEffect zastępuje wszystkie lifecycle methods. Pusty array [] = componentDidMount, return = componentWillUnmount.', 'warning'),
('javascript', 'react', 'import\s+React\s+from\s+[''"]react[''"]', 'Niepotrzebny import', 'Od React 17+ nie trzeba importować React dla JSX', 'import React from ''react'';', '// Nie potrzeba importu React dla JSX w React 17+', 'Nowy JSX Transform w React 17+ automatycznie importuje potrzebne funkcje. Mniej kodu = lepszy DX.', 'info'),

-- Next.js patterns
('javascript', 'nextjs', 'getServerSideProps|getStaticProps|getStaticPaths', 'Pages Router (stary)', 'Next.js 13+ używa App Router z Server Components', 'export async function getServerSideProps() { ... }', '// W App Router po prostu użyj async w komponencie\nexport default async function Page() {\n  const data = await fetch(...);\n  return <div>{data}</div>;\n}', 'App Router w Next.js 13+ używa React Server Components. Dane pobierasz bezpośrednio w komponencie bez getServerSideProps.', 'warning'),
('javascript', 'nextjs', 'next/router', 'Przestarzały import', 'Next.js 13+ używa next/navigation zamiast next/router', 'import { useRouter } from ''next/router'';', 'import { useRouter, usePathname, useSearchParams } from ''next/navigation'';', 'App Router wprowadził nowe hooki w next/navigation. useRouter z next/router nie działa w App Router.', 'error'),

-- JavaScript general patterns
('javascript', 'none', 'var\s+\w+', 'Przestarzała deklaracja', 'var jest przestarzałe - użyj const lub let', 'var name = "John";', 'const name = "John"; // lub let jeśli zmienna', 'const i let mają block scope, var ma function scope co prowadzi do bugów. const dla wartości stałych, let dla zmiennych.', 'warning'),
('javascript', 'none', '\.then\s*\(\s*function\s*\(', 'Stary syntax', 'Użyj arrow functions w callbacks', '.then(function(data) { ... })', '.then((data) => { ... })', 'Arrow functions są krótsze i nie tworzą własnego this, co jest zazwyczaj pożądane w callbacks.', 'info'),
('javascript', 'none', 'require\s*\(\s*[''"][^''"]+[''"]\s*\)', 'CommonJS', 'Rozważ użycie ES Modules (import/export)', 'const fs = require(''fs'');', 'import fs from ''fs'';', 'ES Modules są standardem w nowoczesnym JavaScript. CommonJS (require) jest głównie dla Node.js legacy.', 'info'),

-- TypeScript patterns
('typescript', 'none', ':\s*any\b', 'Słabe typowanie', 'Unikaj typu any - użyj konkretnych typów lub unknown', 'function process(data: any) { ... }', 'function process(data: unknown) { ... }\n// lub zdefiniuj interface', 'any wyłącza type checking. unknown jest bezpieczniejsze - wymusza sprawdzenie typu przed użyciem.', 'warning'),

-- Python patterns
('python', 'none', 'print\s+[^(]', 'Python 2 syntax', 'print jako statement jest z Python 2 - użyj print()', 'print "Hello"', 'print("Hello")', 'Python 2 zakończył wsparcie w 2020. Python 3 wymaga print() jako funkcji.', 'error'),
('python', 'none', 'from\s+\w+\s+import\s+\*', 'Zły import', 'Wildcard import (*) jest złą praktyką', 'from module import *', 'from module import specific_function', 'Import * zanieczyszcza namespace i utrudnia debugowanie. Importuj tylko to co potrzebujesz.', 'warning')
ON CONFLICT DO NOTHING;

-- =====================================================
-- DANE POCZĄTKOWE: Baza wiedzy dla chatu
-- =====================================================
INSERT INTO mentor_knowledge (topic, title, content, category, priority) VALUES
('react hooks', 'React Hooks', '**React Hooks** to funkcje pozwalające używać stanu i innych funkcji React w komponentach funkcyjnych.

**Podstawowe Hooks:**
- `useState` - zarządzanie stanem lokalnym
- `useEffect` - efekty uboczne (fetch, subskrypcje)
- `useContext` - dostęp do kontekstu
- `useRef` - referencje do elementów DOM
- `useMemo` - memoizacja wartości
- `useCallback` - memoizacja funkcji

**Przykład useState:**
```jsx
const [count, setCount] = useState(0);
```

**Zasady Hooks:**
1. Wywołuj tylko na najwyższym poziomie
2. Wywołuj tylko w komponentach React lub własnych Hooks', 'react', 10),

('useeffect', 'useEffect Hook', '**useEffect** - Hook do obsługi efektów ubocznych.

**Składnia:**
```jsx
useEffect(() => {
  // Kod efektu
  return () => {
    // Cleanup (opcjonalne)
  };
}, [dependencies]);
```

**Przypadki użycia:**
- Pobieranie danych (fetch)
- Subskrypcje (WebSocket, events)
- Manipulacja DOM
- Timery

**Dependency array:**
- `[]` - tylko przy montowaniu (componentDidMount)
- `[value]` - gdy value się zmieni
- brak - przy każdym renderze (rzadko potrzebne)', 'react', 10),

('next.js app router', 'Next.js App Router', '**Next.js App Router** (od wersji 13+) to nowy system routingu.

**Kluczowe różnice od Pages Router:**
1. Folder `app/` zamiast `pages/`
2. React Server Components domyślnie
3. Nowe specjalne pliki:
   - `page.tsx` - strona
   - `layout.tsx` - layout
   - `loading.tsx` - loading UI
   - `error.tsx` - error boundary

**Pobieranie danych:**
```tsx
// Bezpośrednio w komponencie!
async function Page() {
  const data = await fetch(''...'');
  return <div>{data}</div>;
}
```

**Nie potrzebujesz już:**
- getServerSideProps
- getStaticProps
- getStaticPaths', 'nextjs', 10),

('typescript', 'TypeScript Basics', '**TypeScript** - JavaScript z typami.

**Podstawowe typy:**
```ts
let name: string = "Jan";
let age: number = 25;
let isActive: boolean = true;
let items: string[] = ["a", "b"];
```

**Interface vs Type:**
```ts
// Interface - dla obiektów
interface User {
  name: string;
  age: number;
}

// Type - bardziej elastyczny
type ID = string | number;
```

**Generics:**
```ts
function identity<T>(arg: T): T {
  return arg;
}
```', 'typescript', 10),

('async await', 'async/await', '**async/await** - nowoczesna obsługa asynchroniczności.

**Składnia:**
```js
async function fetchData() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(''Error:'', error);
  }
}
```

**Porównanie z Promise:**
```js
// Promise chain (stary sposób)
fetch(url)
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

// async/await (nowoczesny)
const data = await fetch(url).then(r => r.json());
```

**Równoległe wywołania:**
```js
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts()
]);
```', 'javascript', 10),

('supabase', 'Supabase', '**Supabase** - open-source alternatywa dla Firebase.

**Funkcje:**
- PostgreSQL database
- Authentication
- Realtime subscriptions
- Storage
- Edge Functions

**Przykład użycia:**
```ts
import { createClient } from ''@supabase/supabase-js'';

const supabase = createClient(url, key);

// Pobieranie danych
const { data, error } = await supabase
  .from(''users'')
  .select(''*'')
  .eq(''active'', true);

// Insert
await supabase.from(''users'').insert({ name: ''Jan'' });
```', 'database', 10),

('tailwind css', 'Tailwind CSS', '**Tailwind CSS** - utility-first CSS framework.

**Popularne klasy:**
```html
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
```

**Konfiguracja (tailwind.config.js):**
```js
module.exports = {
  content: [''./app/**/*.tsx''],
  theme: {
    extend: {
      colors: {
        primary: ''#000080''
      }
    }
  }
}
```', 'css', 10),

('git', 'Git Basics', '**Git** - system kontroli wersji.

**Podstawowe komendy:**
```bash
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
```

**Dobre praktyki:**
- Commituj często, małe zmiany
- Pisz czytelne opisy commitów
- Używaj branchy dla nowych funkcji
- Regularnie pull''uj zmiany', 'git', 10)
ON CONFLICT DO NOTHING;

SELECT 'Tabele Mentor utworzone pomyślnie!' as status;
