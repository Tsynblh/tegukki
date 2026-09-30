import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

async function runSeed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is missing.");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log("🌱 Menjalankan seed database Tegukki...");

  // 1. Buat User Admin Awal
  const passwordHash = await bcrypt.hash("admin123", 10);
  const [adminUser] = await db
    .insert(schema.users)
    .values({
      username: "admin",
      passwordHash,
      role: "admin",
    })
    .onConflictDoNothing({ target: schema.users.username })
    .returning();

  if (adminUser) {
    console.log("✅ Admin berhasil dibuat: username: 'admin', password: 'admin123'");
  } else {
    console.log("ℹ️ Admin 'admin' sudah ada.");
  }

  // 2. Buat User Kasir Awal untuk testing
  const kasirHash = await bcrypt.hash("kasir123", 10);
  const [kasirUser] = await db
    .insert(schema.users)
    .values({
      username: "kasir1",
      passwordHash: kasirHash,
      role: "kasir",
    })
    .onConflictDoNothing({ target: schema.users.username })
    .returning();

  if (kasirUser) {
    console.log("✅ Kasir berhasil dibuat: username: 'kasir1', password: 'kasir123'");
  }

  // 3. Buat Kategori Tumbler Awal
  const defaultCategories = [
    { name: "Classic Tumbler" },
    { name: "Travel Mug" },
    { name: "Straw Cup" },
    { name: "Kids Bottle" },
  ];

  for (const cat of defaultCategories) {
    await db.insert(schema.categories).values(cat);
  }
  console.log("✅ Kategori awal berhasil ditambahkan.");

  console.log("🎉 Seed selesai!");
}

runSeed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
