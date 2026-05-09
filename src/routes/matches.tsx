import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio } from "lucide-react";

export const Route = createFileRoute("/matches")({
  head: () => ({ meta: [{ title: "Matchday Center — Claret & Co." },{ name:"description", content:"Live scores, fixtures, and results for West Ham United." }] }),
  component: Matches,
});

function Matches() {
  const location = useLocation();

  if (location.pathname !== "/matches") {
    return <Outlet />;
  }

  const { data: matches } = useQuery({
    queryKey: ["matches"],
    queryFn: async () => (await supabase.from("matches").select("*").order("kickoff", { ascending: false })).data ?? [],
  });
  const live = matches?.filter(m => m.status === "live") ?? [];
  const upcoming = matches?.filter(m => m.status === "scheduled").reverse() ?? [];
  const finished = matches?.filter(m => m.status === "finished") ?? [];

  return (
    <div className="container mx-auto px-4 py-12">
      {live.length > 0 && (
        <div className="mb-8">
          {live.map(m => <LiveBanner key={m.id} m={m} />)}
        </div>
      )}
      <p className="text-xs uppercase tracking-widest text-accent">Matchday Center</p>
      <h1 className="font-display text-4xl md:text-6xl uppercase">All fixtures &amp; results</h1>

      <section className="mt-12">
        <h2 className="font-display uppercase text-xl mb-4">Upcoming</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {upcoming.length === 0 && <p className="text-muted-foreground">No upcoming fixtures.</p>}
          {upcoming.map(m => <MatchCard key={m.id} m={m} />)}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display uppercase text-xl mb-4">Recent results</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {finished.map(m => <MatchCard key={m.id} m={m} />)}
        </div>
      </section>
    </div>
  );
}

export function LiveBanner({ m }: { m: any }) {
  const wh = m.is_home ? m.west_ham_score : m.opponent_score;
  const op = m.is_home ? m.opponent_score : m.west_ham_score;
  return (
    <Link to="/matches/$id" params={{ id: m.id }}>
      <div
        className="relative overflow-hidden rounded-xl p-6 md:p-8 border-2"
        style={{
          borderColor: "oklch(0.82 0.16 85)",
          background: "linear-gradient(135deg, oklch(0.25 0.05 60) 0%, oklch(0.18 0.03 30) 60%, oklch(0.30 0.10 80) 100%)",
          boxShadow: "0 0 60px -10px oklch(0.82 0.16 85 / 0.45)",
        }}
      >
        <div className="absolute top-3 right-4 flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: "oklch(0.92 0.16 90)" }}>
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          Live now {m.current_minute ? `· ${m.current_minute}'` : ""}
        </div>
        <p className="text-xs uppercase tracking-widest" style={{ color: "oklch(0.92 0.16 90)" }}>
          {m.competition} · {m.is_home ? "Home" : "Away"} · {m.venue}
        </p>
        <div className="mt-4 flex items-center justify-between gap-6">
          <div className="font-display text-2xl md:text-3xl uppercase flex-1">{m.is_home ? "West Ham" : m.opponent}</div>
          <div className="font-display text-5xl md:text-7xl tabular-nums" style={{ color: "oklch(0.92 0.16 90)" }}>
            {wh ?? 0} <span className="text-foreground/40">-</span> {op ?? 0}
          </div>
          <div className="font-display text-2xl md:text-3xl uppercase flex-1 text-right">{m.is_home ? m.opponent : "West Ham"}</div>
        </div>
        <div className="mt-4 text-xs uppercase tracking-widest text-foreground/70">Tap for live timeline, lineups &amp; goal scorers →</div>
      </div>
    </Link>
  );
}

function MatchCard({ m }: { m: any }) {
  return (
    <Link to="/matches/$id" params={{ id: m.id }} className="block h-full">
      <Card className="stadium-card h-full p-6 border-0 hover:border-accent transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{m.competition} · {m.is_home?"Home":"Away"}</div>
            <div className="font-display text-2xl mt-2">
              {m.is_home ? "West Ham" : m.opponent}
              <span className="mx-2 text-muted-foreground text-base">vs</span>
              {m.is_home ? m.opponent : "West Ham"}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{new Date(m.kickoff).toLocaleString()}</div>
          </div>
          <div className="text-right">
            {m.status === "finished" ? (
              <div className="font-display text-3xl">{m.is_home? m.west_ham_score:m.opponent_score}-{m.is_home? m.opponent_score:m.west_ham_score}</div>
            ) : (
              <Badge variant="outline">{m.status}</Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
