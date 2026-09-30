import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "tegukki_token";

// Rute yang hanya boleh diakses oleh Admin
const ADMIN_ONLY_ROUTES = ["/dashboard", "/discounts", "/users"];

// Rute terlindungi (kasir & admin)
const PROTECTED_ROUTES = [
  "/transaksi",
  "/products",
  "/transactions",
  ...ADMIN_ONLY_ROUTES,
];

// Helper parse payload JWT tanpa library verifikasi (karena Edge Runtime Next.js)
function decodeJwtPayload(token: string): { role?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Jika mencoba akses halaman terlindungi tanpa token -> redirect ke /login
  if (isProtectedRoute) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = decodeJwtPayload(token);
    if (!payload || (payload.exp && Date.now() >= payload.exp * 1000)) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(AUTH_COOKIE_NAME);
      return response;
    }

    // Jika kasir mencoba akses rute khusus admin -> redirect ke /transaksi
    const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    if (isAdminOnlyRoute && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/transaksi", request.url));
    }
  }

  // Jika sudah login dan mengakses /login -> redirect ke halaman default sesuai role
  if (pathname === "/login" && token) {
    const payload = decodeJwtPayload(token);
    if (payload && (!payload.exp || Date.now() < payload.exp * 1000)) {
      const destination = payload.role === "admin" ? "/dashboard" : "/transaksi";
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/discounts/:path*",
    "/users/:path*",
    "/transaksi/:path*",
    "/products/:path*",
    "/transactions/:path*",
    "/login",
  ],
};
