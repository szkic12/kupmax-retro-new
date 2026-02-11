import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Fallback produkty - pokazywane gdy brak prawdziwych produktów z showInRetro = true
// Usunąć/zastąpić gdy KUPMAX PSA doda prawdziwe produkty (BossxD, Inception Honey)
const FALLBACK_PRODUCTS = [
  {
    id: 'fallback-1',
    name: 'Retro Keyboard PS/2',
    description: 'Klasyczna klawiatura mechaniczna w stylu lat 90. Idealna do retro setupu!',
    price: 149.99,
    currency: 'PLN',
    category: 'Hardware',
    images: ['/images/products/keyboard.jpg'],
    stock: 15,
    moderationStatus: 'APPROVED',
    isKupmaxProduct: true,
    showInRetro: true,
  },
  {
    id: 'fallback-2',
    name: 'CRT Monitor 17"',
    description: 'Autentyczny monitor CRT do retro gamingu. Idealne kolory i zero input lag!',
    price: 299.99,
    currency: 'PLN',
    category: 'Hardware',
    images: ['/images/products/crt.jpg'],
    stock: 5,
    moderationStatus: 'APPROVED',
    isKupmaxProduct: true,
    showInRetro: true,
  },
  {
    id: 'fallback-3',
    name: 'Windows 95 T-Shirt',
    description: 'Koszulka z logo Windows 95. 100% bawełna, rozmiary S-XXL.',
    price: 79.99,
    currency: 'PLN',
    category: 'Merch',
    images: ['/images/products/tshirt.jpg'],
    stock: 50,
    moderationStatus: 'APPROVED',
    isKupmaxProduct: true,
    showInRetro: true,
  },
  {
    id: 'fallback-4',
    name: 'Floppy Disk Pack (10szt)',
    description: 'Zestaw 10 dyskietek 3.5" - idealne do archiwizacji!',
    price: 49.99,
    currency: 'PLN',
    category: 'Accessories',
    images: ['/images/products/floppy.jpg'],
    stock: 30,
    moderationStatus: 'APPROVED',
    isKupmaxProduct: true,
    showInRetro: true,
  },
  {
    id: 'fallback-5',
    name: 'Retro Mouse Ball',
    description: 'Klasyczna myszka kulkowa. Pamiętasz te czasy?',
    price: 59.99,
    currency: 'PLN',
    category: 'Hardware',
    images: ['/images/products/mouse.jpg'],
    stock: 20,
    moderationStatus: 'APPROVED',
    isKupmaxProduct: true,
    showInRetro: true,
  },
  {
    id: 'fallback-6',
    name: 'Dial-Up Modem USB',
    description: 'Dekoracyjny modem dial-up z dźwiękami połączenia!',
    price: 89.99,
    currency: 'PLN',
    category: 'Accessories',
    images: ['/images/products/modem.jpg'],
    stock: 10,
    moderationStatus: 'APPROVED',
    isKupmaxProduct: true,
    showInRetro: true,
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let products: any[] = [];
    let total = 0;

    // Pobierz produkty z Supabase gdzie showInRetro = true
    // To są produkty które mają się pokazywać w Shop.exe (kupmax.pl)
    const { data, error, count } = await supabase
      .from('Product')
      .select('*', { count: 'exact' })
      .eq('showInRetro', true)
      .eq('moderationStatus', 'APPROVED')
      .order('createdAt', { ascending: false });

    if (error) {
      logger.error('Supabase error:', error.message);
    }

    if (!error && data && data.length > 0) {
      // Mamy prawdziwe produkty z bazy!
      logger.log(`Found ${data.length} products with showInRetro=true`);
      products = data;
      total = count || data.length;

      // Filtruj po kategorii jeśli podana
      if (category && category !== 'all') {
        products = products.filter((p: any) => p.category === category);
      }

      // Filtruj po wyszukiwaniu
      if (search) {
        const searchLower = search.toLowerCase();
        products = products.filter((p: any) =>
          p.name?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
        );
      }

      total = products.length;
    } else {
      // Brak produktów z showInRetro=true - użyj fallback
      logger.log('No products with showInRetro=true, using fallback products');
      let filtered = [...FALLBACK_PRODUCTS];

      if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
        );
      }

      products = filtered;
      total = filtered.length;
    }

    // Paginacja
    const start = (page - 1) * perPage;
    const paginatedProducts = products.slice(start, start + perPage);

    return NextResponse.json({
      products: paginatedProducts,
      total,
      page,
      perPage,
      hasMore: total > start + perPage,
      source: products[0]?.id?.startsWith('fallback') ? 'fallback' : 'database',
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    // W razie błędu zwróć fallback
    return NextResponse.json({
      products: FALLBACK_PRODUCTS,
      total: FALLBACK_PRODUCTS.length,
      page: 1,
      perPage: 12,
      hasMore: false,
      source: 'fallback',
      error: 'Database error, showing fallback products',
    });
  }
}
