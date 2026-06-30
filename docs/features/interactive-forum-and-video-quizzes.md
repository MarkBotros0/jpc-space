# Feature Spec — Interactive Forum Assignment & Interactive Video Quizzes

> Living spec so work can resume if a session expires. Two features, planned together,
> shipped as **two separate PRs**. Terminology note: in this codebase the **season-scoped
> role is `ADMIN`** (what stakeholders call "season leader/admin"); `LEADER` is group-scoped.
> Authoring/control for both features sits with **`ADMIN`** (and `SUPER`).

## Locked product decisions

| Topic | Decision |
|-------|----------|
| Video quiz grading | **Graded & recorded** — store each answer + correctness, compute a score |
| Video quiz gating | **Gate progression** — students cannot skip past an unanswered question |
| Forum feed visibility | **Post-first-to-unlock** — peers' responses hidden until the student submits their own |
| Forum feed scope | **Group-only** — feed shows responses from students in the same `Group` |
| Forum comments | **Admin-controlled per assignment** via `forumAllowComments` toggle |
| Authoring role | **ADMIN** (season-scoped) + SUPER, not group `LEADER` |
| Delivery | Two PRs: **PR B = forum (in progress first)**, **PR A = video quizzes (next)** |

---

## Codebase conventions to honor (from CLAUDE.md)

- Next 16 App Router, React 19, Prisma 7, Auth.js v5, Tailwind v4, Base UI / shadcn components.
- Server Components by default; `"use client"` only for interactivity. **No `useEffect` for data fetching.**
- Prisma client imported from `@/generated/prisma/*`, never `@prisma/client`. Use singleton `db` from `@/lib/db`.
- All business logic / DB queries live in `src/lib/`; route handlers & Server Actions validate with Zod, check scope via `src/lib/auth/permissions.ts`, then call a lib fn.
- Soft delete + audit columns already on `Assignment` (`deletedAt`, `createdById`, `updatedById`).
- Migrations require explicit user approval before `npm run db:migrate` (schema header is the review gate).
- Design system: only design tokens (`brand-navy-*`, `brand-teal-*`, `neutral-*`, `success/warning/error/info-*`), shadcn primitives from `src/components/ui/`, mobile-first (verify at 375px), EmptyState + Skeleton + loading/error states, self-audit before "done".

---

# FEATURE B — Interactive Forum Assignment  *(current PR: `feat/forum-assignment`)*

A new **assignment type**. Admin posts a question; each student writes a response with a
configurable minimum word count; after submitting, the student sees their group-mates'
responses Facebook-style; admin decides per-assignment whether students may comment on peers.

### Reuse strategy
A student's forum **post = their `Submission.text`** (existing `@@unique([assignmentId, studentUserId])`,
one per student). This means forum responses flow through the existing draft/submit/review/feedback
machinery for free. Comments are a new lightweight model.

### Schema changes (`prisma/schema.prisma`)
```prisma
enum AssignmentType { STANDARD  FORUM }

// Assignment additions:
type               AssignmentType @default(STANDARD)
forumMinWords      Int?
forumAllowComments Boolean        @default(false)
forumComments      ForumComment[]   // optional convenience relation, may be via Submission

model ForumComment {
  id            Int        @id @default(autoincrement())
  submissionId  Int                              // the peer response being commented on
  submission    Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  authorUserId  Int
  authorUser    User       @relation("ForumCommentAuthor", fields: [authorUserId], references: [id], onDelete: Restrict)
  body          String
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  @@index([submissionId])
  @@index([authorUserId])
}
```
`User` and `Submission` get the back-relations for `ForumComment`.

### Files to add / change
- **Schema + migration** — `prisma/schema.prisma` (+ `prisma migrate dev` after approval).
- `src/lib/assignment-actions.ts` — extend `AssignmentInput` + Zod with `type`, `forumMinWords`,
  `forumAllowComments`; persist on create/update.
- `src/lib/assignments-query.ts` — include forum fields in `loadAssignmentById` / detail type.
- `src/components/assignments/assignment-form.tsx` — add **Type** toggle (Standard / Forum).
  When Forum: show `Min words` + `Allow peer comments`, hide file-upload fieldset.
- `src/lib/forum-query.ts` (new) — `loadForumView(assignmentId, studentUserId)`:
  - the student's own submission (post/draft),
  - **locked** flag = student has not yet `SUBMITTED`,
  - when unlocked: peer responses where status != DRAFT, **scoped to the student's group**
    (`GroupStudent` join), newest first, with author name/avatar + comments (if allowed).
- `src/lib/forum-actions.ts` (new) — `submitForumPostAction(submissionId, text)` (enforces
  `forumMinWords`, marks SUBMITTED), `addForumCommentAction(submissionId, body)` (rejected unless
  `forumAllowComments`, group-membership checked), `deleteForumCommentAction` (author or admin).
- `src/lib/auth/permissions.ts` — `canCommentOnForum(user, submissionId)` helper (same-group student
  or season admin), reuse existing assignment gates for authoring.
- `src/components/forum/forum-view.tsx` (new, client) — compose box with **live word counter**
  (submit disabled below min), locked-feed placeholder, peer post cards, comment threads.
- `src/app/student/assignments/[id]/page.tsx` — branch on `type === "FORUM"` → render `ForumView`
  instead of `StudentSubmissionForm`.

