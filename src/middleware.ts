import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = atob(padded);

    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isAccessTokenExpired(accessToken: unknown): boolean {
  if (typeof accessToken !== 'string' || accessToken.trim().length === 0) {
    return true;
  }

  const payload = decodeJwtPayload(accessToken);
  const exp = payload?.exp;

  if (typeof exp !== 'number') {
    return false;
  }

  return Date.now() >= exp * 1000;
}

export default withAuth(
  function middleware(req: NextRequest) {
    const token = (req as any).nextauth?.token;
    
    // Si el usuario está autenticado y navega a "/", redirigir a "/paddy"
    if (token && req.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/paddy", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Permitir acceso a "/" sin autenticación (para login)
        if (req.nextUrl.pathname === "/") {
          return true;
        }

        // Proteger otras rutas: exigir token de sesión y accessToken vigente.
        if (!token) {
          return false;
        }

        const accessToken = (token as any).accessToken;
        if (isAccessTokenExpired(accessToken)) {
          return false;
        }

        return true;
      },
    },
    pages: {
      signIn: "/",
    },
  }
);

// Aplicar middleware a todas las rutas
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - api routes
     * - any public file with an extension (e.g. favicon.ico, manifest.json, logo.svg)
     */
    "/((?!api|_next/static|_next/image|.*\\..*).*)",
  ],
};

