"use client";

import * as React from "react";
import { X, Banknote, QrCode, CreditCard, Receipt, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PaymentMethod } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onSuccess: (paymentData: {
    paymentMethod: PaymentMethod;
    cashReceived: number | null;
    changeAmount: number | null;
  }) => Promise<void>;
}

export function PaymentModal({
  isOpen,
  onClose,
  totalAmount,
  onSuccess,
}: Props) {
  const [method, setMethod] = React.useState<PaymentMethod>("cash");
  const [cashInput, setCashInput] = React.useState<string>("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setMethod("cash");
      setCashInput("");
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const numericCash = parseFloat(cashInput.replace(/\D/g, "")) || 0;
  const change = numericCash - totalAmount;
  const isCashSufficient = numericCash >= totalAmount;

  function handleSetExactCash() {
    setCashInput(Math.ceil(totalAmount).toString());
  }

  function handleAddQuickCash(val: number) {
    setCashInput(val.toString());
  }

  async function handleConfirmPayment() {
    setErrorMessage(null);
    if (method === "cash" && !isCashSufficient) {
      setErrorMessage("Nominal uang yang diterima kurang dari total pembayaran.");
      return;
    }

    setIsProcessing(true);
    try {
      await onSuccess({
        paymentMethod: method,
        cashReceived: method === "cash" ? numericCash : null,
        changeAmount: method === "cash" ? change : null,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses transaksi";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  }

  // Rekomendasi tombol pecahan uang
  const quickOptions = [
    50000, 100000, 150000, 200000, 250000, 300000, 500000,
  ].filter((amt) => amt >= totalAmount).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-[var(--radius)] bg-card border border-border shadow-xl p-6 relative">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-foreground mb-1">
          Penyelesaian Transaksi
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Pilih metode pembayaran dan masukkan nominal jika tunai.
        </p>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-[var(--radius)] bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Total Tagihan */}
        <div className="p-4 rounded-[var(--radius)] bg-muted/60 border border-border mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            Total yang Harus Dibayar:
          </span>
          <span className="font-mono text-xl font-extrabold text-primary">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        {/* Metode Pembayaran (Segmented Tabs - Sesuai Stitch Screen 5) */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Metode Pembayaran
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 rounded-[var(--radius)] bg-muted">
            <button
              type="button"
              onClick={() => setMethod("cash")}
              className={`py-2 px-3 rounded-[calc(var(--radius)-4px)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                method === "cash"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Tunai</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod("qris")}
              className={`py-2 px-3 rounded-[calc(var(--radius)-4px)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                method === "qris"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QRIS</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod("other")}
              className={`py-2 px-3 rounded-[calc(var(--radius)-4px)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                method === "other"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Debit/Lain</span>
            </button>
          </div>
        </div>

        {/* Khusus Pembayaran Tunai (Input Cash & Kembalian) */}
        {method === "cash" && (
          <div className="space-y-3 mb-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Uang Diterima
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-mono text-xs font-bold text-muted-foreground">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2.5 rounded-[var(--radius)] border border-input bg-background font-mono text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Kembalian
                  </label>
                  {numericCash > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        isCashSufficient
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {isCashSufficient ? "Cukup" : "Kurang"}
                    </span>
                  )}
                </div>
                <div
                  className={`h-10 px-3 flex items-center justify-between rounded-[var(--radius)] border ${
                    isCashSufficient
                      ? "bg-primary/5 border-primary/20 text-primary"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  <span className="font-mono text-xs font-bold">Rp</span>
                  <span className="font-mono text-sm font-bold">
                    {formatCurrency(Math.max(0, change)).replace("Rp", "").trim()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Shortcuts */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
              <button
                type="button"
                onClick={handleSetExactCash}
                className="flex-1 py-1.5 px-2.5 rounded-[var(--radius)] bg-muted hover:bg-muted/80 text-foreground font-sans text-xs font-semibold whitespace-nowrap transition-colors"
              >
                + Uang Pas
              </button>
              {quickOptions.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleAddQuickCash(amt)}
                  className="flex-1 py-1.5 px-2.5 rounded-[var(--radius)] bg-muted hover:bg-muted/80 text-foreground font-mono text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tombol Konfirmasi & Cetak Struk */}
        <button
          type="button"
          onClick={handleConfirmPayment}
          disabled={isProcessing || (method === "cash" && !isCashSufficient)}
          className="w-full py-3.5 px-4 rounded-[var(--radius)] bg-secondary hover:opacity-90 active:scale-[0.98] text-secondary-foreground font-sans font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            <span>{isProcessing ? "Memproses..." : "Bayar & Cetak Struk"}</span>
          </div>
          <span className="font-mono font-bold">
            {formatCurrency(totalAmount)}
          </span>
        </button>
      </div>
    </div>
  );
}
