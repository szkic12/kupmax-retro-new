import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Przykładowe produkty jako fallback
const SAMPLE_PRODUCTS = [
  {
    id: '1',
    name: 'Retro Keyboard PS/2',
    description: 'Klasyczna klawiatura mechaniczna w stylu lat 90. Idealna do retro setupu!',
    price: 149.99,
    category: 'Hardware',
    imageUrl: '/images/products/keyboard.jpg',
    stock: 15,
    moderationStatus: 'APPROVED',
  },
  {
    id: '2',
    name: 'CRT Monitor 17"',
    description: 'Autentyczny monitor CRT do retro gamingu. Idealne kolory i zero input lag!',
    price: 299.99,
    category: 'Hardware',
    imageUrl: '/images/products/crt.jpg',
    stock: 5,
    moderationStatus: 'APPROVED',
  },
  {
    id: '3',
    name: 'Windows 95 T-Shirt',
    description: 'Koszulka z logo Windows 95. 100% bawełna, rozmiary S-XXL.',
    price: 79.99,
    category: 'Merch',
    imageUrl: '/images/products/tshirt.jpg',
    stock: 50,
    moderationStatus: 'APPROVED',
  },
  {
    id: '4',
    name: 'Floppy Disk Pack (10szt)',
    description: 'Zestaw 10 dyskietek 3.5" - idealne do archiwizacji!',
    price: 49.99,
    category: 'Accessories',
    imageUrl: '/images/products/floppy.jpg',
    stock: 30,
    moderationStatus: 'APPROVED',
  },
  {
    id: '5',
    name: 'Retro Mouse Ball',
    description: 'Klasyczna myszka kulkowa. Pamiętasz te czasy?',
    price: 59.99,
    category: 'Hardware',
    imageUrl: '/images/products/mouse.jpg',
    stock: 20,
    moderationStatus: 'APPROVED',
  },
  {
    id: '6',
    name: 'Dial-Up Modem USB',
    description: 'Dekoracyjny modem dial-up z dźwiękami połączenia!',
    price: 89.99,
    category: 'Accessories',
    imageUrl: '/images/products/modem.jpg',
    stock: 10,
    moderationStatus: 'APPROVED',
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Próbuj pobrać z Supabase (tabela 'products' lub 'Product')
    let products: any[] = [];
    let total = 0;

    // Najpierw spróbuj tabeli 'products' (mała litera)
    let { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      // Spróbuj 'Product' (duża litera - stara nazwa)
      const result = await supabase
        .from('Product')
        .select('*', { count: 'exact' })
        .eq('moderationStatus', 'APPROVED')
        .order('createdAt', { ascending: false });

      data = result.data;
      error = result.error;
      count = result.count;
    }

    if (error || !data || data.length === 0) {
      // Użyj sample products jako fallback
      console.log('Using sample products as fallback');
      let filtered = [...SAMPLE_PRODUCTS];

      if (category) {
        filtered = filtered.filter(p => p.category === category);
      }
      if (search) {
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase())
        );
      }

      const start = (page - 1) * perPage;
      products = filtered.slice(start, start + perPage);
      total = filtered.length;
    } else {
      products = data;
      total = count || data.length;

      // Apply filters if from Supabase
      if (category && products.length > 0) {
        products = products.filter((p: any) => p.category === category);
      }
      if (search && products.length > 0) {
        products = products.filter((p: any) =>
          p.name?.toLowerCase().includes(search.toLowerCase())
        );
      }
    }

    const start = (page - 1) * perPage;

    return NextResponse.json({
      products: products || [],
      total: total || 0,
      page,
      perPage,
      hasMore: total > start + perPage,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    // Zwróć sample products nawet przy błędzie
    return NextResponse.json({
      products: SAMPLE_PRODUCTS,
      total: SAMPLE_PRODUCTS.length,
      page: 1,
      perPage: 12,
      hasMore: false,
    });
  }
}
