import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import s3Service from '../../../lib/aws-s3.js';

// Wyłącz cache dla tego route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// v4 - disabled caching

// Domyślne strony webring (używane gdy S3 jest puste)
const DEFAULT_SITES = [
  {
    id: '1',
    name: 'KUPMAX Retro',
    url: 'https://kupmax.pl',
    description: 'The ultimate retro Windows 95 experience',
    category: 'Retro',
    icon: '💾',
    owner: 'KupMax Team',
    tags: ['retro', 'windows95', 'nostalgia'],
    approved: true,
    addedAt: Date.now() - 86400000 * 90,
  },
  {
    id: '2',
    name: 'Y2K Aesthetic',
    url: 'https://y2k-aesthetic.com',
    description: 'Vintage Y2K vibes and millennium nostalgia',
    category: 'Aesthetic',
    icon: '✨',
    owner: 'Y2K Community',
    tags: ['y2k', 'aesthetic', 'vintage'],
    approved: true,
    addedAt: Date.now() - 86400000 * 60,
  },
  {
    id: '3',
    name: 'GeoCities Archive',
    url: 'https://geocities.restorativland.org',
    description: 'Preserving the golden age of personal websites',
    category: 'Archive',
    icon: '🌐',
    owner: 'Internet Archive',
    tags: ['geocities', 'archive', 'history'],
    approved: true,
    addedAt: Date.now() - 86400000 * 120,
  },
  {
    id: '4',
    name: 'Windows 95 Tips',
    url: 'https://win95tips.com',
    description: 'Tips and tricks for the best OS ever made',
    category: 'Retro',
    icon: '🖥️',
    owner: 'Win95 Fan Club',
    tags: ['windows95', 'tips', 'retro'],
    approved: true,
    addedAt: Date.now() - 86400000 * 45,
  },
  {
    id: '5',
    name: 'Retro Web Museum',
    url: 'https://theoldnet.com',
    description: 'Browse the web like its 1999',
    category: 'Museum',
    icon: '🏛️',
    owner: 'Old Net Project',
    tags: ['museum', 'vintage', 'web1.0'],
    approved: true,
    addedAt: Date.now() - 86400000 * 30,
  },
];

// Pobierz strony z S3
async function getWebringSites() {
  logger.log('📖 Loading webring sites from S3...');
  const result = await s3Service.loadJsonData('webring', DEFAULT_SITES);
  logger.log('📖 Loaded sites count:', result.data?.length || 0, 'success:', result.success);
  return result.data || DEFAULT_SITES;
}

// Zapisz strony do S3
async function saveWebringSites(sites: any[]) {
  logger.log('💾 Saving webring sites to S3, count:', sites.length);
  const result = await s3Service.saveJsonData('webring', sites);
  logger.log('💾 Save result:', result);
  return result;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const currentUrl = searchParams.get('currentUrl');

    const webringSites = await getWebringSites();

    // Get approved sites
    const approvedSites = webringSites
      .filter((site: any) => site.approved)
      .sort((a: any, b: any) => a.addedAt - b.addedAt);

    if (!currentUrl) {
      return NextResponse.json(
        { sites: approvedSites },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }

    // Find current site index
    const currentIndex = approvedSites.findIndex(
      (site: any) => site.url === currentUrl
    );

    const total = approvedSites.length;
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : total - 1;
    const nextIndex = currentIndex < total - 1 ? currentIndex + 1 : 0;
    const randomIndex = Math.floor(Math.random() * total);

    return NextResponse.json(
      {
        current: approvedSites[currentIndex],
        prev: approvedSites[prevIndex],
        next: approvedSites[nextIndex],
        random: approvedSites[randomIndex],
        total,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    logger.error('Error fetching webring:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webring' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, url, description, category, icon } = await req.json();

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    const webringSites = await getWebringSites();

    const newSite = {
      id: Date.now().toString(),
      name: name.substring(0, 100),
      url,
      description: description?.substring(0, 200) || '',
      category: category || 'General',
      icon: icon || '🌐',
      owner: 'Admin',
      tags: [] as string[],
      approved: true,
      addedAt: Date.now(),
    };

    webringSites.push(newSite);

    // Zapisz do S3
    const saveResult = await saveWebringSites(webringSites);

    if (!saveResult.success) {
      logger.error('Save result:', saveResult);
      return NextResponse.json(
        { error: 'Failed to save to S3', details: saveResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      site: newSite,
      message: 'Site added to webring',
      totalSites: webringSites.length,
      saveResult: saveResult
    });
  } catch (error) {
    logger.error('Error adding to webring:', error);
    return NextResponse.json(
      { error: 'Failed to add site' },
      { status: 500 }
    );
  }
}

// PUT - edytuj stronę webring (dla admina)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, url, description, category, icon } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    let webringSites = await getWebringSites();
    const siteIndex = webringSites.findIndex((site: any) => String(site.id) === String(id));

    if (siteIndex === -1) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Aktualizuj tylko podane pola
    if (name !== undefined) {
      webringSites[siteIndex].name = name.substring(0, 100);
    }
    if (url !== undefined) {
      webringSites[siteIndex].url = url;
    }
    if (description !== undefined) {
      webringSites[siteIndex].description = description.substring(0, 200);
    }
    if (category !== undefined) {
      webringSites[siteIndex].category = category;
    }
    if (icon !== undefined) {
      webringSites[siteIndex].icon = icon;
    }

    // Zapisz do S3
    const saveResult = await saveWebringSites(webringSites);

    if (!saveResult.success) {
      return NextResponse.json(
        { error: 'Failed to save to S3' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      site: webringSites[siteIndex],
      message: 'Site updated'
    });
  } catch (error) {
    logger.error('Error updating webring site:', error);
    return NextResponse.json(
      { error: 'Failed to update site' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    let webringSites = await getWebringSites();
    const initialLength = webringSites.length;

    webringSites = webringSites.filter((site: any) => String(site.id) !== String(id));

    if (webringSites.length === initialLength) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Zapisz do S3
    const saveResult = await saveWebringSites(webringSites);

    return NextResponse.json({
      success: true,
      message: 'Site removed from webring',
      remainingSites: webringSites.length,
      saveResult: saveResult
    });
  } catch (error) {
    logger.error('Error deleting from webring:', error);
    return NextResponse.json(
      { error: 'Failed to delete site' },
      { status: 500 }
    );
  }
}
