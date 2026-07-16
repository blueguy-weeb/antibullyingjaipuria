import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, FileText, Search, Lock } from "lucide-react";

const SITE_TITLE = "Bullying Prevention Online Help Desk";
const SITE_DESCRIPTION = `If you're going through something, you're not alone.

Seth M.R. Jaipuria School, Digital Campaign Club, brings you a safe, confidential place to report bullying.

Rest assured, we're here to listen and support you.`;

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:url", content: "https://digitalcampaign.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://digitalcampaign.lovable.app/" }],
  }),
});

function Index() {
  const [code, setCode] = useState("");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <Link
          to="/auth"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition hover:text-foreground"
        >
          <Lock className="h-3.5 w-3.5" />
          Admin Login
        </Link>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Confidential
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-10 md:pt-20">
        <div className="text-center">
          <div className="mb-6 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Safe. Private. Heard.
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            {SITE_TITLE}
          </h1>
          <p className="mx-auto mt-6 max-w-xl whitespace-pre-line text-base leading-relaxed text-muted-foreground md:text-lg">
            {SITE_DESCRIPTION}
          </p>

          <div className="mt-10">
            <Button
              asChild
              size="lg"
              className="h-14 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg transition hover:scale-[1.02] hover:bg-primary/90"
            >
              <Link to="/report">
                <FileText className="mr-2 h-5 w-5" />
                Report an Incident
              </Link>
            </Button>
          </div>
        </div>

        {/* Reply lookup */}
        <section className="mt-20 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-card-foreground">
                Check for updates
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your code below to view replies from the school team.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const c = code.trim().toUpperCase();
                  if (c) window.location.href = `/track/${c}`;
                }}
                className="mt-4 flex flex-col gap-2 sm:flex-row"
              >
                <Input
                  id="tracking-code"
                  name="tracking-code"
                  aria-label="Report tracking code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="E.G. A1B2C3D4E5"
                  className="font-mono uppercase tracking-wider"
                  maxLength={20}
                />
                <Button type="submit">View reply</Button>
              </form>
            </div>
          </div>
        </section>

        {/* Info cards */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "Confidential Reporting",
              body: "We maintain confidentiality. Only the school team can see your report.",
            },
            { title: "Tracked reply", body: "Come back anytime with your code to view updates." },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border border-border bg-card/50 p-5">
              <div className="text-sm font-semibold text-card-foreground">{c.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{c.body}</div>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        <p className="mx-auto max-w-xl">
          Through awareness, conscious efforts, and compassion, we're building a kinder school community for everyone.
        </p>
      </footer>
    </div>
  );
}
