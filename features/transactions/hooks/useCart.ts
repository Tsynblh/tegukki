"use client";

import { useState, useEffect } from "react";
import type { CartItem, AppliedDiscount } from "../types";

const CART_STORAGE_KEY = "tegukki_cart_draft";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [manualDiscount, setManualDiscount] = useState<AppliedDiscount | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Muat draft dari localStorage saat pertama dibuka
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch (e) {
      console.error("Failed to load cart draft:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Simpan draft ke localStorage setiap kali keranjang berubah (BR-9)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart draft:", e);
    }
  }, [items, isLoaded]);

  function addToCart(newItem: Omit<CartItem, "quantity">) {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.variantId === newItem.variantId);
      if (existingIndex > -1) {
        const current = prev[existingIndex];
        if (current.quantity >= current.stock) return prev; // tidak melebihi stok
        const updated = [...prev];
        updated[existingIndex] = { ...current, quantity: current.quantity + 1 };
        return updated;
      }
      if (newItem.stock <= 0) return prev;
      return [...prev, { ...newItem, quantity: 1 }];
    });
  }

  function updateQuantity(variantId: string, delta: number) {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.variantId === variantId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null; // opsi hapus jika ditekan minus pada qty 1
            if (nextQty > item.stock) return item;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }

  function removeItem(variantId: string) {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }

  function resetCart() {
    setItems([]);
    setManualDiscount(null);
    localStorage.removeItem(CART_STORAGE_KEY);
  }

  return {
    items,
    addToCart,
    updateQuantity,
    removeItem,
    resetCart,
    manualDiscount,
    setManualDiscount,
    isLoaded,
  };
}
