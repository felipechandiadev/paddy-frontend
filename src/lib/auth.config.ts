import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciales inválidas");
        }

        try {
          // Call backend API (Paddy Backend on port 3000)
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
          const loginUrl = `${apiUrl}/auth/login`;
          
          console.log("🔐 NextAuth Login Attempt:");
          console.log(`   URL: ${loginUrl}`);
          console.log(`   Email: ${credentials.email}`);

          const response = await fetch(loginUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          console.log(`   Response Status: ${response.status}`);

          if (!response.ok) {
            const errorText = await response.text();
            console.log(`   Error Response: ${errorText}`);
            throw new Error(`Backend returned ${response.status}`);
          }

          const data = await response.json();
          console.log(`   Login Success - User ID: ${data.data.userId}`);

          // Return user object with token (matching Paddy API response)
          return {
            id: data.data.userId,
            name: data.data.name || data.data.email,
            email: data.data.email,
            role: data.data.role,
            accessToken: data.data.access_token,
          };
        } catch (error) {
          console.error("❌ Login error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add user data and token to JWT on sign in
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user data to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = (token.name as string | undefined) ?? session.user.name;
        session.user.email = (token.email as string | undefined) ?? session.user.email;
        session.user.role = token.role as string;
        session.user.accessToken = token.accessToken as string;

        // Refresh mutable profile fields from backend to avoid stale UI after user edits.
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
          const meResponse = await fetch(`${apiUrl}/auth/me`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token.accessToken}`,
            },
            cache: 'no-store',
          });

          if (meResponse.ok) {
            const mePayload = await meResponse.json();
            const meData = mePayload?.data ?? mePayload;

            session.user.id = String(meData.userId ?? session.user.id);
            session.user.name = String(meData.name ?? session.user.name ?? '');
            session.user.email = String(meData.email ?? session.user.email ?? '');
            session.user.role = String(meData.role ?? session.user.role ?? '');
          }
        } catch (error) {
          console.warn('Unable to refresh auth profile from backend /auth/me', error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || "ayg-sales-secret-key-2026",
};
