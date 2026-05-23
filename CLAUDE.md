@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Next.js 16 (App Router) + React 19 + TypeScript, Tailwind v4 (PostCSS), Prisma 7 (PostgreSQL via `@prisma/adapter-pg`), Auth.js v5 (`next-auth@5-beta`) with credentials provider, Zod 4, shadcn-style UI on top of Base UI (`@base-ui/react`). Package manager is **npm** (not pnpm). Note: Next 16 / React 19 / Prisma 7 all have breaking changes from prior majors — see `AGENTS.md`.

## Commands

```
npm run dev          # next dev
npm run build        # next build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run db:migrate   # prisma migrate dev
npm run db:generate  # prisma generate
npm run db:seed      # tsx prisma/seed.ts
npm run db:studio    # prisma studio
```

Env required for any DB-touching command: `DATABASE_URL` (PostgreSQL). Auth needs `AUTH_SECRET`, `AUTH_URL`. See `.env.example` for the full list including storage driver config.

Schema changes require user approval before running `prisma migrate dev` (per the comment at the top of `prisma/schema.prisma`).

## Architecture

### Prisma client lives under `src/generated/prisma/`

`schema.prisma` sets `generator client { output = "../src/generated/prisma" }`. Import from `@/generated/prisma/client` (PrismaClient), `@/generated/prisma/enums` (UserRole, SeasonStatus, …), or `@/generated/prisma/models/*` — **not** from `@prisma/client`. The singleton lives in `src/lib/db.ts` as `db`, wired through `PrismaPg` adapter.

### Domain model (see `prisma/schema.prisma` for full schema)

The portal manages **Seasons** (courses, identified by a URL-friendly `code` like `"gbv-2026"`) containing **Groups**, **Sessions** (calendar events), and **Assignments**. Students enroll in seasons (`SeasonEnrollment` is append-only history; `GroupStudent` is current membership only and enforces one current group per student via a `@unique` on `studentUserId`). Submissions belong to a student+assignment pair (unique together) and are the **only** entity using a `publicId` (nanoid 10-char, see `src/lib/public-id.ts`) — every other entity uses integer IDs in URLs. Soft delete (`deletedAt`) applies to User, Season, StudentProfile, Assignment. Audit columns (`createdById`/`updatedById`) on Season, Assignment, Submission.

A student's "active season" is denormalized onto `StudentProfile.activeSeasonId` and additionally enforced by business rules (one active season at a time).

### RBAC

Five roles: `SUPER`, `ADMIN`, `LEADER`, `STUDENT`, `MENTOR`. Authorization is scoped:

- `SUPER` — global; only role that can manage users.
- `ADMIN` — admin **of specific seasons** via `SeasonAdmin` join table; their season IDs are loaded into the JWT as `seasonAdminIds`.
- `LEADER` — leader **of specific groups** via `GroupLeader`; loaded as `groupLeaderIds`.
- `MENTOR` — read-all-students, no write scope by default.
- `STUDENT` — owns own submissions / profile.

`src/lib/auth.ts`'s `loadScopes()` queries these joins on sign-in / session refresh and stuffs them into the JWT, then the session callback exposes them on `session.user`. Helpers in `src/lib/rbac.ts` (`isAdminOfSeason`, `isLeaderOfGroup`, `canReadAllStudents`, `canManageUsers`) take a `SessionUser` and the resource ID — use these rather than re-checking roles ad hoc.

### Storage abstraction

`src/lib/storage/index.ts` exports a `Storage` interface with `LocalFsStorage` and `S3Storage` impls; pick via `STORAGE_DRIVER` env (`local` | `s3`). Get the singleton via `getStorage()`. Use `buildStorageKey({ bucket, publicId, originalName })` to produce paths like `submissions/2026/05/<publicId>-<sanitized-name>` — keys are namespaced by bucket/year/month and sanitized.

### Auth flow

Credentials provider in `src/lib/auth.ts`. Users without a `passwordHash` represent unaccepted invites (see `InviteToken` and `src/lib/invites.ts`). JWT session strategy; the `jwt` callback re-runs `loadScopes()` on sign-in, manual `update`, or whenever scope claims are missing from the token.

## Project conventions

- Integer PKs everywhere (`Int @id @default(autoincrement())`), not BigInt or UUID — see schema header comment for rationale.
- URL identifiers: `Season.code` (human-readable slug), `Submission.publicId` (nanoid). Everything else uses the int `id`.
- Path alias `@/*` → `src/*`.
