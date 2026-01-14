import { NextRequest, NextResponse } from 'next/server';
import s3Service from '../../../../lib/aws-s3.js';

// Wyłącz cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Domyślne strony (fallback)
const DEFAULT_SITES = [
  { id: '1', name: 'KUPMAX Retro', url: 'https://kupmax.pl', description: 'Retro', category: 'Retro', icon: '💾', owner: 'KupMax', tags: [], approved: true },
];

// Pobierz strony z S3
async function getWebringSites() {
  console.log('📖 Navigate: Loading webring from S3...');
  try {
    const result = await s3Service.loadJsonData('webring', DEFAULT_SITES);
    console.log('📖 Navigate: S3 result success:', result.success, 'count:', result.data?.length);
    const allSites = result.data || DEFAULT_SITES;
    const approved = allSites.filter((site: any) => site.approved);
    console.log('📖 Navigate: Approved sites:', approved.length);
    return approved;
  } catch (error) {
    console.error('📖 Navigate: S3 error:', error);
    return DEFAULT_SITES;
  }
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
