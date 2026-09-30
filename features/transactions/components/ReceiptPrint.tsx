"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TransactionSummary } from "../types";

interface Props {
  summary: TransactionSummary;
}

export function ReceiptPrint({ summary }: Props) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const target =
    document.getElementById("receipt-portal-root") || document.body;

  return createPortal(
    <div
      id="receipt-print-area"
      className="font-mono text-black text-xs max-w-[80mm] mx-auto leading-tight p-4 bg-white"
    >
      <div className="text-center pb-3 border-b border-dashed border-black">
        <h2 className="text-base font-bold uppercase tracking-wider">TEGUKKI</h2>
        <p className="text-[10px]">Toko Tumbler &amp; Aksesoris</p>
        <p className="text-[10px]">Outlet Makassar</p>
      </div>

      <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span>No:</span>
          <span className="font-semibold">{summary.transactionCode}</span>
        </div>
        <div className="flex justify-between">
          <span>Tgl:</span>
          <span>{formatDate(summary.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Kasir:</span>
          <span>@{summary.cashierName}</span>
        </div>
      </div>

      <div className="py-2 border-b border-dashed border-black space-y-1.5 text-[11px]">
        {summary.items.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="font-semibold leading-snug">{item.productName}</div>
            <div className="flex justify-between">
              <span>
                {item.quantity} x {formatCurrency(item.price)}
              </span>
              <span>{formatCurrency(item.lineTotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(summary.subtotal)}</span>
        </div>
        {summary.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Diskon:</span>
            <span>- {formatCurrency(summary.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>PPN (11%):</span>
          <span>{formatCurrency(summary.taxAmount)}</span>
        </div>
        <div className="flex justify-between font-bold text-xs pt-1 border-t border-dotted border-black">
          <span>TOTAL:</span>
          <span>{formatCurrency(summary.totalAmount)}</span>
        </div>
      </div>

      <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span>Metode:</span>
          <span className="uppercase font-semibold">{summary.paymentMethod}</span>
        </div>
        {summary.paymentMethod === "cash" && (
          <>
            <div className="flex justify-between">
              <span>Uang Diterima:</span>
              <span>{formatCurrency(summary.cashReceived || 0)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Kembalian:</span>
              <span>{formatCurrency(summary.changeAmount || 0)}</span>
            </div>
          </>
        )}
      </div>

      <div className="text-center pt-3 text-[10px] space-y-0.5">
        <p>Terima kasih atas kunjungan Anda!</p>
        <p>Barang yang sudah dibeli tidak dapat ditukar.</p>
      </div>
    </div>,
    target
  );
}
