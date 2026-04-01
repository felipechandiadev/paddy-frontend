import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const LOCAL_BACKEND_API_URL = "http://localhost:3000/api/v1";
const AUTH_BACKEND_TIMEOUT_MS = 10000;

function resolveBackendApiUrl(): string {
  const configuredUrl =
    process.env.BACKEND_API_URL ||
    process.env.NEXTAUTH_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL;

  if (configuredUrl && configuredUrl.trim().length > 0) {
    return configuredUrl.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_BACKEND_API_URL;
  }

  throw new Error("BACKEND_API_URL_NOT_CONFIGURED");
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = AUTH_BACKEND_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function readMessageFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const source = payload as Record<string, unknown>;
  const candidates = [
    source.message,
    source.error,
    (source.data as Record<string, unknown> | undefined)?.message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }

    if (Array.isArray(candidate) && candidate.length > 0) {
      const merged = candidate
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean)
        .join(" | ");

      if (merged.length > 0) {
        return merged;
      }
    }
  }

  return null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials, _req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciales inválidas");
        }

        try {
          const apiUrl = resolveBackendApiUrl();
          const loginUrl = `${apiUrl}/auth/login`;

          let response: Response;

          try {
            response = await fetchWithTimeout(loginUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            });
          } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
              throw new Error("AUTH_BACKEND_TIMEOUT");
            }

            throw new Error("AUTH_BACKEND_UNREACHABLE");
          }

          const rawResponse = await response.text();
          let payload: unknown = null;

          if (rawResponse) {
            try {
              payload = JSON.parse(rawResponse);
            } catch {
              payload = null;
            }
          }

          if (response.status === 401 || response.status === 403) {
            return null;
          }

          if (!response.ok) {
            const message =
              readMessageFromPayload(payload) ||
              rawResponse.slice(0, 200) ||
              `Backend returned ${response.status}`;
            throw new Error(message);
          }

          if (!payload || typeof payload !== "object") {
            throw new Error("AUTH_BACKEND_INVALID_JSON_RESPONSE");
          }

          const data = payload as {
            data?: {
              access_token?: string;
              userId?: string | number;
              email?: string;
              name?: string;
              role?: string;
              permissions?: string[];
            };
          };
          const accessToken = data?.data?.access_token;
          const userId = data?.data?.userId;
          const email = data?.data?.email;
          const role = data?.data?.role;

          if (!accessToken || !userId || !email || !role) {
            throw new Error("AUTH_BACKEND_INVALID_PAYLOAD");
          }

          // Return user object with token (matching Paddy API response)
          return {
            id: String(userId),
            name: data.data?.name || email,
            email,
            role,
            accessToken,
            permissions: data.data?.permissions ?? [],
          };
        } catch (error) {
          console.error("NextAuth login error:", error);
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
        token.permissions = user.permissions ?? [];
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
        session.user.permissions = (token.permissions as string[] | undefined) ?? [];

        // Refresh mutable profile fields from backend to avoid stale UI after user edits.
        try {
          const apiUrl = resolveBackendApiUrl();
          const meResponse = await fetchWithTimeout(`${apiUrl}/auth/me`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token.accessToken}`,
            },
            cache: 'no-store',
          });

          if (meResponse.ok) {
            const rawMePayload = await meResponse.text();

            if (!rawMePayload) {
              return session;
            }

            const mePayload = JSON.parse(rawMePayload);
            const meData = mePayload?.data ?? mePayload;

            session.user.id = String(meData.userId ?? session.user.id);
            session.user.name = String(meData.name ?? session.user.name ?? '');
            session.user.email = String(meData.email ?? session.user.email ?? '');
            session.user.role = String(meData.role ?? session.user.role ?? '');
            if (Array.isArray(meData.permissions)) {
              session.user.permissions = meData.permissions as string[];
            }
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
