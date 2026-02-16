import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Dozwolone emaile adminów
const ADMIN_EMAILS = ['kontakt@kupmax.pl', 'investcrewe@gmail.com'];

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('next-auth.session-token') || cookieStore.get('__Secure-next-auth.session-token');

    if (!sessionCookie) {
      return NextResponse.json({ success: false, isAdmin: false });
    }

    // For now, just return that session exists
    // Full admin check would require decoding the JWT or checking session
    return NextResponse.json({
      success: true,
      isAdmin: false // Default to false, admin check happens elsewhere
    });
  } catch (error) {
    return NextResponse.json({ success: false, isAdmin: false });
  }
}
