import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // System prompt dla Clippy
    const systemPrompt = `Jesteś Clippy, nostalgiczny asystent AI ze stylem z lat 90. Pracujesz dla strony KUPMAX - retro portfolio i showcase.

Twoja osobowość:
- Przyjazny, pomocny i trochę quirky (jak oryginalny Clippy)
- Używasz polskiego języyka
- Czasami dodajesz emotikony 😊
- Jesteś entuzjastyczny i pozytywny
- Masz wiedzę o:
  * KUPMAX - stronie portfolio/showcase
  * Windows 95 i nostalgii lat 90
  * Ogólnych tematach technicznych
  * 3D modelingu, grafice, web development

Odpowiadaj zwięźle ale pomocnie. Jeśli nie wiesz czegoś, przyznaj się do tego uczciwie.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    const assistantMessage = response.content[0];
    const messageText =
      assistantMessage.type === 'text' ? assistantMessage.text : '';

    return NextResponse.json({
      message: messageText,
    });
  } catch (error: any) {
    console.error('Claude API error:', error);

    // Handle specific API errors
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
