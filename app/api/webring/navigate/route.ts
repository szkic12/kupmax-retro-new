import { NextRequest, NextResponse } from 'next/server';

// Webring sites database
const webringSites = [
  {
    id: '1',
    name: 'KUPMAX Retro',
    url: 'https://kupmax.pl',
    description: 'The ultimate retro Windows 95 experience',
    category: 'Retro',
    icon: '💾',
    owner: 'KupMax Team',
    tags: ['retro', 'windows95', 'nostalgia'],
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
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const currentUrl = searchParams.get('currentUrl') || '';
    const direction = searchParams.get('direction') || 'next';

    const sites = webringSites;
    const totalSites = sites.length;

    if (totalSites === 0) {
      return NextResponse.json({
        success: false,
        error: 'No sites in webring',
      });
    }

    // Find current site index (default to -1 if not found)
    let currentIndex = sites.findIndex(
      (site) => site.url === currentUrl || currentUrl.includes(site.url.replace('https://', ''))
    );

    // If current URL not found, start from beginning
    if (currentIndex === -1) {
      currentIndex = 0;
    }

    let targetIndex: number;

    switch (direction) {
      case 'prev':
        targetIndex = currentIndex > 0 ? currentIndex - 1 : totalSites - 1;
        break;
      case 'next':
        targetIndex = currentIndex < totalSites - 1 ? currentIndex + 1 : 0;
        break;
      case 'random':
        do {
          targetIndex = Math.floor(Math.random() * totalSites);
        } while (targetIndex === currentIndex && totalSites > 1);
        break;
      default:
        targetIndex = 0;
    }

    const targetSite = sites[targetIndex];

    return NextResponse.json({
      success: true,
      targetSite,
      navigation: {
        currentIndex: targetIndex,
        totalSites,
        hasPrev: true,
        hasNext: true,
      },
    });
  } catch (error) {
    console.error('Webring navigate error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to navigate webring' },
      { status: 500 }
    );
  }
}
