## Deliverables

### 1. CSV export (admin dashboard)
Three buttons in the admin header: **Export Pending**, **Export Replied**, **Export All**. Client-side CSV generation from the already-loaded `reports` array (no extra queries, no AI credits). Columns: `track_id, student_name, class, class_teacher, problem, witness, reply, replied_at, created_at`. Filenames like `reports-pending-2026-07-21.csv`.

### 2. Change password (admin)
New **Change Password** button in admin header opens a dialog with:
- Verification code input (compared to a hardcoded constant `ADMIN_PW_CHANGE_CODE` in `src/routes/_authenticated/admin.tsx`)
- New password + confirm new password
- On success calls `reportsDb.auth.updateUser({ password })`

**I will leave `ADMIN_PW_CHANGE_CODE = "CHANGE_ME"` as a placeholder** at the top of `admin.tsx` — you replace it with your secret. I will tell you the exact file + line.

### 3. Stricter AI moderation (`src/lib/moderation.functions.ts`)
Tighten the system prompt to block, in addition to spam:
- Reports under ~15 meaningful characters
- Reports without at least one identifiable subject/action
- Profanity-only or insult-only submissions with no incident described
- Obvious tests ("hi", "hello", "yo", single emojis, repeated chars)
- Impersonation / accusations against staff without any described incident
- Non-English gibberish / romanized keyboard mash

Still fail-open on gateway error. No model change (stays on `openai/gpt-5.5` — 1 call per submit, same cost as now).

### 4. Login log
New table `login_logs` in your external Supabase with: `id, user_email, event ('sign_in_success' | 'sign_in_failed'), ip, user_agent, created_at`.

- `src/routes/auth.tsx` writes a row on every sign-in attempt (success + failure), captured with `navigator.userAgent`; IP left blank client-side (Supabase adds it via `x-forwarded-for` only from server contexts — noted as limitation).
- New tab **Login Log** in admin dashboard lists the most recent 100 entries, newest first, with failed attempts highlighted red.

**I will give you the SQL to run** in your Supabase SQL editor (external project — I can't migrate it from here):
```sql
CREATE TABLE public.login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text,
  event text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.login_logs TO anon, authenticated;
GRANT SELECT, DELETE ON public.login_logs TO authenticated;
```

### 5. Screenshot / copy / paste deterrents — admin only
Current `__root.tsx` blocks right-click, selection, drag, Ctrl+S/P/U, PrintScreen, and blurs on focus loss **for everyone**. Change: gate all of it behind "is an admin session active" (check `reportsDb.auth.getSession()` + subscribe to `onAuthStateChange`). Public visitors on `/`, `/report`, `/track/:code` get normal browser behavior including copy/paste/screenshots. Admin pages keep every deterrent, plus add explicit `copy`/`paste`/`cut` blockers.

## Out of scope
- Server-side IP capture in login log (needs a server function — skipped to save credits; UA + timestamp only).
- Rate limiting sign-in attempts (would need a server function).
- True screenshot prevention (impossible in a browser; deterrents only, as before).
- Auto-generating or rotating the password-change verification code — you set it manually.
- Any change to the reports table schema.
- Publishing / deploy.

## Credit budget
Zero AI credits used during implementation (all code edits are deterministic). Runtime moderation cost is unchanged — still 1 gateway call per report submit.

## Files touched
- `src/routes/_authenticated/admin.tsx` — CSV export, change-password dialog, login-log tab, `ADMIN_PW_CHANGE_CODE` constant
- `src/routes/auth.tsx` — insert login attempt row on success + failure
- `src/routes/__root.tsx` — gate deterrents behind admin session; add copy/paste/cut blockers when admin
- `src/lib/moderation.functions.ts` — stricter system prompt

## After you approve
I'll implement, then message you with:
1. The exact file + line of `ADMIN_PW_CHANGE_CODE` to replace.
2. The `login_logs` SQL to paste into your Supabase SQL editor.
