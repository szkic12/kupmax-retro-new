import { NextRequest, NextResponse } from 'next/server';

// Wyłącz cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Pobierz strony z głównego API
async function getWebringSites() {
  try {
    // Użyj wewnętrznego URL dla API
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/webring`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      return data.sites || [];
    }
  } catch (error) {
    console.error('Error fetching webring sites:', error);
  }
  return [];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const currentUrl = searchParams.get('currentUrl') || '';
    const direction = searchParams.get('direction') || 'next';

    const sites = await getWebringSites();
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
