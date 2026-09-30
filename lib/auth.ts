import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "tegukki-fallback-super-secret-key-min-32";
export const AUTH_COOKIE_NAME = "tegukki_token";

export interface TokenPayload {
  id: string;
  username: string;
  role: "admin" | "kasir";
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireRole(allowedRoles: Array<"admin" | "kasir">): Promise<{
  user: TokenPayload | null;
  errorResponse?: NextResponse;
}> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Anda harus login terlebih dahulu" } },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "Akses ditolak: role Anda tidak memiliki izin untuk aksi ini",
          },
        },
        { status: 403 }
      ),
    };
  }

  return { user };
}
