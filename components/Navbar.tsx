"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  LayoutDashboard,
  ShoppingCart,
  Package,
  History,
  Tag,
  Users,
  LogOut,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  currentUser?: {
    username: string;
    role: "admin" | "kasir";
  } | null;
}

export function Navbar({ currentUser }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  // Jika di halaman login, navbar tidak perlu tampil
  if (pathname === "/login") return null;

  const isAdmin = currentUser?.role === "admin";

  const navLinks = [
    // Menu Admin Only
    ...(isAdmin
      ? [
          {
            href: "/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
          },
        ]
      : []),
    // Menu Shared
    {
      href: "/transaksi",
      label: "Kasir POS",
      icon: ShoppingCart,
    },
    {
      href: "/products",
      label: "Produk",
      icon: Package,
    },
    {
      href: "/transactions",
      label: "Riwayat",
      icon: History,
    },
    // Menu Admin Only
    ...(isAdmin
      ? [
          {
            href: "/discounts",
            label: "Diskon",
            icon: Tag,
          },
          {
            href: "/users",
            label: "Kasir",
            icon: Users,
          },
        ]
      : []),
  ];

  return (
    <header className="print:hidden sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href={isAdmin ? "/dashboard" : "/transaksi"} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[var(--radius)] bg-primary/10 text-primary flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <span className="font-serif text-lg font-bold text-foreground">
              Tegukki
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        {currentUser && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <UserCheck className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{currentUser.username}</span>
            </div>

            <button
              onClick={handleLogout}
              title="Keluar"
              className="p-2 rounded-[var(--radius)] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
