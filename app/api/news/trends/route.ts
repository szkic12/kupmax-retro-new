import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// GET - pobierz aktualne trendy i pomysły na artykuły
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'general';

    if (!process.env.ANTHROPIC_API_KEY) {
      // Fallback bez AI
      return NextResponse.json({
        trends: getStaticTrends(category),
        source: 'static',
      });
    }

    const categoryPrompts: Record<string, string> = {
      'tech': 'technologii, programowania, AI, gadżetów, innowacji',
      'retro': 'nostalgii, retro komputerów, Windows 95/98, starych gier, internetu lat 90',
      'health': 'zdrowia naturalnego, ziół, miodu, naturalnych metod leczenia, wellness',
      'diy': 'DIY, majsterkowania, projektów domowych, elektroniki hobbystycznej',
      'general': 'różnych dziedzin - technologii, zdrowia, ciekawostek, nauki',
    };

    const topicFocus = categoryPrompts[category] || categoryPrompts['general'];

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Podaj 8 aktualnych, interesujących tematów do napisania artykułu z dziedziny ${topicFocus}.

Dla każdego tematu podaj:
1. Krótki tytuł (max 60 znaków)
2. Dlaczego to ciekawe (1 zdanie)
3. Unikalny kąt/perspektywa na ten temat

Format JSON:
[
  {
    "title": "tytuł",
    "why": "dlaczego ciekawe",
    "angle": "unikalna perspektywa",
    "tags": ["tag1", "tag2"]
  }
]

Podaj TYLKO JSON, bez dodatkowego tekstu.`
        }
      ],
      system: `Jesteś ekspertem od content marketingu i trendów internetowych. Znasz aktualne wydarzenia z 2024-2025 roku. Sugerujesz tematy które są:
- Aktualne i na czasie
- Mają potencjał viralowy
- Pozwalają na oryginalną perspektywę autora
- Nie są przekopiowanymi newsami z innych portali`
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON from response
    let trends;
    try {
      // Find JSON in response
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        trends = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      logger.error('Error parsing trends:', parseError);
      return NextResponse.json({
        trends: getStaticTrends(category),
        source: 'static',
        error: 'Parse error'
      });
    }

    return NextResponse.json({
      trends,
      source: 'ai',
      category,
      generatedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    logger.error('Error fetching trends:', error);
    return NextResponse.json({
      trends: getStaticTrends('general'),
      source: 'static',
      error: error.message,
    });
  }
}

// Static fallback trends
function getStaticTrends(category: string) {
  const staticTrends: Record<string, any[]> = {
    'tech': [
      { title: 'AI w codziennym życiu - co się zmieniło?', why: 'AI jest wszędzie', angle: 'Twoje osobiste doświadczenia z AI', tags: ['AI', 'technologia'] },
      { title: 'Retro computing wraca do łask', why: 'Nostalgia + praktyczność', angle: 'Dlaczego stare komputery uczą lepiej', tags: ['retro', 'edukacja'] },
      { title: 'Open source vs korporacje', why: 'Gorący temat', angle: 'Lokalny developer perspective', tags: ['opensource', 'programowanie'] },
      { title: 'Czy smartfony nas kontrolują?', why: 'Digital wellness', angle: 'Tydzień bez telefonu - eksperyment', tags: ['wellness', 'technologia'] },
    ],
    'health': [
      { title: 'Miód i jego nieznane właściwości', why: 'Naturalne leczenie wraca', angle: 'Lokalne pasieki i ich sekrety', tags: ['miód', 'zdrowie'] },
      { title: 'Pyłki kwiatowe - superfood z natury', why: 'Rosnące zainteresowanie', angle: 'Moje doświadczenia z pyłkami', tags: ['pyłki', 'natura'] },
      { title: 'Las jako terapia - Shinrin-yoku', why: 'Japońska mądrość', angle: 'Polski las kontra japoński', tags: ['las', 'medytacja'] },
      { title: 'Grzyby - nie tylko do jedzenia', why: 'Mykologia zyskuje popularność', angle: 'Grzyby lecznicze w Polsce', tags: ['grzyby', 'zdrowie'] },
    ],
    'retro': [
      { title: 'Windows 95 - 30 lat minęło', why: 'Rocznica kultowego systemu', angle: 'Czego nauczyło nas Win95', tags: ['windows', 'nostalgia'] },
      { title: 'Gry które ukształtowały pokolenie', why: 'Nostalgia millennialsów', angle: 'Twoje ulubione gry z dzieciństwa', tags: ['gry', 'retro'] },
      { title: 'Internet dial-up - wspomnienia', why: 'Kontrast z dzisiejszym netem', angle: 'Czy wolniejszy internet był lepszy?', tags: ['internet', 'nostalgia'] },
      { title: 'Kasety, dyskietki, CD-ROM', why: 'Fizyczne nośniki wracają', angle: 'Kolekcjonerstwo retro', tags: ['retro', 'kolekcje'] },
    ],
    'general': [
      { title: 'Lokalne inicjatywy które zmieniają świat', why: 'Myśl globalnie, działaj lokalnie', angle: 'Co dzieje się w Twojej okolicy', tags: ['społeczność', 'lokalne'] },
      { title: 'Minimalizm w erze konsumpcjonizmu', why: 'Trend anty-konsumpcyjny', angle: 'Mój eksperyment z minimalizmem', tags: ['minimalizm', 'lifestyle'] },
      { title: 'Kreatywność w czasach AI', why: 'Czy AI zabije twórczość?', angle: 'AI jako narzędzie, nie zamiennik', tags: ['AI', 'kreatywność'] },
      { title: 'Przyszłość pracy zdalnej', why: 'Post-pandemiczna rewolucja', angle: 'Praca z lasu/góry - czy to możliwe?', tags: ['praca', 'lifestyle'] },
    ],
  };

  return staticTrends[category] || staticTrends['general'];
}
