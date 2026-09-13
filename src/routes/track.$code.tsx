import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

type Report = {
  track_id: string;
  student_name: string;
  class_teacher: string;
  class: string;
  problem: string;
  witness: string | null;
  created_at: string;
  reply: string | null;
  replied_at: string | null;
};

export const Route = createFileRoute("/track/$code")({
  component: TrackPage,
  head: ({ params }) => ({
    meta: [
      { title: "Your Report — Anti-Bullying Reporting" },
      { name: "description", content: "Private view of your submitted bullying report." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Your Report — Anti-Bullying Reporting" },
      { property: "og:description", content: "Private view of your submitted bullying report." },
      { property: "og:url", content: `https://digitalcampaign.lovable.app/track/${params.code}` },
    ],
    links: [{ rel: "canonical", href: `https://digitalcampaign.lovable.app/track/${params.code}` }],
  }),
});

function TrackPage() {
  const { code } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_incident_by_code", { _code: code });
      if (error) console.error(error);
      const incident = data?.[0];
      setReport(incident ? {
        track_id: incident.tracking_code,
        student_name: incident.name,
        class_teacher: incident.class_teacher,
        class: incident.class_name,
        problem: incident.problem,
        witness: incident.witness,
        created_at: incident.created_at,
        reply: incident.reply,
        replied_at: incident.replied_at,
      } : null);
      setLoading(false);
    })();
  }, [code]);

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>

        {loading ? (
          <div className="mt-10 text-center text-muted-foreground">Loading…</div>
        ) : !report ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center">
            <h1 className="text-xl font-semibold">Report not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't find a report with code <code className="font-mono">{code}</code>.
            </p>
          </div>
        ) : (
          <>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Your Report</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={report.reply?.trim() ? "default" : "secondary"}>
                {report.reply?.trim() ? "Replied" : "Pending"}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Code: <code className="font-mono">{report.track_id}</code> · Submitted{" "}
                {new Date(report.created_at).toLocaleString()}
              </p>
            </div>

            <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Row label="Name" value={report.student_name} />
              <Row label="Class teacher" value={report.class_teacher} />
              <Row label="Class" value={report.class} />
              <Row label="Problem" value={report.problem} multiline />
              {report.witness && <Row label="Witness" value={report.witness} />}
            </div>

            {report.reply?.trim() ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">School reply</div>
                <div className="mt-2 whitespace-pre-wrap">{report.reply}</div>
                {report.replied_at ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Replied on {new Date(report.replied_at).toLocaleString()}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
                No reply has been sent yet. Please check back later.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={"mt-1 text-sm " + (multiline ? "whitespace-pre-wrap" : "")}>{value}</div>
    </div>
  );
}
