// features/transactions/components/TransactionHistoryView.tsx
"use client";

import * as React from "react";
import {
  Search,
  FileSpreadsheet,
  Printer,
  Ban,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import * as XLSX from "xlsx";
import { ReceiptPrint } from "./ReceiptPrint";
import type { TransactionSummary } from "../types";

export interface HistoryItem {
  id: string;
  productName: string;
  price: string;
  quantity: number;
  lineTotal: string;
}

export interface HistoryDiscount {
  id: string;
  name: string;
  percentage: string;
}

export interface HistoryTransaction {
  id: string;
  transactionCode: string;
  createdAt: string;
  subtotal: string;
  taxAmount: string;
  totalDiscountAmount: string;
  totalAmount: string;
  paymentMethod: "cash" | "qris" | "other";
  cashReceived: string | null;
  changeAmount: string | null;
  deletedAt: string | null;
  cashierName: string;
  items: HistoryItem[];
  discounts: HistoryDiscount[];
}

interface Props {
  initialTransactions: HistoryTransaction[];
  isAdmin: boolean;
}

export function TransactionHistoryView({
  initialTransactions,
  isAdmin,
}: Props) {
  const [trxList, setTrxList] = React.useState<HistoryTransaction[]>(initialTransactions);
  const [selectedId, setSelectedId] = React.useState<string>(
    initialTransactions[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [periodFilter, setPeriodFilter] = React.useState<"today" | "month" | "all">("today");
  const [isVoiding, setIsVoiding] = React.useState(false);

  // Filter List
  const filteredTransactions = trxList.filter((trx) => {
    const trxDate = new Date(trx.createdAt);
    const now = new Date();

    let matchPeriod = true;
    if (periodFilter === "today") {
      matchPeriod =
        trxDate.getDate() === now.getDate() &&
        trxDate.getMonth() === now.getMonth() &&
        trxDate.getFullYear() === now.getFullYear();
    } else if (periodFilter === "month") {
      matchPeriod =
        trxDate.getMonth() === now.getMonth() &&
        trxDate.getFullYear() === now.getFullYear();
    }

    const matchSearch =
      trx.transactionCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trx.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trx.items.some((i) =>
        i.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchPeriod && matchSearch;
  });

  const selectedTransaction =
    trxList.find((t) => t.id === selectedId) || filteredTransactions[0] || null;

  const printSummary: TransactionSummary | null = selectedTransaction
    ? {
        transactionCode: selectedTransaction.transactionCode,
        createdAt: selectedTransaction.createdAt,
        cashierName: selectedTransaction.cashierName,
        items: selectedTransaction.items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          price: parseFloat(i.price),
          lineTotal: parseFloat(i.lineTotal),
        })),
        subtotal: parseFloat(selectedTransaction.subtotal),
        discountAmount: parseFloat(selectedTransaction.totalDiscountAmount),
        taxAmount: parseFloat(selectedTransaction.taxAmount),
        totalAmount: parseFloat(selectedTransaction.totalAmount),
        paymentMethod: selectedTransaction.paymentMethod,
        cashReceived: selectedTransaction.cashReceived
          ? parseFloat(selectedTransaction.cashReceived)
          : null,
        changeAmount: selectedTransaction.changeAmount
          ? parseFloat(selectedTransaction.changeAmount)
          : null,
      }
    : null;

  // Ringkasan Statistik Periode Terpilih
  const validTransactions = filteredTransactions.filter((t) => !t.deletedAt);
  const totalOmzet = validTransactions.reduce(
    (sum, t) => sum + parseFloat(t.totalAmount),
    0
  );
  const totalVolume = validTransactions.length;
  const cashCount = validTransactions.filter((t) => t.paymentMethod === "cash").length;
  const cashPercentage = totalVolume > 0 ? Math.round((cashCount / totalVolume) * 100) : 0;
  const nonCashPercentage = 100 - cashPercentage;

  // Ekspor Excel
  function handleExportExcel() {
    if (filteredTransactions.length === 0) {
      alert("Tidak ada transaksi untuk diekspor.");
      return;
    }

    const dataToExport = filteredTransactions.map((t) => ({
      "Kode Transaksi": t.transactionCode,
      "Waktu": formatDate(t.createdAt),
      "Kasir": t.cashierName,
      "Status": t.deletedAt ? "Dibatalkan (Void)" : "Selesai",
      "Metode": t.paymentMethod.toUpperCase(),
      "Subtotal (Rp)": parseFloat(t.subtotal),
      "Total Diskon (Rp)": parseFloat(t.totalDiscountAmount),
      "PPN 11% (Rp)": parseFloat(t.taxAmount),
      "Total Akhir (Rp)": parseFloat(t.totalAmount),
      "Jumlah Item": t.items.reduce((acc, i) => acc + i.quantity, 0),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Transaksi");
    XLSX.writeFile(
      workbook,
      `Tegukki_Transaksi_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  }

  // Cetak Struk
  function handlePrintReceipt() {
    window.print();
  }

  // Batalkan Transaksi (Void)
  async function handleVoid(trx: HistoryTransaction) {
    if (!isAdmin) {
      alert("Hanya Administrator yang memiliki wewenang membatalkan transaksi.");
      return;
    }

    if (
      !confirm(
        `Apakah Anda yakin ingin membatalkan (VOID) transaksi ${trx.transactionCode}?\n\nStok produk akan otomatis dikembalikan ke etalase.`
      )
    ) {
      return;
    }

    setIsVoiding(true);
    try {
      const res = await fetch(`/api/transactions/${trx.id}/void`, {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok) {
        setTrxList((prev) =>
          prev.map((t) =>
            t.id === trx.id ? { ...t, deletedAt: new Date().toISOString() } : t
          )
        );
        alert("Transaksi berhasil dibatalkan dan stok telah dikembalikan.");
      } else {
        alert(data.error?.message || "Gagal membatalkan transaksi.");
      }
    } catch {
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setIsVoiding(false);
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
            Riwayat Transaksi
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Periode */}
          <div className="bg-muted p-1 rounded-xl flex items-center border border-border">
            <button
              onClick={() => setPeriodFilter("today")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                periodFilter === "today"
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPeriodFilter("month")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                periodFilter === "month"
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriodFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                periodFilter === "all"
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua
            </button>
          </div>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Stat Bar Banner - Balanced Height */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <span className="text-xs text-muted-foreground">Total Omzet Periode Ini</span>
          <div className="font-mono text-2xl md:text-3xl font-bold text-secondary mt-2">
            {formatCurrency(totalOmzet)}
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <span className="text-xs text-muted-foreground">Volume Transaksi</span>
          <div className="font-mono text-2xl md:text-3xl font-bold text-foreground mt-2">
            {totalVolume}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              transaksi berhasil
            </span>
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <span className="text-xs text-muted-foreground">Komposisi Tender Pembayaran</span>
          <div className="mt-2 space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span>Tunai ({cashPercentage}%)</span>
              <span>QRIS ({nonCashPercentage}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
              <div
                className="h-full bg-primary"
                style={{ width: `${cashPercentage}%` }}
              />
              <div
                className="h-full bg-secondary"
                style={{ width: `${nonCashPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Split: Table (7 cols) & Receipt Inspector (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Tabel Transaksi */}
        <div className="lg:col-span-7 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari kode struk, produk, atau kasir..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 h-10 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-muted/90 backdrop-blur z-10 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">No. Struk</th>
                  <th className="py-3 px-4 font-semibold">Waktu</th>
                  <th className="py-3 px-4 font-semibold">Kasir</th>
                  <th className="py-3 px-4 text-right font-semibold">Total</th>
                  <th className="py-3 px-4 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-foreground">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                      Tidak ada data transaksi yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => {
                    const isSelected = t.id === selectedTransaction?.id;
                    const isVoided = Boolean(t.deletedAt);

                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedId(t.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary/10 font-medium"
                            : "hover:bg-muted/30"
                        } ${isVoided ? "opacity-60 bg-muted/20 line-through" : ""}`}
                      >
                        <td className="py-3.5 px-4 font-mono font-semibold text-primary">
                          {t.transactionCode}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {formatDate(t.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs">@{t.cashierName}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                          {formatCurrency(parseFloat(t.totalAmount))}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isVoided ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-destructive font-semibold">
                              <XCircle className="w-3.5 h-3.5" />
                              Void
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Selesai
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan: Preview Struk Terpilih */}
        <div className="lg:col-span-5 bg-card rounded-xl border border-border shadow-sm p-5 flex flex-col gap-4 sticky top-20">
          {selectedTransaction ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">
                    Detail Struk Kasir
                  </span>
                </div>
                {selectedTransaction.deletedAt && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-destructive/10 text-destructive">
                    VOID
                  </span>
                )}
              </div>

              {/* Tampilan Struk Kertas */}
              <div
                id="receipt-preview-card"
                className="bg-background p-4 rounded-xl border border-dashed border-border font-mono text-xs space-y-3 shadow-inner"
              >
                {/* Header Struk */}
                <div className="text-center space-y-0.5 pb-2.5 border-b border-dashed border-border">
                  <div className="font-serif text-base font-bold text-foreground tracking-wide">
                    TEGUKKI
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Outlet Pantai Losari, Makassar
                  </div>
                  <div className="text-[10px] text-muted-foreground pt-1">
                    No: {selectedTransaction.transactionCode} | Kasir: @{selectedTransaction.cashierName}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatDate(selectedTransaction.createdAt)}
                  </div>
                </div>

                {/* Daftar Item */}
                <div className="space-y-2 py-1 max-h-[220px] overflow-y-auto pr-1">
                  {selectedTransaction.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <div className="min-w-0 pr-2">
                        <div className="font-medium text-foreground truncate">
                          {item.productName}
                        </div>
                        <div className="text-muted-foreground text-[10px]">
                          {item.quantity} x {formatCurrency(parseFloat(item.price))}
                        </div>
                      </div>
                      <div className="font-semibold text-foreground whitespace-nowrap self-center">
                        {formatCurrency(parseFloat(item.lineTotal))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Perhitungan */}
                <div className="space-y-1.5 pt-2.5 border-t border-dashed border-border text-[11px]">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(parseFloat(selectedTransaction.subtotal))}</span>
                  </div>

                  {parseFloat(selectedTransaction.totalDiscountAmount) > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Total Diskon:</span>
                      <span>
                        -{formatCurrency(parseFloat(selectedTransaction.totalDiscountAmount))}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-foreground">
                    <span>PPN (11%):</span>
                    <span>{formatCurrency(parseFloat(selectedTransaction.taxAmount))}</span>
                  </div>

                  <div className="flex justify-between font-bold text-xs text-foreground pt-1.5 border-t border-border">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(parseFloat(selectedTransaction.totalAmount))}</span>
                  </div>

                  <div className="flex justify-between text-muted-foreground text-[10px] pt-1">
                    <span className="capitalize">
                      Metode ({selectedTransaction.paymentMethod}):
                    </span>
                    <span>
                      {selectedTransaction.cashReceived
                        ? formatCurrency(parseFloat(selectedTransaction.cashReceived))
                        : formatCurrency(parseFloat(selectedTransaction.totalAmount))}
                    </span>
                  </div>

                  {selectedTransaction.changeAmount && (
                    <div className="flex justify-between text-muted-foreground text-[10px]">
                      <span>Kembalian:</span>
                      <span>{formatCurrency(parseFloat(selectedTransaction.changeAmount))}</span>
                    </div>
                  )}
                </div>

                <div className="text-center pt-2 border-t border-dashed border-border text-[10px] text-muted-foreground">
                  Terima kasih atas kunjungan Anda!
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98]"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Ulang</span>
                </button>

                {isAdmin && !selectedTransaction.deletedAt && (
                  <button
                    type="button"
                    disabled={isVoiding}
                    onClick={() => handleVoid(selectedTransaction)}
                    className="py-2.5 px-4 rounded-xl border border-destructive text-destructive hover:bg-destructive/10 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Ban className="w-4 h-4" />
                    <span>{isVoiding ? "..." : "Void"}</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-muted-foreground text-sm">
              Pilih transaksi dari daftar untuk melihat detail struk.
            </div>
          )}
        </div>
      </div>

      {/* Portal Cetak Struk Printer Thermal */}
      {printSummary && <ReceiptPrint summary={printSummary} />}
    </div>
  );
}
