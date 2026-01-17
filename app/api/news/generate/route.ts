import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// POST - generuj artykuł z pomocą AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, style, language = 'pl' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Temat/prompt jest wymagany' },
        { status: 400 }
      );
    }

    // Sprawdź czy mamy klucz API
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Brak klucza API - skonfiguruj ANTHROPIC_API_KEY' },
        { status: 500 }
      );
    }

    const styleGuide = {
      'news': 'Napisz w stylu profesjonalnego artykułu newsowego. Krótkie akapity, konkretne fakty, obiektywny ton.',
      'blog': 'Napisz w stylu blogowym - osobisty ton, własne przemyślenia, angażujący styl.',
      'tech': 'Napisz w stylu technicznym - szczegółowe wyjaśnienia, terminologia branżowa, praktyczne przykłady.',
      'casual': 'Napisz w luźnym, przyjaznym stylu - jak rozmowa z kumplem, z humorem.',
      'retro': 'Napisz w nostalgicznym stylu lat 90/2000 - nawiązania do starego internetu, emocjonalny ton.',
    };

    const selectedStyle = styleGuide[style as keyof typeof styleGuide] || styleGuide['blog'];

    const systemPrompt = `Jesteś dziennikarzem/blogerem piszącym dla portalu KUPMAX - retro-stylowej strony w stylu Windows 95.

${selectedStyle}

Zasady:
- Pisz po ${language === 'pl' ? 'polsku' : 'angielsku'}
- Użyj formatowania: **pogrubienie**, *kursywa*, listy
- Dodaj kreatywny tytuł na początku (jedna linia)
- Artykuł powinien mieć 3-5 akapitów
- Bądź autentyczny, nie kopiuj - dawaj własną perspektywę
- Możesz dodać emoji dla retro klimatu 💾🖥️📟

Format odpowiedzi:
TYTUŁ: [tytuł artykułu]
---
[treść artykułu]`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Napisz artykuł na temat: ${prompt}`
        }
      ],
      system: systemPrompt,
    });

    // Wyciągnij tekst z odpowiedzi
    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json(
        { error: 'Nieoczekiwany format odpowiedzi' },
        { status: 500 }
      );
    }

    const fullText = content.text;

    // Parsuj tytuł i treść
    let title = '';
    let articleContent = fullText;

    if (fullText.includes('TYTUŁ:')) {
      const parts = fullText.split('---');
      const titleLine = parts[0].replace('TYTUŁ:', '').trim();
      title = titleLine;
      articleContent = parts.slice(1).join('---').trim();
    } else {
      // Fallback - pierwsza linia jako tytuł
      const lines = fullText.split('\n');
      title = lines[0].replace(/^#+\s*/, '').trim();
      articleContent = lines.slice(1).join('\n').trim();
    }

    return NextResponse.json({
      success: true,
      title,
      content: articleContent,
      excerpt: articleContent.substring(0, 150).replace(/[*#_]/g, '') + '...',
    });

  } catch (error: any) {
    console.error('Error generating article:', error);

    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Nieprawidłowy klucz API' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Błąd generowania artykułu: ' + (error.message || 'Nieznany błąd') },
      { status: 500 }
    );
  }
}
