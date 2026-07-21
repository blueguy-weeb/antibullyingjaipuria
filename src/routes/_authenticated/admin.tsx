import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { reportsDb } from "@/lib/reports-client";
import { toast } from "sonner";
import {
  LogOut,
  Trash2,
  RefreshCw,
  MessageSquare,
  Send,
  X,
  Download,
  KeyRound,
} from "lucide-react";

// ============================================================
// TODO(admin): Replace this placeholder with your real verification code.
// This code is required before an admin can change their password.
// Keep it secret; anyone with this code can reset the admin password.
const ADMIN_PW_CHANGE_CODE = "CHANGE_ME";
// ============================================================

type Report = {
  id: string;
  track_id: string;
  student_name: string;
  class_teacher: string;
  class: string;
  problem: string;
  witness: string | null;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
};

type LoginLog = {
  id: string;
  user_email: string | null;
  event: string;
  user_agent: string | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [savingReply, setSavingReply] = useState(false);
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  useEffect(() => {
    refresh();
    refreshLogs();
  }, []);

  async function refresh() {
    setLoading(true);
    const { data, error } = await reportsDb
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setReports((data ?? []) as Report[]);
    setLoading(false);
  }

  async function refreshLogs() {
    setLogsLoading(true);
    const { data, error } = await reportsDb
      .from("login_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error && error.code !== "42P01") {
      // 42P01 = table missing; keep UI quiet until user creates it
      toast.error(error.message);
    }
    setLogs((data ?? []) as LoginLog[]);
    setLogsLoading(false);
  }

  async function signOut() {
    await reportsDb.auth.signOut();
    navigate({ to: "/auth" });
  }

  async function remove(id: string) {
    if (!confirm("Delete this report permanently?")) return;
    const { error } = await reportsDb.from("reports").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    await refresh();
  }

  function openReply(r: Report) {
    setReplyingId(r.id);
    setReplyText(r.reply ?? "");
  }

  function cancelReply() {
    setReplyingId(null);
    setReplyText("");
  }

  async function saveReply(id: string) {
    const text = replyText.trim();
    if (!text) return toast.error("Reply cannot be empty");
    setSavingReply(true);
    const { error } = await reportsDb
      .from("reports")
      .update({ reply: text, replied_at: new Date().toISOString() })
      .eq("id", id);
    setSavingReply(false);
    if (error) return toast.error(error.message);
    toast.success("Reply sent");
    cancelReply();
    await refresh();
  }

  const pending = useMemo(() => reports.filter((r) => !r.reply?.trim()), [reports]);
  const replied = useMemo(() => reports.filter((r) => !!r.reply?.trim()), [reports]);

  function exportCsv(rows: Report[], label: string) {
    if (rows.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const headers = [
      "track_id",
      "student_name",
      "class",
      "class_teacher",
      "problem",
      "witness",
      "reply",
      "replied_at",
      "created_at",
    ];
    const escape = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.track_id,
          r.student_name,
          r.class,
          r.class_teacher,
          r.problem,
          r.witness,
          r.reply,
          r.replied_at,
          r.created_at,
        ]
          .map(escape)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `reports-${label}-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">
              {reports.length} total · {pending.length} pending · {replied.length} replied
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCsv(pending, "pending")}>
              <Download className="mr-2 h-4 w-4" />Export Pending
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCsv(replied, "replied")}>
              <Download className="mr-2 h-4 w-4" />Export Replied
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCsv(reports, "all")}>
              <Download className="mr-2 h-4 w-4" />Export All
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPwOpen(true)}>
              <KeyRound className="mr-2 h-4 w-4" />Change Password
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { refresh(); refreshLogs(); }}>
              <RefreshCw className="mr-2 h-4 w-4" />Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="replied">Replied ({replied.length})</TabsTrigger>
              <TabsTrigger value="logs">Login Log</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6 space-y-4">
              {pending.length === 0 ? (
                <EmptyState label="No pending reports." />
              ) : pending.map((r) => (
                <ReportCard
                  key={r.id} r={r}
                  replyingId={replyingId} replyText={replyText} savingReply={savingReply}
                  setReplyText={setReplyText} openReply={openReply} cancelReply={cancelReply}
                  saveReply={saveReply} remove={remove}
                />
              ))}
            </TabsContent>

            <TabsContent value="replied" className="mt-6 space-y-4">
              {replied.length === 0 ? (
                <EmptyState label="No replied reports yet." />
              ) : replied.map((r) => (
                <ReportCard
                  key={r.id} r={r}
                  replyingId={replyingId} replyText={replyText} savingReply={savingReply}
                  setReplyText={setReplyText} openReply={openReply} cancelReply={cancelReply}
                  saveReply={saveReply} remove={remove}
                />
              ))}
            </TabsContent>

            <TabsContent value="logs" className="mt-6">
              <LoginLogList logs={logs} loading={logsLoading} />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
      {label}
    </div>
  );
}

function LoginLogList({ logs, loading }: { logs: LoginLog[]; loading: boolean }) {
  if (loading) return <div className="p-6 text-center text-muted-foreground">Loading…</div>;
  if (logs.length === 0) {
    return (
      <EmptyState label="No login attempts recorded yet. If this looks wrong, ensure the login_logs table exists in your database." />
    );
  }
  return (
    <div className="space-y-2">
      {logs.map((l) => {
        const failed = l.event === "sign_in_failed";
        return (
          <div
            key={l.id}
            className={`flex flex-wrap items-start justify-between gap-2 rounded-lg border p-3 text-sm ${
              failed
                ? "border-destructive/40 bg-destructive/10"
                : "border-border bg-card"
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{l.user_email ?? "(unknown)"}</span>
                <Badge variant={failed ? "destructive" : "secondary"}>
                  {failed ? "Failed" : "Success"}
                </Badge>
              </div>
              <p className="mt-1 break-all text-xs text-muted-foreground">
                {l.user_agent ?? "no user-agent"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(l.created_at).toLocaleString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setCode("");
    setPw("");
    setPw2("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code !== ADMIN_PW_CHANGE_CODE) {
      return toast.error("Incorrect verification code");
    }
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    if (pw !== pw2) return toast.error("Passwords do not match");
    setBusy(true);
    const { error } = await reportsDb.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
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
          <DialogTitle>Change admin password</DialogTitle>
          <DialogDescription>
            Enter the verification code, then set a new password for this admin
            account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="pw-code">Verification code</Label>
            <Input
              id="pw-code"
              type="password"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="pw-new">New password</Label>
            <Input
              id="pw-new"
              type="password"
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div>
            <Label htmlFor="pw-new2">Confirm new password</Label>
            <Input
              id="pw-new2"
              type="password"
              autoComplete="new-password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
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

function ReportCard({
  r, replyingId, replyText, savingReply, setReplyText,
  openReply, cancelReply, saveReply, remove,
}: {
  r: Report;
  replyingId: string | null;
  replyText: string;
  savingReply: boolean;
  setReplyText: (v: string) => void;
  openReply: (r: Report) => void;
  cancelReply: () => void;
  saveReply: (id: string) => void;
  remove: (id: string) => void;
}) {
  const isReplying = replyingId === r.id;
  const hasReply = !!r.reply?.trim();

  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{r.student_name}</h3>
            <Badge variant="secondary">Class {r.class}</Badge>
            <Badge variant={hasReply ? "default" : "outline"}>
              {hasReply ? "Replied" : "Pending"}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Teacher: {r.class_teacher} · Code <code className="font-mono">{r.track_id}</code>
          </p>
          <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 space-y-2 rounded-lg bg-muted p-4 text-sm">
        <div>
          <span className="font-medium">Problem:</span>{" "}
          <span className="whitespace-pre-wrap">{r.problem}</span>
        </div>
        {r.witness && (
          <div>
            <span className="font-medium">Witness:</span> {r.witness}
          </div>
        )}
      </div>

      {hasReply && !isReplying && (
        <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Your reply
          </div>
          <div className="mt-1 whitespace-pre-wrap">{r.reply}</div>
          {r.replied_at && (
            <p className="mt-2 text-xs text-muted-foreground">
              Sent {new Date(r.replied_at).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {isReplying ? (
        <div className="mt-4 space-y-2">
          <Textarea
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply to the student…"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={cancelReply}>
              <X className="mr-2 h-4 w-4" />Cancel
            </Button>
            <Button size="sm" disabled={savingReply} onClick={() => saveReply(r.id)}>
              <Send className="mr-2 h-4 w-4" />
              {savingReply ? "Sending…" : "Send reply"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={() => openReply(r)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            {hasReply ? "Edit reply" : "Reply to Report"}
          </Button>
        </div>
      )}
    </div>
  );
}
