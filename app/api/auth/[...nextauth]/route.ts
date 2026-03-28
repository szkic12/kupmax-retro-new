import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

/**
 * NextAuth configuration for session management
 * 
 * SECURITY NOTES:
 * - NEXTAUTH_SECRET: Required for signing session tokens. Generate with:
 *   openssl rand -base64 32
 * - Google OAuth: Optional. If not configured, Google provider will be skipped.
 * - CSRF protection: Automatically provided by NextAuth when properly configured
 * 
 * Environment Variables Required:
 * - NEXTAUTH_SECRET: Session signing key (critical for production)
 * 
 * Environment Variables Optional:
 * - GOOGLE_CLIENT_ID: For Google OAuth sign-in
 * - GOOGLE_CLIENT_SECRET: For Google OAuth sign-in
 */

// Build providers array based on available configuration
const providers = [];

// Only add Google provider if both credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
} else if (process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_SECRET) {
  // Log warning if only one is partially configured
  console.warn(
    '[NextAuth] Google OAuth is not fully configured. ' +
    'Both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.'
  );
}

// Fallback empty provider array - will be shown as "No providers configured"
if (providers.length === 0) {
  console.warn(
    '[NextAuth] No authentication providers configured. ' +
    'Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET for Google OAuth.'
  );
}

const handler = NextAuth({
  providers: providers.length > 0 ? providers : [],
  
  callbacks: {
    async session({ session, token }) {
      // Session callback is called whenever session is accessed
      // Provides an opportunity to modify session object
      return session;
    },
  },

  // Session signing secret - MUST be set in production
  secret: process.env.NEXTAUTH_SECRET || (
    process.env.NODE_ENV === 'production'
      ? undefined // Force error in production if not set
      : 'dev-secret-key-change-in-production'
  ),

  // Configuration for session handling
  session: {
    strategy: 'jwt',
  },
});

export { handler as GET, handler as POST };
