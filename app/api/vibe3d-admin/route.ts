import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { firestore } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

async function isAdmin(email: string): Promise<boolean> {
  try {
    const doc = await firestore.collection('config').doc('admins').get();
    const emails: string[] = doc.data()?.emails || [];
    return emails.map((e: string) => e.toLowerCase()).includes(email.toLowerCase());
  } catch {
    return false;
  }
}

interface WelcomeVideoEntry {
  id: string;
  uid: string;
  userNickname: string;
  userAvatar: string;
  videoUrl: string;
  status: string;
  scenario: string;
  comments: Array<{ author: string; text: string }>;
  modelId: string;
  chosenProvider?: string;
  usedProvider?: string;
  createdAt: string | null;
  completedAt: string | null;
  isGuest: boolean;
}

interface BudgetStats {
  dailyMax: number;
  currentDay: string;
  count: number;
  totalCount: number;
  falCount: number;
  replicateCount: number;
  paused: boolean;
  forceProvider: string | null;
  estimatedCostUSD: number;
  estimatedCostTodayUSD: number;
}

const FAL_COST_PER_VIDEO = 0.20; // USD estimate
const REPLICATE_COST_PER_VIDEO = 0.15;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Load welcomeVideos (limit 100 newest)
    const snap = await firestore
      .collection('welcomeVideos')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const videos: WelcomeVideoEntry[] = snap.docs.map((d) => {
      const data = d.data();
      const uid = data.uid ?? '';
      return {
        id: d.id,
        uid,
        userNickname: data.userNickname ?? 'Anonymous',
        userAvatar: data.userAvatar ?? '',
        videoUrl: data.videoUrl ?? '',
        status: data.status ?? 'unknown',
        scenario: data.scenario ?? '',
        comments: Array.isArray(data.comments) ? data.comments : [],
        modelId: data.modelId ?? '',
        chosenProvider: data.chosenProvider,
        usedProvider: data.usedProvider,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
        completedAt: data.completedAt?.toDate?.()?.toISOString?.() ?? null,
        isGuest: uid.startsWith('guest_'),
      };
    });

    // Load budget
    const budgetDoc = await firestore.collection('admin').doc('welcomeVideoBudget').get();
    const b = budgetDoc.exists ? (budgetDoc.data() || {}) : {};
    const falCount = Number(b.falCount || 0);
    const replicateCount = Number(b.replicateCount || 0);
    const totalCount = Number(b.totalCount || 0);
    const todayCount = Number(b.count || 0);

    const stats: BudgetStats = {
      dailyMax: Number(b.dailyMax || 100),
      currentDay: String(b.currentDay || ''),
      count: todayCount,
      totalCount,
      falCount,
      replicateCount,
      paused: Boolean(b.paused),
      forceProvider: (b.forceProvider as string) || null,
      estimatedCostUSD: falCount * FAL_COST_PER_VIDEO + replicateCount * REPLICATE_COST_PER_VIDEO,
      estimatedCostTodayUSD: 0, // computed below
    };

    // Today cost: sum from videos with createdAt today
    const today = new Date().toISOString().slice(0, 10);
    let todayFalCount = 0;
    let todayReplicateCount = 0;
    for (const v of videos) {
      if (!v.createdAt) continue;
      if (!v.createdAt.startsWith(today)) continue;
      if (v.usedProvider === 'fal') todayFalCount++;
      else if (v.usedProvider === 'replicate') todayReplicateCount++;
    }
    stats.estimatedCostTodayUSD = todayFalCount * FAL_COST_PER_VIDEO + todayReplicateCount * REPLICATE_COST_PER_VIDEO;

    return NextResponse.json({ success: true, videos, stats });
  } catch (e) {
    logger.error('vibe3d-admin GET failed:', e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'updateBudget') {
      const { dailyMax, paused, forceProvider } = body;
      const update: Record<string, unknown> = {};
      if (typeof dailyMax === 'number' && dailyMax >= 0 && dailyMax <= 10000) {
        update.dailyMax = dailyMax;
      }
      if (typeof paused === 'boolean') {
        update.paused = paused;
      }
      if (forceProvider === 'fal' || forceProvider === 'replicate' || forceProvider === null) {
        update.forceProvider = forceProvider;
      }
      if (Object.keys(update).length === 0) {
        return NextResponse.json({ success: false, error: 'No valid fields' }, { status: 400 });
      }
      await firestore.collection('admin').doc('welcomeVideoBudget').set(update, { merge: true });
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteVideo') {
      const { videoId } = body;
      if (!videoId) {
        return NextResponse.json({ success: false, error: 'videoId required' }, { status: 400 });
      }
      await firestore.collection('welcomeVideos').doc(videoId).delete();
      return NextResponse.json({ success: true });
    }

    if (action === 'resetCountersDaily') {
      const today = new Date().toISOString().slice(0, 10);
      await firestore.collection('admin').doc('welcomeVideoBudget').set(
        { currentDay: today, count: 0 },
        { merge: true }
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    logger.error('vibe3d-admin POST failed:', e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
