import { NextRequest, NextResponse } from 'next/server';
import s3Service from '../../../lib/aws-s3.js';

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
  const result = await s3Service.loadJsonData('webring', DEFAULT_SITES);
  return result.data || DEFAULT_SITES;
}

// Zapisz strony do S3
async function saveWebringSites(sites: any[]) {
  return await s3Service.saveJsonData('webring', sites);
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
      return NextResponse.json({ sites: approvedSites });
    }

    // Find current site index
    const currentIndex = approvedSites.findIndex(
      (site: any) => site.url === currentUrl
    );

    const total = approvedSites.length;
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : total - 1;
    const nextIndex = currentIndex < total - 1 ? currentIndex + 1 : 0;
    const randomIndex = Math.floor(Math.random() * total);

    return NextResponse.json({
      current: approvedSites[currentIndex],
      prev: approvedSites[prevIndex],
      next: approvedSites[nextIndex],
      random: approvedSites[randomIndex],
      total,
    });
  } catch (error) {
    console.error('Error fetching webring:', error);
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
      return NextResponse.json(
        { error: 'Failed to save to S3' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      site: newSite,
      message: 'Site added to webring'
    });
  } catch (error) {
    console.error('Error adding to webring:', error);
    return NextResponse.json(
      { error: 'Failed to add site' },
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

    webringSites = webringSites.filter((site: any) => site.id !== id);

    if (webringSites.length === initialLength) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Zapisz do S3
    await saveWebringSites(webringSites);

    return NextResponse.json({
      success: true,
      message: 'Site removed from webring'
    });
  } catch (error) {
    console.error('Error deleting from webring:', error);
    return NextResponse.json(
      { error: 'Failed to delete site' },
      { status: 500 }
    );
  }
}
