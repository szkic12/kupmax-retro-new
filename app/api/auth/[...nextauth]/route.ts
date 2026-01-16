import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// Tylko te emaile mogą się zalogować do panelu admina
const ADMIN_EMAILS = [
  'kontakt@kupmax.pl',
  // Dodaj inne emaile adminów jeśli potrzeba
];

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Sprawdź czy email jest na liście adminów
      if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        return true;
      }
      // Odmów dostępu dla innych
      return false;
    },
    async session({ session, token }) {
      // Dodaj info o adminie do sesji
      if (session.user) {
        (session.user as Record<string, unknown>).isAdmin = true;
      }
      return session;
    },
  },
  pages: {
    signIn: '/panelrudy',
    error: '/panelrudy',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
