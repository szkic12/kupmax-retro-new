import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getToken } from 'next-auth/jwt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Adresy e-mail z prawami administratora.
 *
 * WAŻNE: NextAuth loguje przez Google i przepuszcza KAŻDE konto Google.
 * Bez tej listy dowolna osoba z internetu mogłaby publikować i kasować
 * wpisy. Sesja NextAuth jest uznawana za adminowską tylko wtedy, gdy
 * e-mail znajduje się poniżej.
 *
 * Listę można nadpisać zmienną ADMIN_EMAILS (adresy po przecinku).
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'investcrewe@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Verify admin from request. Accepts either:
 * - a NextAuth session belonging to an address on the admin list
 * - a legacy token from the `admin_sessions` table
 *
 * Token can be in:
 * - Authorization header: "Bearer <token>"
 * - Cookie: "admin_token=<token>"
 * - Body: { adminToken: "<token>" }
 */
export async function verifyAdminToken(request: NextRequest, body?: any): Promise<boolean> {
  try {
    // 1. Sesja NextAuth — tak loguje się panelrudy.
    //    Bez tego panel dostawał 401 przy każdej publikacji.
    if (await hasAdminSession(request)) return true;

    // 2. Check Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (await isValidToken(token)) return true;
    }

    // 3. Check Cookie
    const cookieToken = request.cookies.get('admin_token')?.value;
    if (cookieToken && await isValidToken(cookieToken)) return true;

    // 4. Check body (if provided)
    if (body?.adminToken && await isValidToken(body.adminToken)) return true;

    return false;
  } catch (error) {
    console.error('Admin auth error:', error);
    return false;
  }
}

/**
 * Czy żądanie niesie sesję NextAuth należącą do administratora.
 */
async function hasAdminSession(request: NextRequest): Promise<boolean> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return false;

  const token = await getToken({ req: request, secret });
  const email = token?.email?.toLowerCase();

  return !!email && ADMIN_EMAILS.includes(email);
}

/**
 * Check if token exists in admin_sessions and is not expired
 */
async function isValidToken(token: string): Promise<boolean> {
  if (!token || token.length < 10) return false;

  try {
    const { data, error } = await supabase
      .from('admin_sessions')
      .select('token')
      .eq('token', token)
      .gte('expires_at', new Date().toISOString())
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * Get client IP for rate limiting
 */
export function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

/**
 * Simple in-memory rate limiter
 */
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Cleanup old entries occasionally
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) rateLimitStore.delete(key);
    }
  }

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  entry.count++;
  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);

  return { allowed, remaining, resetTime: entry.resetTime };
}