### Word count
Strip HTML (responses are rich text via `RichTextEditor`), split on whitespace, count tokens.
Validate both client-side (live disable) and server-side in `submitForumPostAction`.

### RBAC / privacy
- Feed strictly limited to the student's **own group** members' responses.
- Comments only when `forumAllowComments` is true; author can delete own comment, admin can delete any.
- Reuse `getCurrentUserOrRedirect`, `requireRole`, `isAdminOfSeason`, group-membership checks.

### Edge cases
- Student with no group → empty group feed (EmptyState). Still can post.
- Re-submission/edits allowed per existing flow; comments persist.
- Assignment switched STANDARD↔FORUM after submissions exist: keep it simple — forum fields only
  apply when type is FORUM; existing submissions remain valid text.

---

# FEATURE A — Interactive Video Quizzes  *(next PR: `feat/video-quizzes`)*

Per session video (`Session.youtubeUrl`), admin places timed MCQ questions. While a student
watches an **embedded** player (YouTube IFrame Player API), playback pauses at each timestamp,
shows the question, records a graded answer, then resumes. Students **cannot skip** past an
unanswered question.

### Schema changes (new models — leave the existing paper `Quiz` untouched)
```prisma
model SessionVideoQuestion {
  id           Int      @id @default(autoincrement())
  sessionId    Int
  session      Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  atSeconds    Int
  prompt       String
  options      String[]                       // 2–6 MCQ choices
  correctIndex Int                            // graded → always set
  points       Int      @default(1)
  createdById  Int?
  createdBy    User?    @relation("VideoQuestionCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  responses    SessionVideoQuestionResponse[]
  @@index([sessionId, atSeconds])
}

model SessionVideoQuestionResponse {
  id            Int      @id @default(autoincrement())
  questionId    Int
  question      SessionVideoQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  studentUserId Int
  studentUser   User     @relation("VideoResponseStudent", fields: [studentUserId], references: [id], onDelete: Restrict)
  selectedIndex Int
  isCorrect     Boolean
  answeredAt    DateTime @default(now())
  @@unique([questionId, studentUserId])        // one answer, no retries
  @@index([studentUserId])
}

model SessionVideoProgress {
  id              Int      @id @default(autoincrement())
  sessionId       Int
  session         Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  studentUserId   Int
  studentUser     User     @relation("VideoProgressStudent", fields: [studentUserId], references: [id], onDelete: Restrict)
  furthestSeconds Int      @default(0)
  completedAt     DateTime?
  updatedAt       DateTime @updatedAt
  @@unique([sessionId, studentUserId])
}
```

### Files to add / change
- **Schema + migration** (approval gate).
- `src/lib/video-quiz-query.ts` — load questions for a session; load a student's responses + score + progress.
- `src/lib/video-quiz-actions.ts` — `createQuestionAction` / `updateQuestionAction` / `deleteQuestionAction`
  (ADMIN-scoped, mirror `assignment-actions.ts`); `submitVideoAnswerAction(questionId, selectedIndex)`
  (STUDENT — compute `isCorrect`, upsert response, advance `furthestSeconds`).
- `src/lib/auth/permissions.ts` — `canManageSessionVideo(user, sessionId)` (reuse season-admin check,
  like `canMarkAttendance`).
- Authoring UI on `src/app/admin/season/[code]/sessions/[id]/page.tsx` — "Video questions" section +
  `src/components/sessions/video-questions-editor.tsx` (client): timestamp mm:ss picker, prompt,
  options list, correct-answer radio.
- Student playback — replace the `Watch recording` link in
  `src/app/student/sessions/[id]/page.tsx` with `src/components/sessions/interactive-video-player.tsx`
  (client, IFrame Player API):
  - `playerVars: { controls: 0, fs: 0, rel: 0, modestbranding: 1 }`,
  - custom progress bar; seeking forward past `furthestSeconds` blocked,
  - poll `getCurrentTime()` ~250ms; at each `atSeconds` → `pauseVideo()`, show shadcn modal, submit, resume + advance,
  - resume from saved `furthestSeconds`; show score summary on completion.
- Optional later: surface per-student session quiz score in reports.

### Gating notes / risks
- `controls: 0` removes native scrubber so our custom bar is the only seek path → clean gating.
- `fs: 0` disables native fullscreen (which would hide our overlay); offer our own fullscreen on wrapper div.
- Auto-graded MCQ → no manual grading flow; `QUIZ_GRADED` notification type already exists if we want to notify.

---

## Build order checklist

**PR B — Forum (current):**
1. [ ] Schema: `AssignmentType`, forum fields on `Assignment`, `ForumComment` + back-relations
2. [ ] User approval → `npm run db:migrate`
3. [ ] `forum-query.ts`, `forum-actions.ts`, permission helper
4. [ ] Extend `assignment-actions.ts` + `assignments-query.ts`
5. [ ] Extend `assignment-form.tsx` (type toggle + forum fields)
6. [ ] `forum-view.tsx` + branch in student assignment page
7. [ ] `npm run typecheck` + `npm run lint` + design self-audit (token/component/mobile/state)
8. [ ] PR to `main`

**PR A — Video quizzes (next):** schema → libs/actions → admin editor → student player → verify → PR.
