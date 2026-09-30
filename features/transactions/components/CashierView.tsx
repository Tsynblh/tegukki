"use client";

import * as React from "react";
import { Search, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "../hooks/useCart";
import { CartSidebar } from "./CartSidebar";
import { PaymentModal } from "./PaymentModal";
import { ReceiptPrint } from "./ReceiptPrint";
import type { ProductWithVariants, Category } from "@/features/products/types";
import type { TransactionSummary } from "../types";

interface Props {
  products: ProductWithVariants[];
  categories: Category[];
  discounts: Array<{
    id: string;
    name: string;
    percentage: string | number;
    type: "auto_by_day" | "manual_dropdown";
    dayCondition: string | null;
    isActive: boolean;
  }>;
  cashierName: string;
}

export function CashierView({
  products,
  categories,
  discounts,
  cashierName,
}: Props) {
  const {
    items,
    addToCart,
    updateQuantity,
    removeItem,
    resetCart,
    manualDiscount,
    setManualDiscount,
  } = useCart();

  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);
  const [latestTransaction, setLatestTransaction] = React.useState<TransactionSummary | null>(null);

  // Filter Produk
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.categoryName?.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      selectedCategory === "all" || p.categoryId === selectedCategory;
    return matchSearch && matchCat;
  });

  // Perhitungan total untuk PaymentModal
  const isFriday = new Date().getDay() === 5;
  const autoFriday = discounts.find(
    (d) => d.isActive && d.type === "auto_by_day" && (d.dayCondition === "friday" || isFriday)
  );
  const subtotal = items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const totalDiscountPct =
    (manualDiscount?.percentage || 0) +
    (autoFriday ? parseFloat(autoFriday.percentage.toString()) : 0);
  const discAmount = (subtotal * totalDiscountPct) / 100;
  const afterDisc = Math.max(0, subtotal - discAmount);
  const taxAmount = afterDisc * 0.11;
  const finalTotal = afterDisc + taxAmount;

  async function handleCompleteTransaction(paymentData: {
    paymentMethod: "cash" | "qris" | "other";
    cashReceived: number | null;
    changeAmount: number | null;
  }) {
    const appliedList = [];
    if (autoFriday) {
      appliedList.push({
        discountId: autoFriday.id,
        discountNameSnapshot: autoFriday.name,
        discountPercentageSnapshot: parseFloat(autoFriday.percentage.toString()),
      });
    }
    if (manualDiscount) {
      appliedList.push({
        discountId: manualDiscount.id,
        discountNameSnapshot: manualDiscount.name,
        discountPercentageSnapshot: manualDiscount.percentage,
      });
    }

    const payload = {
      paymentMethod: paymentData.paymentMethod,
      cashReceived: paymentData.cashReceived,
      items: items.map((i) => ({
        productVariantId: i.variantId,
        productNameSnapshot: `${i.productName} (${i.variantDetail})`,
        priceSnapshot: i.price,
        quantity: i.quantity,
        lineTotal: i.price * i.quantity,
      })),
      discounts: appliedList,
    };

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "Gagal memproses transaksi");
    }

    const data = await res.json();

    // Data struk
    const summary: TransactionSummary = {
      transactionCode: data.transaction.transactionCode,
      createdAt: data.transaction.createdAt,
      cashierName,
      items: items.map((i) => ({
        productName: `${i.productName} (${i.variantDetail})`,
        quantity: i.quantity,
        price: i.price,
        lineTotal: i.price * i.quantity,
      })),
      subtotal,
      discountAmount: discAmount,
      taxAmount,
      totalAmount: finalTotal,
      paymentMethod: paymentData.paymentMethod,
      cashReceived: paymentData.cashReceived,
      changeAmount: paymentData.changeAmount,
    };

    setLatestTransaction(summary);
    setIsPaymentOpen(false);
    resetCart();

    // Trigger Print Struk Browser
    setTimeout(() => {
      window.print();
    }, 300);
  }

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-[calc(100vh-4rem)]">
      {/* Kolom Kiri: Katalog Produk (65%) */}
      <section className="print:hidden flex-1 lg:w-[65%] p-6 flex flex-col gap-5 bg-background">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari tumbler atau scan barcode..."
            className="w-full pl-9 pr-4 py-2.5 rounded-[var(--radius)] bg-card border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-xs"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-[var(--radius)] text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-[var(--radius)] text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((prod) => {
            const variant = prod.variants[0];
            const isOutOfStock = !variant || variant.stock <= 0;
            const price = variant?.priceOverride
              ? parseFloat(variant.priceOverride.toString())
              : parseFloat(prod.basePrice.toString());

            return (
              <div
                key={prod.id}
                className={`group relative flex flex-col justify-between rounded-[var(--radius)] bg-card border border-border shadow-subtle hover:shadow-md transition-all duration-200 overflow-hidden ${
                  isOutOfStock ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div>
                  <div className="relative w-full aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    {variant?.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={variant.photoUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">No Foto</span>
                    )}
                    {isOutOfStock && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shadow-xs">
                        Habis
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <span className="block text-[11px] text-muted-foreground mb-0.5 truncate">
                      {variant?.size || "Standard"} • {variant?.color || "Default"}
                    </span>
                    <h3 className="font-sans font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                      {prod.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-border">
                  <span className="font-mono text-xs font-bold text-primary">
                    {formatCurrency(price)}
                  </span>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => {
                      if (!variant) return;
                      addToCart({
                        variantId: variant.id,
                        productId: prod.id,
                        productName: prod.name,
                        variantDetail: `${variant.size || "Standard"} • ${variant.color || "Default"}`,
                        photoUrl: variant.photoUrl,
                        price,
                        stock: variant.stock,
                      });
                    }}
                    className="w-7 h-7 rounded-[calc(var(--radius)-4px)] bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center active:scale-95 shadow-xs"
                    title="Tambah ke Keranjang"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Kolom Kanan: Cart Sidebar (35%) */}
      <CartSidebar
        items={items}
        onUpdateQty={updateQuantity}
        onRemoveItem={removeItem}
        onResetCart={resetCart}
        discounts={discounts}
        selectedManualDiscount={manualDiscount}
        onSelectManualDiscount={setManualDiscount}
        onOpenPayment={() => setIsPaymentOpen(true)}
      />

      {/* Modal Pembayaran & Kembalian */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        totalAmount={finalTotal}
        onSuccess={handleCompleteTransaction}
      />

      {/* Template Cetak Struk Printer Thermal */}
      {latestTransaction && <ReceiptPrint summary={latestTransaction} />}
    </div>
  );
}
