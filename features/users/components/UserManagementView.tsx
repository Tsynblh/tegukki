// features/users/components/UserManagementView.tsx
"use client";

import * as React from "react";
import { UserPlus, Search, Key, Trash2, ShieldCheck, UserCheck, X, Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface UserItem {
  id: string;
  username: string;
  role: "admin" | "kasir";
  createdAt: string;
}

interface Props {
  initialUsers: UserItem[];
  currentUserId: string;
}

export function UserManagementView({ initialUsers, currentUserId }: Props) {
  const [usersList, setUsersList] = React.useState<UserItem[]>(initialUsers);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | "admin" | "kasir">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserItem | null>(null);

  // Form New User
  const [formData, setFormData] = React.useState({
    username: "",
    password: "",
    role: "kasir" as "admin" | "kasir",
  });

  // Form Edit User
  const [editFormData, setEditFormData] = React.useState({
    id: "",
    username: "",
    role: "kasir" as "admin" | "kasir",
    newPassword: "",
  });

  const [newPassword, setNewPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const filteredUsers = usersList.filter((u) => {
    const matchSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase());
    if (roleFilter === "admin") return matchSearch && u.role === "admin";
    if (roleFilter === "kasir") return matchSearch && u.role === "kasir";
    return matchSearch;
  });

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setUsersList((prev) => [
          { ...data, createdAt: new Date().toISOString() },
          ...prev,
        ]);
        setIsModalOpen(false);
        setFormData({ username: "", password: "", role: "kasir" });
      } else {
        alert(data.error?.message || "Gagal membuat akun.");
      }
    } catch {
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenEdit(user: UserItem) {
    setEditFormData({
      id: user.id,
      username: user.username,
      role: user.role,
      newPassword: "",
    });
    setSelectedUser(user);
    setIsEditModalOpen(true);
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editFormData.username.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        username: editFormData.username.trim(),
        role: editFormData.role,
      };
      if (editFormData.newPassword.trim()) {
        if (editFormData.newPassword.trim().length < 6) {
          alert("Kata sandi baru minimal 6 karakter.");
          setIsSubmitting(false);
          return;
        }
        payload.password = editFormData.newPassword.trim();
      }

      const res = await fetch(`/api/users/${editFormData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) =>
            u.id === editFormData.id
              ? { ...u, username: data.username, role: data.role }
              : u
          )
        );
        setIsEditModalOpen(false);
        alert("Data pengguna berhasil diperbarui.");
      } else {
        alert(data.error?.message || "Gagal memperbarui pengguna.");
      }
    } catch {
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser || newPassword.length < 6) {
      alert("Kata sandi minimal 6 karakter.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      if (res.ok) {
        alert(`Kata sandi untuk @${selectedUser.username} berhasil diubah.`);
        setIsPasswordModalOpen(false);
        setNewPassword("");
        setSelectedUser(null);
      }
    } catch {
      alert("Gagal mereset kata sandi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(user: UserItem) {
    if (user.id === currentUserId) {
      alert("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }

    if (!confirm(`Hapus akun @${user.username}?`)) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (res.ok) {
        setUsersList((prev) => prev.filter((u) => u.id !== user.id));
      }
    } catch {
      alert("Gagal menghapus pengguna.");
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
            Manajemen Pengguna
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Info Banner Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-card rounded-xl p-5 border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Kebijakan Hak Akses Staf Kasir
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Role kasir memiliki hak akses ke Layar Transaksi POS dan Riwayat Transaksi.
              Pengaturan produk, diskon, dan pengguna hanya dapat diakses oleh Admin Toko.
            </p>
          </div>
        </div>

        <div className="lg:col-span-4 bg-card rounded-xl p-5 border border-border shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Total Akun Terdaftar
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono text-2xl font-bold text-foreground">
                {usersList.length}
              </span>
              <span className="text-xs text-muted-foreground">
                Pengguna
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Ribbon Search & Filter */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-10 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              roleFilter === "all"
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Semua ({usersList.length})
          </button>
          <button
            onClick={() => setRoleFilter("admin")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              roleFilter === "admin"
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Admin ({usersList.filter((u) => u.role === "admin").length})
          </button>
          <button
            onClick={() => setRoleFilter("kasir")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              roleFilter === "kasir"
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Kasir ({usersList.filter((u) => u.role === "kasir").length})
          </button>
        </div>
      </div>

      {/* Tabel Users */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="py-3 px-6 font-semibold">Pengguna</th>
                <th className="py-3 px-6 font-semibold">Role</th>
                <th className="py-3 px-6 font-semibold">Terdaftar</th>
                <th className="py-3 px-6 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-foreground">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          @{user.username}
                        </span>
                        {user.id === currentUserId && (
                          <span className="ml-2 text-[11px] text-primary font-medium">
                            (Akun Anda)
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        user.role === "admin"
                          ? "bg-secondary/15 text-secondary font-semibold"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-1">
                      {/* Tombol Edit */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(user)}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                        title="Edit Pengguna"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Tombol Ubah Password */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsPasswordModalOpen(true);
                        }}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Ubah Kata Sandi"
                      >
                        <Key className="w-4 h-4" />
                      </button>

                      {/* Tombol Hapus */}
                      {user.id !== currentUserId && (
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Pengguna */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-lg font-bold text-foreground">
              Tambah Pengguna Baru
            </h3>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="Contoh: budi.kasir"
                  className="mt-1 w-full h-10 px-3 border border-border bg-background rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Kata Sandi *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Minimal 6 karakter"
                  className="mt-1 w-full h-10 px-3 border border-border bg-background rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "admin" | "kasir",
                    })
                  }
                  className="mt-1 w-full h-10 px-3 border border-border bg-background rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="kasir">Kasir (Layar Kasir POS)</option>
                  <option value="admin">Admin (Akses Penuh)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Pengguna */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-xl p-6 relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-lg font-bold text-foreground">
              Edit Pengguna
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Perbarui username, role akses, atau ganti kata sandi
            </p>

            <form onSubmit={handleUpdateUser} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.username}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, username: e.target.value })
                  }
                  className="mt-1 w-full h-10 px-3 border border-border bg-background rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Role *</label>
                <select
                  value={editFormData.role}
                  disabled={editFormData.id === currentUserId}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      role: e.target.value as "admin" | "kasir",
                    })
                  }
                  className="mt-1 w-full h-10 px-3 border border-border bg-background rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                >
                  <option value="kasir">Kasir (Layar Kasir POS)</option>
                  <option value="admin">Admin (Akses Penuh)</option>
                </select>
                {editFormData.id === currentUserId && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Role akun Anda sendiri tidak dapat diubah di sini.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Kata Sandi Baru (Opsional)
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={editFormData.newPassword}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, newPassword: e.target.value })
                  }
                  placeholder="Kosongkan jika tidak ingin mengubah"
                  className="mt-1 w-full h-10 px-3 border border-border bg-background rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password Cepat */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-sm rounded-xl border border-border shadow-xl p-6 relative">
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-lg font-bold text-foreground">
              Ubah Kata Sandi
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Untuk pengguna <strong>@{selectedUser.username}</strong>
            </p>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Kata Sandi Baru *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="mt-1 w-full h-10 px-3 border border-border bg-background rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Kata Sandi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
