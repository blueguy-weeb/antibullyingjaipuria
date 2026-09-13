import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Lock, KeyRound } from "lucide-react";

// ============================================================
// Same verification code as in src/routes/_authenticated/admin.tsx.
// Anyone with this code can reset the admin password from the login screen.
const ADMIN_PW_CHANGE_CODE = "arjunisdabest";
// ============================================================

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Admin Sign In — Anti-Bullying Reporting" },
      { name: "description", content: "Administrator sign-in for the Seth M.R. Jaipuria School anti-bullying reporting panel." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin Sign In — Anti-Bullying Reporting" },
      { property: "og:description", content: "Administrator sign-in for the Seth M.R. Jaipuria School anti-bullying reporting panel." },
      { property: "og:url", content: "https://digitalcampaign.lovable.app/auth" },
    ],
    links: [{ rel: "canonical", href: "https://digitalcampaign.lovable.app/auth" }],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const enteredLogin = email.trim().toLowerCase();
    const cleanEmail = enteredLogin.includes("@") ? enteredLogin : `${enteredLogin}@jaipuria.local`;
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      // Log the attempt (best-effort, non-blocking failure)
      supabase
        .from("login_logs")
        .insert({
          user_email: cleanEmail,
          event: error ? "sign_in_failed" : "sign_in_success",
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        })
        .then(() => {})
        .then(undefined, () => {});
      if (error) throw error;
      toast.success("Signed in");
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      toast.error((err as Error).message || "Invalid credentials");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-md">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <h1 className="mt-4 text-center text-2xl font-bold">Admin Panel</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Seth M.R. Jaipuria School · Digital Campaign Club
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="admin-email">Username or email</Label>
              <Input
                id="admin-email"
                name="email"
                type="text"
                autoComplete="username"
                placeholder="digital.campaign"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : "Sign in"}
            </Button>
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="mt-2 inline-flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Reset password with verification code
            </button>
          </form>
        </div>
      </div>
      <ResetPasswordDialog open={resetOpen} onOpenChange={setResetOpen} defaultEmail={email} />
    </div>
  );
}

function ResetPasswordDialog({
  open,
  onOpenChange,
  defaultEmail,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultEmail: string;
}) {
  const [mail, setMail] = useState(defaultEmail);
  const [oldPw, setOldPw] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setOldPw("");
    setCode("");
    setPw("");
    setPw2("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code !== ADMIN_PW_CHANGE_CODE) return toast.error("Incorrect verification code");
    if (pw.length < 8) return toast.error("New password must be at least 8 characters");
    if (pw !== pw2) return toast.error("Passwords do not match");
    setBusy(true);
    const enteredLogin = mail.trim().toLowerCase();
    const cleanEmail = enteredLogin.includes("@") ? enteredLogin : `${enteredLogin}@jaipuria.local`;
    const { error: sErr } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: oldPw });
    if (sErr) {
      setBusy(false);
      return toast.error("Current password is incorrect");
    }
    const { error: uErr } = await supabase.auth.updateUser({ password: pw });
    await supabase.auth.signOut();
    setBusy(false);
    if (uErr) return toast.error(uErr.message);
    toast.success("Password updated — sign in with your new password");
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset admin password</DialogTitle>
          <DialogDescription>
            Enter the verification code, your current password, and a new password. You must still know the current
            password to reset from here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="rp-email">Username or email</Label>
            <Input id="rp-email" type="text" autoComplete="username" value={mail} onChange={(e) => setMail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="rp-old">Current password</Label>
            <Input id="rp-old" type="password" autoComplete="current-password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="rp-code">Verification code</Label>
            <Input id="rp-code" type="password" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="rp-new">New password</Label>
            <Input id="rp-new" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} required />
          </div>
          <div>
            <Label htmlFor="rp-new2">Confirm new password</Label>
            <Input id="rp-new2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={8} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Updating…" : "Update password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

