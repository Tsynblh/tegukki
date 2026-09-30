import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth";
import { UserManagementView } from "@/features/users/components/UserManagementView";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { user } = await requireRole(["admin"]);
  if (!user) redirect("/login");

  const allUsers = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const formattedUsers = allUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-background pb-12">
      <UserManagementView
        initialUsers={formattedUsers}
        currentUserId={user.id}
      />
    </main>
  );
}
