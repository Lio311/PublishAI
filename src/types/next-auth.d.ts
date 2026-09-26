import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extended session user shape.
   */
  interface Session {
    user: {
      id: string;
      role?: string;
      credits?: number;
      institution?: string;
      field?: string;
    } & DefaultSession["user"];
  }

  /**
   * Extended user shape returned by providers and database adapter.
   */
  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    credits?: number;
    institution?: string;
    field?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extended JWT shape.
   */
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string;
    credits?: number;
  }
}

declare module "@auth/core/types" {
  interface Session {
    user: {
      id: string;
      role?: string;
      credits?: number;
      institution?: string;
      field?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    credits?: number;
    institution?: string;
    field?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string;
    credits?: number;
  }
}
