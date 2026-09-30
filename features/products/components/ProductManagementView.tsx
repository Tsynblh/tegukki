"use client";

import * as React from "react";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Edit2,
  Trash2,
  Package,
  Layers,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithVariants, Category } from "../types";

interface Props {
  initialProducts: ProductWithVariants[];
  categories: Category[];
  userRole: "admin" | "kasir";
}

export function ProductManagementView({
  initialProducts,
  categories,
  userRole,
}: Props) {
  const isAdmin = userRole === "admin";
  const [products, setProducts] = React.useState(initialProducts);
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  // State Modal Produk Baru / Edit
  const [isProductModalOpen, setIsProductModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<ProductWithVariants | null>(null);
  const [productForm, setProductForm] = React.useState({
    name: "",
    categoryId: categories[0]?.id || "",
    basePrice: "",
  });

  // State Modal Kelola Varian
  const [activeProductForVariant, setActiveProductForVariant] = React.useState<ProductWithVariants | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = React.useState(false);
  const [variantForm, setVariantForm] = React.useState({
    size: "500 ml",
    color: "Terracotta Matte",
    stock: "25",
    priceOverride: "",
    photoUrl: "",
  });
  const [variantPhotoFile, setVariantPhotoFile] = React.useState<File | null>(null);
  const [photoError, setPhotoError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Filter & Search Logic
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.categoryName?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      selectedCategory === "all" || p.categoryId === selectedCategory;
    return matchSearch && matchCategory;
  });

  // Summary Metrics
  const totalProducts = products.length;
  const outOfStockCount = products.reduce((acc, p) => {
    const hasZeroStock = p.variants.some((v) => v.stock <= 0);
    return hasZeroStock ? acc + 1 : acc;
  }, 0);

  // Handler Submit Produk Baru
  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!productForm.name || !productForm.categoryId || !productForm.basePrice) return;

    setIsSubmitting(true);
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productForm.name,
          categoryId: productForm.categoryId,
          basePrice: parseFloat(productForm.basePrice),
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        if (editingProduct) {
          setProducts((prev) =>
            prev.map((p) => (p.id === saved.id ? { ...p, ...saved } : p))
          );
        } else {
          setProducts((prev) => [{ ...saved, variants: [] }, ...prev]);
        }
        setIsProductModalOpen(false);
        setEditingProduct(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handler Hapus Produk
  async function handleDeleteProduct(id: string) {
    if (!confirm("Hapus produk ini? Semua varian terkait akan ikut terhapus.")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  }

  // Handler Submit Varian Baru
  async function handleSaveVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!activeProductForVariant) return;

    let finalPhotoUrl = variantForm.photoUrl;

    // Upload file foto jika ada
    if (variantPhotoFile) {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("file", variantPhotoFile);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        setPhotoError("Gagal upload foto");
        setIsSubmitting(false);
        return;
      }
      const data = await uploadRes.json();
      finalPhotoUrl = data.url;
    }

    if (!finalPhotoUrl) {
      setPhotoError("Foto varian wajib diunggah (BR-11)");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(
        `/api/products/${activeProductForVariant.id}/variants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            size: variantForm.size,
            color: variantForm.color,
            stock: parseInt(variantForm.stock, 10),
            priceOverride: variantForm.priceOverride
              ? parseFloat(variantForm.priceOverride)
              : null,
            photoUrl: finalPhotoUrl,
          }),
        }
      );

      if (res.ok) {
        const newV = await res.json();
        setProducts((prev) =>
          prev.map((p) =>
            p.id === activeProductForVariant.id
              ? { ...p, variants: [...p.variants, newV] }
              : p
          )
        );
        setIsVariantModalOpen(false);
        setVariantPhotoFile(null);
        setVariantForm({
          size: "500 ml",
          color: "Terracotta Matte",
          stock: "25",
          priceOverride: "",
          photoUrl: "",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Action Bar & Title Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Manajemen Produk
          </h1>
        </div>

        {isAdmin && (
          <Button
            onClick={() => {
              setEditingProduct(null);
              setProductForm({
                name: "",
                categoryId: categories[0]?.id || "",
                basePrice: "",
              });
              setIsProductModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </Button>
        )}
      </div>

      {/* Summary Metric Pills (Sesuai Stitch Screen 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-[var(--radius)] bg-card border border-border shadow-subtle">
          <div className="p-2.5 rounded-[var(--radius)] bg-primary/10 text-primary">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Status Katalog</span>
            <span className="font-sans text-sm font-bold text-foreground">
              Total {totalProducts} Produk Aktif
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-[var(--radius)] bg-card border border-border shadow-subtle">
          <div className="p-2.5 rounded-[var(--radius)] bg-secondary/15 text-secondary">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Struktur Menu</span>
            <span className="font-sans text-sm font-bold text-foreground">
              {categories.length} Kategori Utama
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-[var(--radius)] bg-card border border-border shadow-subtle">
          <div className="p-2.5 rounded-[var(--radius)] bg-destructive/10 text-destructive">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Peringatan Restok</span>
            <span className="font-sans text-sm font-bold text-destructive">
              {outOfStockCount} Produk Butuh Perhatian
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-[var(--radius)] bg-card border border-border shadow-subtle flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama tumbler, kategori..."
            className="w-full pl-9 pr-3 py-2 rounded-[var(--radius)] bg-muted/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-[var(--radius)] bg-muted/40 border border-input text-sm text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Rows List */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Tidak ada produk yang sesuai"
          description="Coba ubah kata kunci pencarian atau kategori filter."
          actionLabel={isAdmin ? "Tambah Produk Pertama" : undefined}
          onAction={() => setIsProductModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const firstVariant = product.variants[0];
            const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);

            return (
              <div
                key={product.id}
                className="p-4 rounded-[var(--radius)] bg-card border border-border shadow-subtle hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Thumbnail & Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 h-16 rounded-[var(--radius)] overflow-hidden bg-muted shrink-0 border border-border">
                    {firstVariant?.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={firstVariant.photoUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package className="w-6 h-6 opacity-40" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-sans font-semibold text-base text-foreground truncate">
                        {product.name}
                      </h3>
                      {product.categoryName && (
                        <span className="px-2 py-0.5 rounded-md bg-muted text-secondary text-xs font-medium">
                          {product.categoryName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{product.variants.length} varian</span>
                      <span>•</span>
                      <span className="font-mono font-medium">
                        Total stok: {totalStock} unit
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Harga & Aksi */}
                <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-muted-foreground block">
                      Harga Dasar
                    </span>
                    <span className="font-mono text-base font-bold text-primary">
                      {formatCurrency(product.basePrice)}
                    </span>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveProductForVariant(product);
                          setIsVariantModalOpen(true);
                        }}
                        title="Kelola Varian"
                        className="p-2 rounded-[var(--radius)] bg-secondary/10 hover:bg-secondary/20 text-secondary transition-colors"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(product);
                          setProductForm({
                            name: product.name,
                            categoryId: product.categoryId,
                            basePrice: product.basePrice.toString(),
                          });
                          setIsProductModalOpen(true);
                        }}
                        title="Edit Produk"
                        className="p-2 rounded-[var(--radius)] bg-muted hover:bg-muted/80 text-foreground transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
                        title="Hapus Produk"
                        className="p-2 rounded-[var(--radius)] bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Tambah / Edit Produk Induk */}
      <Dialog
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? "Edit Produk Induk" : "Tambah Produk Baru"}
        description="Produk induk mewadahi varian ukuran, warna, dan stok tumbler."
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Nama Produk *
            </label>
            <input
              type="text"
              required
              value={productForm.name}
              onChange={(e) =>
                setProductForm({ ...productForm, name: e.target.value })
              }
              placeholder="Contoh: Tumbler Stainless Matte"
              className="w-full px-3 py-2 rounded-[var(--radius)] bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Kategori *
            </label>
            <select
              value={productForm.categoryId}
              onChange={(e) =>
                setProductForm({ ...productForm, categoryId: e.target.value })
              }
              className="w-full px-3 py-2 rounded-[var(--radius)] bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Harga Dasar (Rp) *
            </label>
            <input
              type="number"
              required
              value={productForm.basePrice}
              onChange={(e) =>
                setProductForm({ ...productForm, basePrice: e.target.value })
              }
              placeholder="125000"
              className="w-full font-mono px-3 py-2 rounded-[var(--radius)] bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsProductModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Simpan Produk"
              )}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 2: Tambah Varian Baru (Presisi Stitch Screen 3) */}
      <Dialog
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        title="Tambah Varian Baru"
        description={
          activeProductForVariant
            ? `Produk: ${activeProductForVariant.name}`
            : undefined
        }
      >
        <form onSubmit={handleSaveVariant} className="space-y-4">
          {/* Foto Varian (Wajib - BR-11) */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Foto Varian <span className="text-destructive font-bold">*</span>
            </label>
            <ImageUpload
              onChange={(file) => {
                setVariantPhotoFile(file);
                setPhotoError("");
              }}
              error={photoError}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Wajib diunggah untuk tampilan register kasir dan cetak struk POS.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Ukuran / Kapasitas
              </label>
              <select
                value={variantForm.size}
                onChange={(e) =>
                  setVariantForm({ ...variantForm, size: e.target.value })
                }
                className="w-full px-3 py-2 rounded-[var(--radius)] bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="350 ml">350 ml (Compact)</option>
                <option value="500 ml">500 ml (Standard)</option>
                <option value="750 ml">750 ml (Large)</option>
                <option value="1000 ml">1000 ml (Maxi)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Warna Varian
              </label>
              <input
                type="text"
                value={variantForm.color}
                onChange={(e) =>
                  setVariantForm({ ...variantForm, color: e.target.value })
                }
                placeholder="Misal: Amber Matte"
                className="w-full px-3 py-2 rounded-[var(--radius)] bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Stok Awal
              </label>
              <input
                type="number"
                required
                value={variantForm.stock}
                onChange={(e) =>
                  setVariantForm({ ...variantForm, stock: e.target.value })
                }
                className="w-full font-mono px-3 py-2 rounded-[var(--radius)] bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Harga Khusus <span className="text-muted-foreground font-normal">(Opsional)</span>
              </label>
              <input
                type="number"
                value={variantForm.priceOverride}
                onChange={(e) =>
                  setVariantForm({
                    ...variantForm,
                    priceOverride: e.target.value,
                  })
                }
                placeholder="Kosongkan jika sama"
                className="w-full font-mono px-3 py-2 rounded-[var(--radius)] bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsVariantModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Simpan Varian"
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
