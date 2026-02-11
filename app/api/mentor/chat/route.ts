import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// System prompt for Mentor - coding assistant
const mentorSystemPrompt = `Jesteś Mentor - ekspert programowania w KUPMAX IDE. Pomagasz użytkownikom uczyć się kodowania.

Twoja specjalizacja:
- JavaScript, TypeScript, React, Next.js
- HTML, CSS, Tailwind
- Node.js, Supabase, PostgreSQL
- Git, deployment, best practices

Styl odpowiedzi:
- Odpowiadaj po polsku
- Bądź konkretny i pomocny
- Używaj przykładów kodu gdy to pomoże
- Formatuj kod w blokach markdown
- Wskazuj błędy i sugeruj poprawki
- Jeśli kod jest przestarzały, pokaż nowoczesną alternatywę

Jeśli użytkownik wgra kod:
- Przeanalizuj go pod kątem błędów
- Zasugeruj ulepszenia
- Wyjaśnij co kod robi jeśli pytają`;

// Fallback responses when API unavailable
const fallbackResponses: Record<string, string> = {
  'greeting': `👋 **Cześć! Jestem Mentor.**

Mogę pomóc Ci z:
• React, Next.js, TypeScript
• HTML, CSS, JavaScript
• Supabase, bazy danych
• Git i deployment

Wgraj projekt i zapytaj o kod!

*Uwaga: AI offline - podstawowe odpowiedzi*`,

  'help': `**Mentor może pomóc z:**

📘 **Frontend:** React, Next.js, Vue, HTML/CSS
📗 **Backend:** Node.js, Supabase, PostgreSQL
📙 **Narzędzia:** Git, VS Code, deployment

Wgraj kod przez ZIP lub folder, a pomogę Ci go zrozumieć i ulepszyć!

*Uwaga: AI offline - pełna pomoc po aktywacji API*`,

  'error': `**Pomoc z błędami:**

1. Wgraj plik z błędem
2. Opisz co próbujesz osiągnąć
3. Wklej pełny tekst błędu

Popularne błędy:
• \`Cannot read property\` - sprawdź czy zmienna istnieje
• \`Module not found\` - sprawdź importy
• \`TypeError\` - niezgodność typów

*AI offline - podstawowa diagnostyka*`,

  'default': `Rozumiem pytanie, ale potrzebuję aktywnego AI żeby w pełni pomóc.

**Tymczasowo mogę:**
• Pokazać podstawowe przykłady kodu
• Wyjaśnić popularne koncepty
• Pomóc z nawigacją po IDE

Wgraj kod a przeanalizuję go gdy API będzie aktywne!`
};

// Get fallback response based on message content
function getFallbackResponse(message: string): string {
  const msgLower = message.toLowerCase();

  if (msgLower.match(/^(cze[sś][cć]|hej|siema|witaj|hello|hi)\b/)) {
    return fallbackResponses.greeting;
  }
  if (msgLower.match(/pomoc|help|co umiesz|możesz/)) {
    return fallbackResponses.help;
  }
  if (msgLower.match(/błąd|error|nie działa|problem/)) {
    return fallbackResponses.error;
  }

  return fallbackResponses.default;
}

// Build context from file if provided
function buildFileContext(fileContext?: { name: string; content: string; language: string }): string {
  if (!fileContext || !fileContext.content) return '';

  const truncatedContent = fileContext.content.slice(0, 3000);
  return `\n\n---\nAktualnie otwarty plik: ${fileContext.name} (${fileContext.language})\n\`\`\`${fileContext.language}\n${truncatedContent}\n\`\`\``;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, fileContext } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Wiadomość jest wymagana' },
        { status: 400 }
      );
    }

    // Try Claude API first
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey && apiKey.length > 10) {
      try {
        const anthropic = new Anthropic({ apiKey });

        // Build user message with file context
        const userMessage = message + buildFileContext(fileContext);

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system: mentorSystemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        });

        const assistantMessage = response.content[0];
        const messageText = assistantMessage.type === 'text' ? assistantMessage.text : '';

        return NextResponse.json({
          response: messageText,
          source: 'ai'
        });
      } catch (apiError: any) {
        logger.log('Mentor Claude API unavailable:', apiError?.message);
        // Fall through to offline mode
      }
    }

    // Fallback to offline responses
    const fallbackResponse = getFallbackResponse(message);

    return NextResponse.json({
      response: fallbackResponse,
      source: 'offline'
    });

  } catch (error) {
    logger.error('Mentor chat error:', error);
    return NextResponse.json({
      response: '❌ Wystąpił błąd. Spróbuj ponownie.',
      source: 'error'
    });
  }
}
