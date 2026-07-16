# Bulk student import

Status: **in progress** (importer slice). Author: derived from a grill-me design session, 2026-07-16.

Bulk-create student accounts from a spreadsheet instead of one at a time. This doc specs the shippable **importer slice** and captures the deferred **student-lifecycle / alumni** feature it kept colliding with, so those decisions aren't lost.

---

## Decisions (locked)

| Decision | Choice | Why |
|---|---|---|
| Who can run it | **SUPER only** | Creating `User` rows is `canManageUsers` → SUPER-only. Import writes to the global user table, so it stays SUPER-scoped. |
| File formats | **CSV and .xlsx** | Parsed server-side with `exceljs` (one dependency reads both). |
| Columns | **`name`, `email`** (header row, case-insensitive) | Students only; role fixed to `STUDENT`. |
| Identity / dedup key | **`email`** (`User.email @unique`) | The only unique identifier in the schema; reliable for this cohort. |
| Activation | **Invite token** (reuse `createInvite`) | Student sets their own password via `/accept-invite`; 72h expiry. No pre-set passwords. `passwordHash` stays `null` until accepted, so the account cannot be logged into before activation. |
| Season placement | **One season for the whole batch** | SUPER picks it in the UI. |
| What "placed in a season" means | Set `StudentProfile.activeSeasonId` **and** create a groupless `SeasonEnrollment` (`status = ACTIVE`, `groupId = null`) | `SeasonEnrollment.groupId` is optional. The durable enrollment row is what makes a student (a) visible as "enrolled but unassigned", (b) able to retain historical read access as an alumnus. `activeSeasonId` alone is not durable. |
| Idempotency | **Skip existing** | Existing email = skip (not error, not duplicate). Second upload of the same file creates zero duplicate accounts / tokens. Pre-check for the preview UX; the `User.email` unique constraint (and `SeasonEnrollment [studentUserId, seasonId]`) is the correctness backstop for races. |
| Activation visibility | **"Invited" status** on the users list | A STUDENT with a pending unused invite who has never logged in shows as `Invited`, so a silently-bounced invite is visible rather than a ghost account. |

## Flow

1. **Upload** — SUPER uploads a `.csv`/`.xlsx` and selects the target season.
2. **Preview** — server parses + validates every row and returns a per-row status:
   - `new` — will be created.
   - `exists` — email already in the system → **skipped**.
   - `duplicate` — email repeated earlier in the same file → skipped.
   - `invalid` — missing/blank name or bad email → skipped, with a reason.
3. **Confirm** — SUPER imports only the `new` rows. Each creates, idempotently:
   `User(role=STUDENT, passwordHash=null)` + `StudentProfile(activeSeasonId)` + `SeasonEnrollment(ACTIVE, groupId=null)` + invite token/email.
4. **Result** — a summary of created / skipped / failed.

## Scope of this PR

**In:** the importer (upload → preview → confirm → invite), groupless enrollment, idempotent skip-existing, and the `Invited` status indicator on the users list.

**Out (documented, not built):**
- **Season-admin "unassigned students" view.** The data now supports it (query `SeasonEnrollment where seasonId = ? and groupId is null`); the roster UI is a separate change.
- **Group-assignment via import** (placing enrolled students into groups).
- The lifecycle feature below.

---

## Deferred: student lifecycle / alumni (NOT in this PR)

Surfaced during design; a real feature that must not be bolted onto the importer. Captured here with its open questions.

**Intended behaviour:**
- Students progress through a **configurable ordered track** of program levels — currently *The Way → GBV → 3G* — where "next season" means the next level in that order, not the nearest by date.
- Marking a student **graduated** in a season auto-enrolls them into the next level's season.
- After graduating the final level (**3G**), a person becomes **eligible to be a LEADER** (not before). They may or may not lead in a given season.
- Graduates are marked **Alumni** and **never** lose their old material: they keep **view-only** access to seasons they completed (can view, cannot edit or submit).

**Open questions (resolve before building):**
1. **`Alumni` representation.** It **cannot** be a `role` — an alumnus may *also* be a LEADER, and `User.role` holds exactly one value. So Alumni must be a **status flag orthogonal to `role`**. Every role check and status badge must learn about it.
2. **Read-vs-write access split.** `canAccessSeason` is currently boolean. "View but not submit" requires two levels: **read** (any season you were ever enrolled in, via `SeasonEnrollment`) vs **write** (only your current `activeSeasonId`). Real change to `src/lib/auth/permissions.ts`.
3. **"Next season" resolution + timing.** The track defines *order*; it does not say *which concrete future `Season` instance* a graduate joins, nor what happens when that instance doesn't exist yet (e.g. graduate in July, next cohort created in September). Queue? Block? Defer to season creation?
4. **Track configuration = schema change.** A program-level/track table with an order column, plus a way to tag each `Season` with its level. Needs a migration (requires explicit approval per the DB workflow).
5. **Leader-eligibility gate.** "Only after 3G" is a rule that must live somewhere; the actual `STUDENT → LEADER` role change stays SUPER-only.

**Dependency on this PR:** the alumni "view old material" guarantee only holds if every student has a durable `SeasonEnrollment`. This is exactly why the importer creates one — so imported students aren't stranded without history when they later graduate.
