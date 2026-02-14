import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Firmy muszą ukończyć 9 zadań Hive Sounds żeby mieć dostęp do retro shopu
const REQUIRED_PLANETS = 9;

// Funkcja pobierająca ID firm które ukończyły Hive Sounds (9 planet)
async function getAllowedSellerIds(): Promise<string[]> {
  try {
    const { data: companies, error } = await supabase
      .from('Company')
      .select('id')
      .eq('activePlanets', REQUIRED_PLANETS)
      .eq('companyStatus', 'APPROVED')
      .eq('verified', true);

    if (error || !companies) {
      logger.error('Error fetching allowed sellers:', error?.message);
      return [];
    }

    return companies.map(c => c.id);
  } catch (error) {
    logger.error('Error in getAllowedSellerIds:', error);
    return [];
  }
}

// Fallback produkty - pokazywane gdy brak prawdziwych produktów
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
    const seller = searchParams.get('seller');
    const search = searchParams.get('search');

    let products: any[] = [];
    let total = 0;

    // Pobierz dynamicznie firmy które ukończyły Hive Sounds (9 planet)
    const allowedSellerIds = await getAllowedSellerIds();

    if (allowedSellerIds.length === 0) {
      // Brak firm z 9 planetami - użyj fallback
      logger.log('No companies with 9 planets found, using fallback products');
      let filtered = [...FALLBACK_PRODUCTS];

      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
        );
      }

      const start = (page - 1) * perPage;
      return NextResponse.json({
        products: filtered.slice(start, start + perPage),
        total: filtered.length,
        page,
        perPage,
        hasMore: filtered.length > start + perPage,
        source: 'fallback',
        message: 'Żadna firma nie ukończyła jeszcze Hive Sounds (9 planet)',
      });
    }

    // Pobierz produkty od firm z 9 planetami
    let query = supabase
      .from('Product')
      .select('*', { count: 'exact' })
      .eq('status', 'ACTIVE')
      .eq('moderationStatus', 'APPROVED')
      .order('createdAt', { ascending: false });

    // Filtruj po konkretnym sprzedawcy lub wszystkich dozwolonych
    if (seller && allowedSellerIds.includes(seller)) {
      query = query.eq('sellerId', seller);
    } else {
      query = query.in('sellerId', allowedSellerIds);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Supabase error:', error.message);
    }

    if (!error && data && data.length > 0) {
      // Mamy prawdziwe produkty od firm z 9 planetami!
      logger.log(`Found ${data.length} products from Hive Sounds verified companies`);
      products = data;
      total = count || data.length;

      // Filtruj po wyszukiwaniu
      if (search) {
        const searchLower = search.toLowerCase();
        products = products.filter((p: any) =>
          p.name?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
        );
        total = products.length;
      }
    } else {
      // Brak produktów - użyj fallback
      logger.log('No products from verified companies, using fallback products');
      let filtered = [...FALLBACK_PRODUCTS];

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
