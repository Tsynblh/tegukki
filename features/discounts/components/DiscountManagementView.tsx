"use client";

import * as React from "react";
import { Tag, Plus, Search, Trash2 } from "lucide-react";

export interface Discount {
  id: string;
  name: string;
  percentage: string;
  type: "auto_by_day" | "manual_dropdown";
  dayCondition: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Props {
  initialDiscounts: Discount[];
}

export function DiscountManagementView({ initialDiscounts }: Props) {
  const [discountsList, setDiscountsList] = React.useState<Discount[]>(initialDiscounts);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [name, setName] = React.useState("");
  const [percentage, setPercentage] = React.useState("10");
  const [discountType, setDiscountType] = React.useState<"auto_by_day" | "manual_dropdown">("auto_by_day");
  const [dayCondition, setDayCondition] = React.useState("Setiap Jumat");

  const filteredDiscounts = discountsList.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = discountsList.filter((d) => d.isActive).length;

  async function handleCreateDiscount(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          percentage: parseFloat(percentage),
          type: discountType,
          dayCondition: discountType === "auto_by_day" ? dayCondition : null,
          isActive: true,
        }),
      });

      if (res.ok) {
        const created: Discount = await res.json();
        setDiscountsList((prev) => [created, ...prev]);
        setName("");
        setPercentage("10");
      } else {
        alert("Gagal menyimpan diskon.");
      }
    } catch {
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(discount: Discount) {
    const updatedStatus = !discount.isActive;
    try {
      const res = await fetch(`/api/discounts/${discount.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: updatedStatus }),
      });

      if (res.ok) {
        setDiscountsList((prev) =>
          prev.map((d) => (d.id === discount.id ? { ...d, isActive: updatedStatus } : d))
        );
      }
    } catch {
      alert("Gagal mengubah status diskon.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus aturan diskon ini?")) return;
    try {
      const res = await fetch(`/api/discounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDiscountsList((prev) => prev.filter((d) => d.id !== id));
      }
    } catch {
      alert("Gagal menghapus diskon.");
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
            Manajemen Diskon
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-card px-4 py-2.5 rounded-xl border border-border flex items-center gap-4 shadow-sm">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Diskon Aktif</span>
              <span className="font-mono text-lg font-bold text-foreground">
                {activeCount}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  / {discountsList.length} promo
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Tambah Diskon Baru */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Tambah Aturan Diskon Baru
          </h2>
        </div>

        <form onSubmit={handleCreateDiscount} className="mt-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Nama */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Nama Diskon *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Diskon Jumat Berkah"
                className="h-10 px-3.5 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Nilai (%) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Nilai Diskon (%) *
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="h-10 w-full pl-3.5 pr-8 py-2 rounded-xl border border-border bg-background font-mono text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="absolute right-3 font-mono text-xs text-muted-foreground font-bold">
                  %
                </span>
              </div>
            </div>

            {/* Tipe Diskon */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Tipe Diskon
              </label>
              <div className="h-10 p-1 rounded-xl bg-muted border border-border flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDiscountType("auto_by_day")}
                  className={`flex-1 h-full rounded-lg text-xs font-medium transition-all ${
                    discountType === "auto_by_day"
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Otomatis
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType("manual_dropdown")}
                  className={`flex-1 h-full rounded-lg text-xs font-medium transition-all ${
                    discountType === "manual_dropdown"
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Manual
                </button>
              </div>
            </div>

            {/* Ketentuan */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Ketentuan / Hari
              </label>
              <select
                value={dayCondition}
                onChange={(e) => setDayCondition(e.target.value)}
                disabled={discountType !== "auto_by_day"}
                className="h-10 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              >
                <option value="Setiap Jumat">Setiap Jumat (Jumat Berkah)</option>
                <option value="Setiap Hari">Setiap Hari</option>
                <option value="Sabtu & Minggu">Akhir Pekan (Sabtu & Minggu)</option>
                <option value="Senin - Kamis">Hari Kerja (Senin - Kamis)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center pt-3 border-t border-border justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? "Menyimpan..." : "Simpan Diskon"}
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Diskon */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-lg text-foreground">Daftar Diskon</h2>
            <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
              {activeCount} dari {discountsList.length} aktif
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari promo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9 pr-4 w-full bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="py-3 px-6 font-semibold">Nama Diskon</th>
                <th className="py-3 px-6 font-semibold">Nilai (%)</th>
                <th className="py-3 px-6 font-semibold">Tipe</th>
                <th className="py-3 px-6 font-semibold">Ketentuan</th>
                <th className="py-3 px-6 font-semibold text-center">Status POS</th>
                <th className="py-3 px-6 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-foreground">
              {filteredDiscounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Belum ada diskon yang terdaftar.
                  </td>
                </tr>
              ) : (
                filteredDiscounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 font-medium text-foreground">
                      {discount.name}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-xs font-bold bg-primary/10 text-primary">
                        {parseFloat(discount.percentage)}%
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground">
                        {discount.type === "auto_by_day" ? "Otomatis" : "Manual"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-muted-foreground">
                      {discount.dayCondition || "-"}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(discount)}
                        className={`w-11 h-6 rounded-full p-0.5 inline-flex items-center transition-colors ${
                          discount.isActive ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                            discount.isActive ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(discount.id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
