import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const body = await request.json();

    // Log honeypot access to database
    try {
      await supabase.from('admin_login_logs').insert({
        ip_address: ip,
        success: false,
        reason: `honeypot_access: ${body.path || '/retro-admin'}`,
      });
    } catch (e) {
      console.log('Could not log honeypot access:', e);
    }

    // Return success to not alert attacker
    return NextResponse.json({ logged: true });

  } catch {
    return NextResponse.json({ logged: false });
  }
}
