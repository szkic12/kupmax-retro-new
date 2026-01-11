import { NextRequest, NextResponse } from 'next/server';

// Mock webring sites (replace with Supabase later)
let webringSites = [
  {
    id: '1',
    name: 'KUPMAX Retro',
    url: 'https://kupmax.pl',
    description: 'The ultimate retro experience',
    category: 'retro',
    approved: true,
    addedAt: Date.now() - 86400000 * 90,
  },
  {
    id: '2',
    name: 'Y2K Aesthetic',
    url: 'https://y2k-aesthetic.com',
    description: 'Vintage Y2K vibes and nostalgia',
    category: 'retro',
    approved: true,
    addedAt: Date.now() - 86400000 * 60,
  },
  {
    id: '3',
    name: 'GeoCities Archive',
    url: 'https://geocities-archive.org',
    description: 'Preserving the old web',
    category: 'archive',
    approved: true,
    addedAt: Date.now() - 86400000 * 120,
  },
  {
    id: '4',
    name: 'Windows 95 Fan Site',
    url: 'https://win95.net',
    description: 'Dedicated to the best OS ever',
    category: 'retro',
    approved: true,
    addedAt: Date.now() - 86400000 * 45,
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const currentUrl = searchParams.get('currentUrl');

    // Get approved sites
    const approvedSites = webringSites
      .filter((site) => site.approved)
      .sort((a, b) => a.addedAt - b.addedAt);

    if (!currentUrl) {
      return NextResponse.json({ sites: approvedSites });
    }

    // Find current site index
    const currentIndex = approvedSites.findIndex(
      (site) => site.url === currentUrl
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
    const { name, url, description, category } = await req.json();

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    const newSite = {
      id: Date.now().toString(),
      name: name.substring(0, 100),
      url,
      description: description?.substring(0, 200) || '',
      category: category || 'general',
      approved: false, // Requires approval
      addedAt: Date.now(),
    };

    webringSites.push(newSite);

    return NextResponse.json({
      success: true,
      site: newSite,
      message: 'Site submitted for approval'
    });
  } catch (error) {
    console.error('Error adding to webring:', error);
    return NextResponse.json(
      { error: 'Failed to add site' },
      { status: 500 }
    );
  }
}
