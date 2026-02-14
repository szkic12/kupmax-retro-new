import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Firmy które ukończyły grę Hive Sounds (9 planet) mają dostęp do retro shopu
const REQUIRED_PLANETS = 9;

export async function GET(req: NextRequest) {
  try {
    // Pobierz firmy z activePlanets = 9 (ukończyły wszystkie zadania Hive Sounds)
    const { data: companies, error } = await supabase
      .from('Company')
      .select('id, name, slug, logo, description')
      .eq('activePlanets', REQUIRED_PLANETS)
      .eq('companyStatus', 'APPROVED')
      .eq('verified', true)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Error fetching sellers:', error.message);
      return NextResponse.json({
        sellers: [],
        error: 'Failed to fetch sellers'
      });
    }

    // Mapuj na format dla /shop
    const sellers = (companies || []).map(company => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      logo: company.logo,
      description: company.description,
    }));

    logger.log(`Found ${sellers.length} sellers with ${REQUIRED_PLANETS} planets (Hive Sounds complete)`);

    return NextResponse.json({
      sellers,
      total: sellers.length,
      requiredPlanets: REQUIRED_PLANETS,
    });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({
      sellers: [],
      error: 'Internal server error'
    });
  }
}
