import { NextRequest, NextResponse } from 'next/server';

// Mock download files (replace with Supabase later)
const mockFiles = [
  {
    id: '1',
    name: 'KUPMAX_Brochure_2026.pdf',
    description: 'Official KUPMAX company brochure',
    size: 2457600, // 2.5 MB
    category: 'documents',
    url: '/downloads/brochure.pdf',
    downloads: 142,
    uploadedAt: Date.now() - 86400000 * 7,
  },
  {
    id: '2',
    name: 'RetroSoftware_v1.0.zip',
    description: 'Collection of retro software tools',
    size: 16777216, // 16 MB
    category: 'software',
    url: '/downloads/retro-software.zip',
    downloads: 89,
    uploadedAt: Date.now() - 86400000 * 14,
  },
  {
    id: '3',
    name: 'Windows95_Wallpapers.zip',
    description: 'Classic Windows 95 wallpaper pack',
    size: 5242880, // 5 MB
    category: 'media',
    url: '/downloads/wallpapers.zip',
    downloads: 256,
    uploadedAt: Date.now() - 86400000 * 21,
  },
  {
    id: '4',
    name: 'Retro_Icons_Pack.zip',
    description: 'Pixelated retro icon collection',
    size: 1048576, // 1 MB
    category: 'media',
    url: '/downloads/icons.zip',
    downloads: 178,
    uploadedAt: Date.now() - 86400000 * 30,
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    let files = mockFiles;

    // Filter by category if provided
    if (category) {
      files = files.filter((f) => f.category === category);
    }

    // Sort by upload date (newest first)
    files = files.sort((a, b) => b.uploadedAt - a.uploadedAt);

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error fetching downloads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch downloads' },
      { status: 500 }
    );
  }
}
