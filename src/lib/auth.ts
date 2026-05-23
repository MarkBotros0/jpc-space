import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/enums";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function loadScopes(userId: number) {
  const [adminRows, leaderRows, profile] = await Promise.all([
    db.seasonAdmin.findMany({ where: { userId }, select: { seasonId: true } }),
    db.groupLeader.findMany({ where: { userId }, select: { groupId: true } }),
    db.studentProfile.findUnique({
      where: { userId },
      select: { activeSeasonId: true },
    }),
  ]);
  return {
    seasonAdminIds: adminRows.map((r) => r.seasonId),
    groupLeaderIds: leaderRows.map((r) => r.groupId),
    activeSeasonId: profile?.activeSeasonId ?? null,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;
        if (user.deletedAt) return null;
        if (!user.passwordHash) return null; // invite not yet accepted

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.userId = Number(user.id);
        token.role = (user as { role: UserRole }).role;
      }
      if (token.userId && (trigger === "signIn" || trigger === "update" || !("seasonAdminIds" in token))) {
        const scopes = await loadScopes(token.userId as number);
        token.seasonAdminIds = scopes.seasonAdminIds;
        token.groupLeaderIds = scopes.groupLeaderIds;
        token.activeSeasonId = scopes.activeSeasonId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.userId = (token.userId as number | undefined) ?? 0;
      session.user.role = (token.role as UserRole | undefined) ?? "STUDENT";
      session.user.seasonAdminIds = token.seasonAdminIds ?? [];
      session.user.groupLeaderIds = token.groupLeaderIds ?? [];
      session.user.activeSeasonId = token.activeSeasonId ?? null;
      return session;
    },
  },
});

