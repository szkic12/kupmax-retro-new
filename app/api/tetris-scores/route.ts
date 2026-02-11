import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// In-memory storage for high scores (temporary)
// In production, use Supabase or database
let highScores: Array<{
  id: string;
  name: string;
  score: number;
  level: number;
  lines: number;
  timestamp: number;
}> = [
  { id: '1', name: 'PLAYER1', score: 10000, level: 5, lines: 50, timestamp: Date.now() - 86400000 },
  { id: '2', name: 'RETRO', score: 8500, level: 4, lines: 42, timestamp: Date.now() - 172800000 },
  { id: '3', name: 'KUPMAX', score: 7200, level: 4, lines: 38, timestamp: Date.now() - 259200000 },
];

export async function GET() {
  try {
    // Sort by score descending, take top 10
    const sorted = [...highScores]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return NextResponse.json({ scores: sorted });
  } catch (error) {
    logger.error('Error fetching scores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scores' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, score, level, lines } = await req.json();

    if (!name || typeof score !== 'number') {
      return NextResponse.json(
        { error: 'Invalid score data' },
        { status: 400 }
      );
    }

    const newScore = {
      id: Date.now().toString(),
      name: name.substring(0, 20).toUpperCase(),
      score,
      level: level || 1,
      lines: lines || 0,
      timestamp: Date.now(),
    };

    highScores.push(newScore);

    // Keep only top 50 scores
    highScores = highScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    return NextResponse.json({ success: true, score: newScore });
  } catch (error) {
    logger.error('Error saving score:', error);
    return NextResponse.json(
      { error: 'Failed to save score' },
      { status: 500 }
    );
  }
}
