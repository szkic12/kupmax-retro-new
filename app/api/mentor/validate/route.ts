import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// Fallback patterns if database is empty
const fallbackPatterns = [
  {
    language: 'javascript',
    framework: 'react',
    pattern_regex: 'class\\s+\\w+\\s+extends\\s+(React\\.)?Component',
    pattern_type: 'Przestarzały wzorzec',
    description: 'Class Components są przestarzałe - użyj Functional Components z Hooks',
    old_code: 'class MyComponent extends React.Component',
    new_code: 'function MyComponent() { ... }',
    explanation: 'Od React 16.8 (2019) zalecane są Functional Components z Hooks.',
    severity: 'warning'
  },
  {
    language: 'javascript',
    framework: 'react',
    pattern_regex: 'this\\.setState\\s*\\(',
    pattern_type: 'Przestarzały API',
    description: 'this.setState jest z Class Components - użyj useState Hook',
    old_code: 'this.setState({ count: this.state.count + 1 })',
    new_code: 'const [count, setCount] = useState(0);',
    explanation: 'useState Hook jest nowoczesnym sposobem zarządzania stanem w React.',
    severity: 'warning'
  },
  {
    language: 'javascript',
    framework: 'react',
    pattern_regex: 'componentDidMount|componentWillUnmount|componentDidUpdate',
    pattern_type: 'Przestarzały cykl życia',
    description: 'Lifecycle methods z Class Components - użyj useEffect Hook',
    old_code: 'componentDidMount() { fetch(...) }',
    new_code: 'useEffect(() => { fetch(...) }, []);',
    explanation: 'useEffect zastępuje wszystkie lifecycle methods.',
    severity: 'warning'
  },
  {
    language: 'javascript',
    framework: 'react',
    pattern_regex: "import\\s+React\\s+from\\s+['\"]react['\"]",
    pattern_type: 'Niepotrzebny import',
    description: 'Od React 17+ nie trzeba importować React dla JSX',
    old_code: "import React from 'react';",
    new_code: '// Nie potrzeba importu React dla JSX w React 17+',
    explanation: 'Nowy JSX Transform w React 17+ automatycznie importuje potrzebne funkcje.',
    severity: 'info'
  },
  {
    language: 'javascript',
    framework: 'nextjs',
    pattern_regex: 'getServerSideProps|getStaticProps|getStaticPaths',
    pattern_type: 'Pages Router (stary)',
    description: 'Next.js 13+ używa App Router z Server Components',
    old_code: 'export async function getServerSideProps() { ... }',
    new_code: 'export default async function Page() { const data = await fetch(...); }',
    explanation: 'App Router używa React Server Components.',
    severity: 'warning'
  },
  {
    language: 'javascript',
    framework: 'nextjs',
    pattern_regex: 'next/router',
    pattern_type: 'Przestarzały import',
    description: 'Next.js 13+ używa next/navigation zamiast next/router',
    old_code: "import { useRouter } from 'next/router';",
    new_code: "import { useRouter } from 'next/navigation';",
    explanation: 'App Router wprowadził nowe hooki w next/navigation.',
    severity: 'error'
  },
  {
    language: 'javascript',
    framework: 'none',
    pattern_regex: 'var\\s+\\w+',
    pattern_type: 'Przestarzała deklaracja',
    description: 'var jest przestarzałe - użyj const lub let',
    old_code: 'var name = "John";',
    new_code: 'const name = "John";',
    explanation: 'const i let mają block scope, var ma function scope.',
    severity: 'warning'
  },
  {
    language: 'typescript',
    framework: 'none',
    pattern_regex: ':\\s*any\\b',
    pattern_type: 'Słabe typowanie',
    description: 'Unikaj typu any - użyj konkretnych typów lub unknown',
    old_code: 'function process(data: any) { ... }',
    new_code: 'function process(data: unknown) { ... }',
    explanation: 'any wyłącza type checking. unknown jest bezpieczniejsze.',
    severity: 'warning'
  },
  {
    language: 'python',
    framework: 'none',
    pattern_regex: 'print\\s+[^(]',
    pattern_type: 'Python 2 syntax',
    description: 'print jako statement jest z Python 2 - użyj print()',
    old_code: 'print "Hello"',
    new_code: 'print("Hello")',
    explanation: 'Python 2 zakończył wsparcie w 2020.',
    severity: 'error'
  }
];

