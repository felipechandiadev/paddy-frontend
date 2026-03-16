import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    accessToken: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
      accessToken: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    accessToken: string;
  }
}
