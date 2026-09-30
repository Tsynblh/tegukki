import { db } from "@/lib/db/client";
import { transactions, productVariants, products, users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Clock,
} from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user } = await requireRole(["admin"]);
  if (!user) redirect("/login");

  // Hitung awal hari ini (00:00:00)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 1. Transaksi Hari Ini (Hanya transaksi sah, abaikan transaksi yang dibatalkan/void)
  const todayTransactions = await db
    .select()
    .from(transactions)
    .where(
      and(
        gte(transactions.createdAt, todayStart),
        isNull(transactions.deletedAt)
      )
    );

  const totalOmzet = todayTransactions.reduce(
    (sum, t) => sum + parseFloat(t.totalAmount),
    0
  );
  const totalStruk = todayTransactions.length;

  const cashOmzet = todayTransactions
    .filter((t) => t.paymentMethod === "cash")
    .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);

  const nonCashOmzet = todayTransactions
    .filter((t) => t.paymentMethod !== "cash")
    .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);

  // 2. Transaksi Terbaru (6 Terakhir)
  const recentTransactions = await db
    .select({
      id: transactions.id,
      transactionCode: transactions.transactionCode,
      createdAt: transactions.createdAt,
      totalAmount: transactions.totalAmount,
      paymentMethod: transactions.paymentMethod,
      cashierName: users.username,
      deletedAt: transactions.deletedAt,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .orderBy(desc(transactions.createdAt))
    .limit(6);

  // 3. Peringatan Stok Rendah (stok <= 5)
  const lowStockVariants = await db
    .select({
      id: productVariants.id,
      size: productVariants.size,
      color: productVariants.color,
      stock: productVariants.stock,
      productName: products.name,
    })
    .from(productVariants)
    .leftJoin(products, eq(productVariants.productId, products.id))
    .where(sql`${productVariants.stock} <= 5`)
    .orderBy(productVariants.stock)
    .limit(5);

  return (
    <main className="min-h-screen bg-background pb-12">
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                Ringkasan Hari Ini
              </h1>
              <span className="text-xs font-medium bg-secondary/15 text-secondary px-3 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/transaksi"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-sm transition-all active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buka Kasir POS</span>
            </Link>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Total Omzet */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-sm font-medium">Total Omzet Hari Ini</span>
            </div>
            <div className="mt-4">
              <div className="font-mono text-2xl md:text-3xl font-bold text-foreground">
                {formatCurrency(totalOmzet)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                Penjualan terakumulasi hari ini
              </p>
            </div>
          </div>

          {/* Card 2: Jumlah Transaksi */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-sm font-medium">Jumlah Transaksi</span>
            </div>
            <div className="mt-4">
              <div className="font-mono text-2xl md:text-3xl font-bold text-foreground">
                {totalStruk}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  struk
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Rata-rata:{" "}
                <span className="font-mono font-semibold text-foreground">
                  {totalStruk > 0
                    ? formatCurrency(totalOmzet / totalStruk)
                    : "Rp 0"}
                </span>
              </p>
            </div>
          </div>

          {/* Card 3: Rekap Kas & QRIS */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-sm font-medium">Rekap Kas Laci & QRIS</span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Kas Tunai Laci</span>
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(cashOmzet)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Non-Tunai (QRIS/EDC)</span>
                <span className="font-mono font-bold text-secondary">
                  {formatCurrency(nonCashOmzet)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Transaksi Terbaru & Peringatan Stok */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Transaksi Terbaru */}
          <div className="lg:col-span-7 bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-base text-foreground">
                  Transaksi Terbaru
                </h2>
                <p className="text-xs text-muted-foreground">
                  Mutasi register kasir terkini
                </p>
              </div>
              <Link
                href="/transactions"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-semibold">Waktu</th>
                    <th className="py-2.5 px-3 font-semibold">Kode</th>
                    <th className="py-2.5 px-3 font-semibold">Kasir</th>
                    <th className="py-2.5 px-3 font-semibold">Metode</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border text-xs text-foreground">
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Belum ada transaksi hari ini.
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((trx) => {
                      const isVoided = Boolean(trx.deletedAt);
                      return (
                        <tr
                          key={trx.id}
                          className={`hover:bg-muted/30 transition-colors ${
                            isVoided ? "opacity-60 bg-muted/20 line-through" : ""
                          }`}
                        >
                          <td className="py-3 px-3 text-muted-foreground">
                            {formatDate(trx.createdAt.toISOString())}
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-primary">
                            {trx.transactionCode}
                            {isVoided && (
                              <span className="ml-1.5 text-[10px] text-destructive no-underline font-sans font-bold">
                                (Void)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-xs">@{trx.cashierName || "kasir"}</td>
                          <td className="py-3 px-3 uppercase font-mono text-[11px] text-muted-foreground">
                            {trx.paymentMethod}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                            {formatCurrency(parseFloat(trx.totalAmount))}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Kolom Kanan: Peringatan Stok Rendah */}
          <div className="lg:col-span-5 bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-base text-foreground">
                  Peringatan Stok Rendah
                </h2>
                <p className="text-xs text-muted-foreground">
                  Varian tumbler yang perlu restock
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive">
                {lowStockVariants.length} Item
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {lowStockVariants.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Semua stok varian masih aman (di atas 5 unit).
                </div>
              ) : (
                lowStockVariants.map((item) => {
                  const variantDesc = [item.size, item.color].filter(Boolean).join(" / ") || "Standar";
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {item.productName}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate">
                            Varian: {variantDesc}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                            item.stock === 0
                              ? "bg-destructive/10 text-destructive"
                              : "bg-secondary/15 text-secondary"
                          }`}
                        >
                          {item.stock === 0 ? "Habis (0)" : `Sisa ${item.stock}`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-border">
              <Link
                href="/products"
                className="w-full py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Kelola Katalog & Stok</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
