import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { reportsDb } from "@/lib/reports-client";
import { toast } from "sonner";
import { LogOut, Trash2, RefreshCw, MessageSquare, Send, X } from "lucide-react";

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

  useEffect(() => { refresh(); }, []);

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">
              {reports.length} total · {pending.length} pending · {replied.length} replied
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={refresh}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="replied">Replied ({replied.length})</TabsTrigger>
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
          </Tabs>
        )}
      </main>
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
