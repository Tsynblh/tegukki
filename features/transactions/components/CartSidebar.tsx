"use client";

import * as React from "react";
import { Plus, Minus, Trash2, Tag, ShoppingBag, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { CartItem, AppliedDiscount } from "../types";

interface Props {
  items: CartItem[];
  onUpdateQty: (variantId: string, delta: number) => void;
  onRemoveItem: (variantId: string) => void;
  onResetCart: () => void;
  discounts: Array<{
    id: string;
    name: string;
    percentage: string | number;
    type: "auto_by_day" | "manual_dropdown";
    dayCondition: string | null;
    isActive: boolean;
  }>;
  selectedManualDiscount: AppliedDiscount | null;
  onSelectManualDiscount: (discount: AppliedDiscount | null) => void;
  onOpenPayment: () => void;
}

export function CartSidebar({
  items,
  onUpdateQty,
  onRemoveItem,
  onResetCart,
  discounts,
  selectedManualDiscount,
  onSelectManualDiscount,
  onOpenPayment,
}: Props) {
  // Cek diskon otomatis hari Jumat (auto_by_day)
  const isFriday = new Date().getDay() === 5;
  const autoFridayDiscount = discounts.find(
    (d) => d.isActive && d.type === "auto_by_day" && (d.dayCondition === "friday" || isFriday)
  );

  const subtotal = items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  // Hitung total diskon
  const manualPercent = selectedManualDiscount?.percentage || 0;
  const autoPercent = autoFridayDiscount ? parseFloat(autoFridayDiscount.percentage.toString()) : 0;
  const totalDiscountPercentage = manualPercent + autoPercent;
  const totalDiscountAmount = (subtotal * totalDiscountPercentage) / 100;
  const afterDiscount = Math.max(0, subtotal - totalDiscountAmount);

  // PPN 11% (tidak dibulatkan, BR-5)
  const taxAmount = afterDiscount * 0.11;
  const finalTotal = afterDiscount + taxAmount;

  return (
    <aside className="print:hidden w-full lg:w-[35%] flex flex-col justify-between bg-card border-t lg:border-t-0 lg:border-l border-border p-6 shadow-subtle min-h-[calc(100vh-4rem)]">
      <div className="space-y-4">
        {/* Header Pesanan Aktif */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="font-sans text-base font-bold text-foreground">
              Pesanan Aktif
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary/15 text-secondary">
              {items.length} Item
            </span>
          </div>

          {items.length > 0 && (
            <button
              onClick={onResetCart}
              title="Reset Keranjang"
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* List Item Keranjang */}
        {items.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-[var(--radius)] bg-muted flex items-center justify-center text-muted-foreground mb-3">
              <ShoppingBag className="w-6 h-6 opacity-50" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Keranjang masih kosong
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Pilih produk tumbler di sebelah kiri untuk memulai pesanan.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.variantId}
                className="flex items-center justify-between p-2.5 rounded-[var(--radius)] bg-background border border-border shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-12 h-12 rounded-[calc(var(--radius)-4px)] overflow-hidden bg-muted shrink-0 border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.photoUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-sans text-xs font-bold text-foreground truncate">
                      {item.productName}
                    </h4>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {item.variantDetail}
                    </span>
                    <span className="font-mono text-xs font-semibold text-primary">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center bg-muted rounded-[var(--radius)] p-0.5">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.variantId, -1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:bg-card active:scale-95 transition-all"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-mono text-xs font-bold text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.variantId, 1)}
                      disabled={item.quantity >= item.stock}
                      className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:bg-card active:scale-95 transition-all disabled:opacity-30"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.variantId)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Promo Diskon Otomatis Banner */}
        {autoFridayDiscount && (
          <div className="p-2.5 rounded-[var(--radius)] bg-secondary/10 border border-secondary/20 flex items-center gap-2 text-xs text-secondary font-medium">
            <Tag className="w-3.5 h-3.5 shrink-0" />
            <span>Promo Hari Ini: {autoFridayDiscount.name} ({autoFridayDiscount.percentage}%)</span>
          </div>
        )}

        {/* Dropdown Diskon Manual */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Pilih Diskon Manual
          </label>
          <select
            value={selectedManualDiscount?.id || ""}
            onChange={(e) => {
              const d = discounts.find((disc) => disc.id === e.target.value);
              if (d) {
                onSelectManualDiscount({
                  id: d.id,
                  name: d.name,
                  percentage: parseFloat(d.percentage.toString()),
                });
              } else {
                onSelectManualDiscount(null);
              }
            }}
            className="w-full px-3 py-2 rounded-[var(--radius)] bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Tanpa Diskon Tambahan</option>
            {discounts
              .filter((d) => d.isActive && d.type === "manual_dropdown")
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.percentage}%)
                </option>
              ))}
          </select>
        </div>

        {/* Kalkulasi Rincian Harga */}
        <div className="p-4 rounded-[var(--radius)] bg-background border border-border shadow-xs space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono font-medium text-foreground">
              {formatCurrency(subtotal)}
            </span>
          </div>
          {totalDiscountAmount > 0 && (
            <div className="flex justify-between text-primary font-medium">
              <span>Diskon ({totalDiscountPercentage}%)</span>
              <span className="font-mono">- {formatCurrency(totalDiscountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>PPN (11%)</span>
            <span className="font-mono font-medium text-foreground">
              {formatCurrency(taxAmount)}
            </span>
          </div>
          <div className="h-px bg-border my-1" />
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-bold text-sm text-foreground">Total Akhir</span>
            <span className="font-mono text-lg font-extrabold text-primary">
              {formatCurrency(finalTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer: Tombol Checkout */}
      <div className="pt-4 mt-4 border-t border-border">
        <button
          type="button"
          onClick={onOpenPayment}
          disabled={items.length === 0}
          className="w-full h-12 rounded-[var(--radius)] bg-primary hover:opacity-90 active:scale-[0.98] text-primary-foreground font-bold text-sm shadow-md transition-all disabled:opacity-40 flex items-center justify-between px-4"
        >
          <span>Lanjut ke Pembayaran</span>
          <span className="font-mono font-bold text-sm">
            {formatCurrency(finalTotal)}
          </span>
        </button>
      </div>
    </aside>
  );
}
