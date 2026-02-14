import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - pobierz aktywną sondę
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      logger.error('Error fetching poll:', error);
      return NextResponse.json({ error: 'Failed to fetch poll' }, { status: 500 });
    }

    return NextResponse.json({ poll: data }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - zagłosuj
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pollId, option } = body;

    if (!pollId || !option) {
      return NextResponse.json(
        { error: 'Poll ID i opcja są wymagane' },
        { status: 400 }
      );
    }

    // Pobierz aktualną sondę
    const { data: poll, error: fetchError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (fetchError || !poll) {
      logger.error('Error fetching poll for vote:', fetchError);
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Zaktualizuj głosy
    const currentVotes = poll.votes || {};
    currentVotes[option] = (currentVotes[option] || 0) + 1;

    const { data, error } = await supabase
      .from('polls')
      .update({
        votes: currentVotes,
        total_votes: (poll.total_votes || 0) + 1
      })
      .eq('id', pollId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating poll votes:', error);
      return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
    }

    return NextResponse.json({
      poll: data,
      message: 'Głos zapisany!',
      votes: currentVotes
    });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - stwórz nową sondę (admin)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, options } = body;

    if (!question || !options || !Array.isArray(options)) {
      return NextResponse.json(
        { error: 'Pytanie i opcje są wymagane' },
        { status: 400 }
      );
    }

    // Dezaktywuj wszystkie inne sondy
    await supabase
      .from('polls')
      .update({ is_active: false })
      .eq('is_active', true);

    // Utwórz nową sondę
    const initialVotes: Record<string, number> = {};
    options.forEach((opt: string) => {
      initialVotes[opt] = 0;
    });

    const { data, error } = await supabase
      .from('polls')
      .insert({
        question,
        options,
        votes: initialVotes,
        total_votes: 0,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating poll:', error);
      return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
    }

    return NextResponse.json({ poll: data, message: 'Sonda utworzona!' });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
