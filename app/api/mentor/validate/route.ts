import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Patterns to detect outdated code
const outdatedPatterns = {
  react: [
    {
      pattern: /class\s+\w+\s+extends\s+(React\.)?Component/,
      type: 'Przestarzały wzorzec',
      description: 'Class Components są przestarzałe - użyj Functional Components z Hooks',
      oldCode: 'class MyComponent extends React.Component',
      newCode: 'function MyComponent() { ... }',
      explanation: 'Od React 16.8 (2019) zalecane są Functional Components z Hooks. Są prostsze, łatwiejsze do testowania i oferują lepszą wydajność.'
    },
    {
      pattern: /this\.setState\s*\(/,
      type: 'Przestarzały API',
      description: 'this.setState jest z Class Components - użyj useState Hook',
      oldCode: 'this.setState({ count: this.state.count + 1 })',
      newCode: 'const [count, setCount] = useState(0);\nsetCount(prev => prev + 1);',
      explanation: 'useState Hook jest nowoczesnym sposobem zarządzania stanem w React. Jest prostszy i bardziej czytelny.'
    },
    {
      pattern: /componentDidMount|componentWillUnmount|componentDidUpdate/,
      type: 'Przestarzały cykl życia',
      description: 'Lifecycle methods z Class Components - użyj useEffect Hook',
      oldCode: 'componentDidMount() { fetch(...) }',
      newCode: 'useEffect(() => { fetch(...) }, []);',
      explanation: 'useEffect zastępuje wszystkie lifecycle methods. Pusty array [] = componentDidMount, return = componentWillUnmount.'
    },
    {
      pattern: /import\s+React\s+from\s+['"]react['"]/,
      type: 'Niepotrzebny import',
      description: 'Od React 17+ nie trzeba importować React dla JSX',
      oldCode: "import React from 'react';",
      newCode: "// Nie potrzeba importu React dla JSX w React 17+",
      explanation: 'Nowy JSX Transform w React 17+ automatycznie importuje potrzebne funkcje. Mniej kodu = lepszy DX.'
    },
    {
      pattern: /createContext\s*\(\s*\)\s*;?\s*[\s\S]*?\.Provider/,
      type: 'Potencjalna optymalizacja',
      description: 'Context API może być zastąpione przez Zustand lub Jotai dla lepszej wydajności',
      oldCode: 'const MyContext = createContext();',
      newCode: "import { create } from 'zustand';\nconst useStore = create((set) => ({ ... }));",
      explanation: 'Zustand i Jotai są nowoczesnymi alternatywami dla Context API z lepszą wydajnością i prostszym API.'
    }
  ],
  nextjs: [
    {
      pattern: /getServerSideProps|getStaticProps|getStaticPaths/,
      type: 'Pages Router (stary)',
      description: 'Next.js 13+ używa App Router z Server Components',
      oldCode: 'export async function getServerSideProps() { ... }',
      newCode: '// W App Router po prostu użyj async w komponencie\nexport default async function Page() {\n  const data = await fetch(...);\n  return <div>{data}</div>;\n}',
      explanation: 'App Router w Next.js 13+ używa React Server Components. Dane pobierasz bezpośrednio w komponencie bez getServerSideProps.'
    },
    {
      pattern: /pages\/api\//,
      type: 'Stara struktura',
      description: 'Next.js 13+ używa app/api/ zamiast pages/api/',
      oldCode: 'pages/api/hello.ts',
      newCode: 'app/api/hello/route.ts',
      explanation: 'Nowa struktura App Router używa folderu app/ z route.ts dla API endpoints.'
    },
    {
      pattern: /next\/router/,
      type: 'Przestarzały import',
      description: 'Next.js 13+ używa next/navigation zamiast next/router',
      oldCode: "import { useRouter } from 'next/router';",
      newCode: "import { useRouter, usePathname, useSearchParams } from 'next/navigation';",
      explanation: 'App Router wprowadził nowe hooki w next/navigation. useRouter z next/router nie działa w App Router.'
    },
    {
      pattern: /Image\s+from\s+['"]next\/image['"]\s*;?\s*[\s\S]*?layout\s*=/,
      type: 'Przestarzały prop',
      description: 'layout prop w next/image jest przestarzały',
      oldCode: '<Image layout="fill" />',
      newCode: '<Image fill />',
      explanation: 'Od Next.js 13, layout="fill" zostało zastąpione przez fill prop. Podobnie layout="responsive" przez style.'
    }
  ],
  javascript: [
    {
      pattern: /var\s+\w+/,
      type: 'Przestarzała deklaracja',
      description: 'var jest przestarzałe - użyj const lub let',
      oldCode: 'var name = "John";',
      newCode: 'const name = "John"; // lub let jeśli zmienna',
      explanation: 'const i let mają block scope, var ma function scope co prowadzi do bugów. const dla wartości stałych, let dla zmiennych.'
    },
    {
      pattern: /function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?return\s+new\s+Promise/,
      type: 'Potencjalna optymalizacja',
      description: 'Rozważ użycie async/await zamiast new Promise',
      oldCode: 'function getData() { return new Promise((resolve) => {...}); }',
      newCode: 'async function getData() { ... }',
      explanation: 'async/await jest czytelniejsze niż Promise chains. Używaj new Promise tylko gdy naprawdę potrzebne.'
    },
    {
      pattern: /\.then\s*\(\s*function\s*\(/,
      type: 'Stary syntax',
      description: 'Użyj arrow functions w callbacks',
      oldCode: '.then(function(data) { ... })',
      newCode: '.then((data) => { ... })',
      explanation: 'Arrow functions są krótsze i nie tworzą własnego this, co jest zazwyczaj pożądane w callbacks.'
    },
    {
      pattern: /require\s*\(\s*['"][^'"]+['"]\s*\)/,
      type: 'CommonJS',
      description: 'Rozważ użycie ES Modules (import/export)',
      oldCode: "const fs = require('fs');",
      newCode: "import fs from 'fs';",
      explanation: 'ES Modules są standardem w nowoczesnym JavaScript. CommonJS (require) jest głównie dla Node.js legacy.'
    }
  ],
  typescript: [
    {
      pattern: /:\s*any\b/,
      type: 'Słabe typowanie',
      description: 'Unikaj typu any - użyj konkretnych typów lub unknown',
      oldCode: 'function process(data: any) { ... }',
      newCode: 'function process(data: unknown) { ... }\n// lub zdefiniuj interface',
      explanation: 'any wyłącza type checking. unknown jest bezpieczniejsze - wymusza sprawdzenie typu przed użyciem.'
    },
    {
      pattern: /interface\s+\w+\s*\{[\s\S]*?\}\s*\n\s*interface\s+\w+\s+extends/,
      type: 'Potencjalna optymalizacja',
      description: 'Rozważ użycie type z intersection zamiast interface extends',
      oldCode: 'interface B extends A { ... }',
      newCode: 'type B = A & { ... }',
      explanation: 'Intersection types (&) są bardziej elastyczne i mogą łączyć wiele typów jednocześnie.'
    }
  ],
  python: [
    {
      pattern: /print\s+[^(]/,
      type: 'Python 2 syntax',
      description: 'print jako statement jest z Python 2 - użyj print()',
      oldCode: 'print "Hello"',
      newCode: 'print("Hello")',
      explanation: 'Python 2 zakończył wsparcie w 2020. Python 3 wymaga print() jako funkcji.'
    },
    {
      pattern: /from\s+\w+\s+import\s+\*/,
      type: 'Zły import',
      description: 'Wildcard import (*) jest złą praktyką',
      oldCode: 'from module import *',
      newCode: 'from module import specific_function',
      explanation: 'Import * zanieczyszcza namespace i utrudnia debugowanie. Importuj tylko to co potrzebujesz.'
    },
    {
      pattern: /requests\.get\([^)]+\)(?!\s*\.json)/,
      type: 'Potencjalny problem',
      description: 'Pamiętaj o obsłudze błędów HTTP',
      oldCode: 'response = requests.get(url)',
      newCode: 'response = requests.get(url)\nresponse.raise_for_status()  # Sprawdź błędy',
      explanation: 'requests nie rzuca wyjątków dla błędów HTTP (4xx, 5xx). Użyj raise_for_status() lub sprawdzaj status_code.'
    }
  ]
};

// Analyze code for outdated patterns
function analyzeCode(code: string, language: string, framework: string) {
  const issues: Array<{
    type: string;
    description: string;
    oldCode: string;
    newCode: string;
    explanation: string;
  }> = [];

  // Check language-specific patterns
  const langPatterns = outdatedPatterns[language as keyof typeof outdatedPatterns] || [];
  for (const pattern of langPatterns) {
    if (pattern.pattern.test(code)) {
      issues.push({
        type: pattern.type,
        description: pattern.description,
        oldCode: pattern.oldCode,
        newCode: pattern.newCode,
        explanation: pattern.explanation
      });
    }
  }

  // Check framework-specific patterns
  if (framework !== 'none') {
    const frameworkPatterns = outdatedPatterns[framework as keyof typeof outdatedPatterns] || [];
    for (const pattern of frameworkPatterns) {
      if (pattern.pattern.test(code)) {
        // Avoid duplicates
        const isDuplicate = issues.some(i => i.type === pattern.type);
        if (!isDuplicate) {
          issues.push({
            type: pattern.type,
            description: pattern.description,
            oldCode: pattern.oldCode,
            newCode: pattern.newCode,
            explanation: pattern.explanation
          });
        }
      }
    }
  }

  return issues;
}

// Issue type for functions
type Issue = {
  type: string;
  description: string;
  oldCode: string;
  newCode: string;
  explanation: string;
};

// Generate updated code suggestions
function generateUpdatedCode(code: string, issues: Issue[]): string {
  let updatedCode = code;

  // Apply transformations
  for (const issue of issues) {
    // Simple replacements for demonstration
    if (issue.type === 'Niepotrzebny import') {
      updatedCode = updatedCode.replace(/import\s+React\s+from\s+['"]react['"];\s*\n?/, '');
    }
    if (issue.type === 'Przestarzała deklaracja') {
      updatedCode = updatedCode.replace(/\bvar\s+/g, 'const ');
    }
    if (issue.type === 'Stary syntax') {
      updatedCode = updatedCode.replace(/\.then\s*\(\s*function\s*\((\w+)\)\s*\{/g, '.then(($1) => {');
    }
  }

  // Add comment header if changes were made
  if (updatedCode !== code && issues.length > 0) {
    updatedCode = `// Zaktualizowany kod przez KUPMAX Mentor
// Znaleziono ${issues.length} problemów do poprawy
// -------------------------------------------

${updatedCode}`;
  }

  return updatedCode;
}

// Generate learning points
function generateLearningPoints(issues: Issue[]): string[] {
  const points: string[] = [];

  if (issues.some(i => i.type.includes('Class') || i.type.includes('cykl życia'))) {
    points.push('React Hooks (useState, useEffect) zastąpiły Class Components - są prostsze i bardziej czytelne');
  }

  if (issues.some(i => i.type.includes('Pages Router') || i.type.includes('getServerSideProps'))) {
    points.push('Next.js 13+ wprowadził App Router - nowy sposób routingu z React Server Components');
  }

  if (issues.some(i => i.type.includes('var'))) {
    points.push('const i let mają block scope, co eliminuje wiele bugów związanych z var');
  }

  if (issues.some(i => i.type.includes('Promise'))) {
    points.push('async/await to nowoczesny sposób obsługi asynchroniczności - czytelniejszy niż Promise chains');
  }

  if (issues.some(i => i.type.includes('any'))) {
    points.push('TypeScript unknown jest bezpieczniejszy niż any - wymusza sprawdzenie typu');
  }

  // Add general points
  if (points.length === 0) {
    points.push('Twój kod wygląda na aktualny! Pamiętaj o regularnym sprawdzaniu dokumentacji');
  }

  points.push('Zawsze sprawdzaj daty publikacji kursów i porównuj wersje bibliotek');
  points.push('Oficjalna dokumentacja jest najlepszym źródłem aktualnych informacji');

  return points;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language, framework, courseSource } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Kod jest wymagany' },
        { status: 400 }
      );
    }

    // Analyze the code
    const issues = analyzeCode(code, language || 'javascript', framework || 'none');

    // Determine status
    let status: 'outdated' | 'current' | 'warning' = 'current';
    if (issues.length >= 3) {
      status = 'outdated';
    } else if (issues.length > 0) {
      status = 'warning';
    }

    // Generate updated code
    const updatedCode = generateUpdatedCode(code, issues);

    // Generate learning points
    const learningPoints = generateLearningPoints(issues);

    // Generate summary
    let summary = '';
    if (status === 'outdated') {
      summary = `Znaleziono ${issues.length} przestarzałych wzorców w kodzie. ${courseSource ? `Kod z "${courseSource}" wymaga znaczących aktualizacji.` : 'Kod wymaga znaczących aktualizacji.'} Poniżej znajdziesz szczegółowe wyjaśnienia i zaktualizowany kod.`;
    } else if (status === 'warning') {
      summary = `Kod zawiera ${issues.length} element${issues.length === 1 ? '' : 'y'}, które można zoptymalizować. Nie są to krytyczne problemy, ale warto je poprawić dla lepszej czytelności i wydajności.`;
    } else {
      summary = 'Kod wygląda na aktualny! Nie znaleziono przestarzałych wzorców. Pamiętaj jednak, że automatyczna analiza nie wykryje wszystkich problemów - zawsze weryfikuj z oficjalną dokumentacją.';
    }

    return NextResponse.json({
      result: {
        status,
        issues,
        updatedCode,
        summary,
        learningPoints
      }
    });
  } catch (error) {
    console.error('Error validating code:', error);
    return NextResponse.json(
      { error: 'Błąd podczas analizy kodu' },
      { status: 500 }
    );
  }
}
