# Plan

## Deliverables

### 1. AI spam moderation on report submit
- New TanStack server function `src/lib/moderation.functions.ts` using Lovable AI Gateway (`openai/gpt-5.5`) that returns `{ allow: boolean, reason?: string }`.
- Checks the `problem` (and optionally `witness`) text for: obvious spam/gibberish, empty‑content trolling, promotional/link spam, and off‑topic nonsense. It does NOT block emotional/negative language (real bullying reports are often distressing).
- `report.tsx` calls the moderation fn before inserting. On block, toast the returned reason and prevent submission. Fails open (allow) if the AI call errors, so a gateway outage never blocks a real report.

### 2. Class field validation
- Regex `^(?:[1-9]|1[0-2])[A-G]?$` (case‑insensitive; auto‑uppercased) enforced in the Zod schema in `report.tsx`.
- Placeholder updated to e.g. `10B` and helper text: "Class 1–12, optional section A–G (e.g. 7, 10B, 12G)".
- Values like `10J`, `13B`, `0A` are rejected client‑side with a clear message.

### 3. Reply flow (submitter can see school reply)
- Requires two new columns in your external Supabase `reports` table — I'll ship a SQL snippet you paste into your project's SQL editor:
  ```sql
  ALTER TABLE public.reports
    ADD COLUMN IF NOT EXISTS reply text,
    ADD COLUMN IF NOT EXISTS replied_at timestamptz;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO anon, authenticated;
  ```
- Admin dashboard: "Reply to Report" button opens an inline textarea; Save writes `reply` + `replied_at = now()` for that row.
- Editing an existing reply is supported (button label switches to "Edit reply").
- `/track/:code` already renders the reply block when `reply` is present — verified; will confirm end‑to‑end after the columns are added.

### 4. Admin dashboard Pending / Replied tabs
- Add shadcn `Tabs` at the top: **Pending** (reply is null/empty) and **Replied** (reply present), with counts in the tab labels.
- Same card layout inside each tab; delete + reply actions available in both.

### 5. Tracking‑code prominence
- On the report success screen: add a highlighted callout — "Save this code. It is the only way to view the school's reply. It cannot be recovered if lost." Includes copy button (already present) and a stronger visual treatment.
- On the report form: a short notice above the Send button — "You'll receive a tracking code after submitting. Please save it."

### 6. Homepage intro copy before the CTA
- Insert (above the "Report an Incident" button, below the existing badge):
  > **Bullying Prevention Online Help Desk**
  > If you're going through something, you're not alone.
  > Seth M.R. Jaipuria School, Digital Campaign Club, brings you a safe, confidential place to report bullying.
  > Rest assured, we're here to listen and support you.
- Replaces the current hero title/description block with this text (kept as the H1 + supporting paragraphs so SEO metadata already matches).

### 7. Dark mode fixes
- Hero, admin header, and tracking lookup currently use hardcoded `#2563eb` / `#0f172a` inline styles that ignore the theme. Replace with semantic tokens (`bg-primary`, `text-primary`, `text-foreground`, `bg-accent`, etc.) so light/dark both look correct.
- Fix the success card, badges, and form focus rings to use tokens.
- Verify the `ThemeToggle` in `__root.tsx` still works and add `suppressHydrationWarning` handling for the initial theme (read from `localStorage` in a pre‑hydration inline script to avoid a light‑mode flash on dark users).
- Manual pass through `/`, `/report`, `/track/:code`, `/auth`, `/admin` in both themes via a Playwright screenshot check.

## Out of scope
- Rebuilding the backend on Lovable Cloud — we stay on your external Supabase project `cafhfyxtvahvxvdhkzqh`.
- Restoring witness photo uploads (removed earlier per your request).
- Blocking / editing reports beyond delete + reply.
- Admin‑editable site design (finalized and removed earlier).
- Screenshot prevention beyond the existing deterrents.
- Any new auth/roles system — any Supabase Auth user remains admin.
- Rate limiting / captcha on submissions.
- Automated tests; verification is a manual Playwright pass.

## Technical notes
- Moderation uses `LOVABLE_API_KEY` server‑side via the AI Gateway; no client key exposure. Model: `openai/gpt-5.5` with a short JSON‑structured prompt returning `{allow, reason}`; a 5s timeout with fail‑open.
- Class regex is validated both in the Zod schema and re‑checked server‑side inside the moderation fn as a defense‑in‑depth measure.
- Reply UI uses optimistic refresh (`refresh()` after save).
- Dark mode: only presentational token swaps; no business logic touched.