// Issue type
interface Issue {
  type: string;
  description: string;
  oldCode: string;
  newCode: string;
  explanation: string;
  severity: string;
}

// Fetch patterns from database or use fallback
async function getPatterns(language: string, framework: string) {
  try {
    // Try to fetch from database
    const { data, error } = await supabase
      .from('mentor_patterns')
      .select('*')
      .eq('is_active', true)
      .or(`language.eq.${language},framework.eq.${framework}`);

    if (error) {
      logger.log('Database not available, using fallback patterns');
      return fallbackPatterns.filter(p =>
        p.language === language || p.framework === framework
      );
    }

    if (data && data.length > 0) {
      return data;
    }

    // Fallback if no data in database
    return fallbackPatterns.filter(p =>
      p.language === language || p.framework === framework
    );
  } catch (e) {
    logger.log('Error fetching patterns, using fallback');
    return fallbackPatterns.filter(p =>
      p.language === language || p.framework === framework
    );
  }
}

// Analyze code for outdated patterns
async function analyzeCode(code: string, language: string, framework: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  const patterns = await getPatterns(language, framework);

  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern.pattern_regex);
      if (regex.test(code)) {
        // Avoid duplicates
        const isDuplicate = issues.some(i => i.type === pattern.pattern_type);
        if (!isDuplicate) {
          issues.push({
            type: pattern.pattern_type,
            description: pattern.description,
            oldCode: pattern.old_code,
            newCode: pattern.new_code,
            explanation: pattern.explanation,
            severity: pattern.severity || 'warning'
          });
        }
      }
    } catch (e) {
      // Skip invalid regex patterns
      logger.error('Invalid regex pattern:', pattern.pattern_regex);
    }
  }

  return issues;
}

// Generate updated code suggestions
function generateUpdatedCode(code: string, issues: Issue[]): string {
  let updatedCode = code;

  // Apply transformations
  for (const issue of issues) {
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

  if (issues.some(i => i.type.includes('any'))) {
    points.push('TypeScript unknown jest bezpieczniejszy niż any - wymusza sprawdzenie typu');
  }

  if (points.length === 0) {
    points.push('Twój kod wygląda na aktualny! Pamiętaj o regularnym sprawdzaniu dokumentacji');
  }

  points.push('Zawsze sprawdzaj daty publikacji kursów i porównuj wersje bibliotek');
  points.push('Oficjalna dokumentacja jest najlepszym źródłem aktualnych informacji');

  return points;
}

// Save validation to database (optional tracking)
async function saveValidation(code: string, language: string, framework: string, courseSource: string, status: string, issuesCount: number) {
  try {
    await supabase.from('mentor_validations').insert({
      code_snippet: code.substring(0, 500), // Only save first 500 chars
      language,
      framework,
      course_source: courseSource,
      status,
      issues_count: issuesCount
    });
  } catch (e) {
    // Silently fail - tracking is optional
  }
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
    const issues = await analyzeCode(code, language || 'javascript', framework || 'none');

    // Determine status
    let status: 'outdated' | 'current' | 'warning' = 'current';
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    if (errorCount > 0 || issues.length >= 3) {
      status = 'outdated';
    } else if (warningCount > 0) {
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
      summary = `Kod zawiera ${issues.length} element${issues.length === 1 ? '' : 'y'}, które można zoptymalizować. Nie są to krytyczne problemy, ale warto je poprawić.`;
    } else {
      summary = 'Kod wygląda na aktualny! Nie znaleziono przestarzałych wzorców. Pamiętaj jednak, że automatyczna analiza nie wykryje wszystkich problemów.';
    }

    // Save validation to database (optional)
    await saveValidation(code, language || 'javascript', framework || 'none', courseSource || '', status, issues.length);

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
    logger.error('Error validating code:', error);
    return NextResponse.json(
      { error: 'Błąd podczas analizy kodu' },
      { status: 500 }
    );
  }
}
