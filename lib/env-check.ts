/**
 * Environment variable validation utility
 * Call validateEnvVars() once at startup to verify required configuration
 */

export function validateEnvVars() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`[ENV] Missing required variables: ${missing.join(', ')}`);
  }

  // Optional but recommended variables
  const recommended = [
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];

  const missingRecommended = recommended.filter(key => !process.env[key]);

  if (missingRecommended.length > 0) {
    console.warn(`[ENV] Missing recommended variables: ${missingRecommended.join(', ')}`);
  }

  // Validate that critical URLs are properly formatted
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
      console.warn('[ENV] NEXT_PUBLIC_SUPABASE_URL should start with https://');
    }
  }
}
