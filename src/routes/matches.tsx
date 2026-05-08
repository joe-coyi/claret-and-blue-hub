import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/matches")({
  head: () => ({ meta: [{ title: "Matchday Center — Claret & Co." },{ name:"description", content:"Live scores, fixtures, and results for West Ham United." }] }),
  component: Matches,
});

function Matches() {
  const { data: matches } = useQuery({
    queryKey: ["matches"],
    queryFn: async () => (await supabase.from("matches").select("*").order("kickoff", { ascending: false })).data ?? [],
  });
  const live = matches?.filter(m => m.status === "live") ?? [];
  const upcoming = matches?.filter(m => m.status === "scheduled").reverse() ?? [];
  const finished = matches?.filter(m => m.status === "finished") ?? [];

  return (
    <div className="container mx-auto px-4 py-12">
      <p className="text-xs uppercase tracking-widest text-accent">Matchday Center</p>
      <h1 className="font-display text-4xl md:text-6xl uppercase">All fixtures &amp; results</h1>

      {live.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display uppercase text-xl mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" /> Live now
          </h2>
          <div className="grid md:grid-cols-2 gap-4">{live.map(m => <MatchCard key={m.id} m={m} />)}</div>
        </section>
      )}

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

function MatchCard({ m }: { m: any }) {
  return (
    <Link to="/matches/$id" params={{ id: m.id }}>
      <Card className="stadium-card p-6 border-0 hover:border-accent transition-colors">
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
