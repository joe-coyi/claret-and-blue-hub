import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, Trophy, Goal, Square } from "lucide-react";

export const Route = createFileRoute("/matches/$id")({
  component: MatchPage,
});

function MatchPage() {
  const { id } = Route.useParams();
  const { data: match } = useQuery({
    queryKey: ["match", id],
    queryFn: async () => (await supabase.from("matches").select("*, motm:motm_player_id(name, photo_url)").eq("id", id).maybeSingle()).data,
  });
  const { data: events } = useQuery({
    queryKey: ["events", id],
    queryFn: async () => (await supabase.from("match_events").select("*, players(name)").eq("match_id", id).order("minute")).data ?? [],
  });

  if (!match) return <div className="container mx-auto px-4 py-20">Loading...</div>;
  const isLive = match.status === "live";
  const goldStyle = isLive ? { color: "oklch(0.92 0.16 90)" } : undefined;

  return (
    <div className="container mx-auto px-4 py-12">
      <Link to="/matches" className="text-sm text-accent hover:underline">← All matches</Link>
      <div
        className="mt-4 stadium-card p-10 relative overflow-hidden"
        style={isLive ? {
          borderColor: "oklch(0.82 0.16 85)",
          background: "linear-gradient(135deg, oklch(0.25 0.05 60) 0%, oklch(0.18 0.03 30) 60%, oklch(0.30 0.10 80) 100%)",
          boxShadow: "0 0 60px -10px oklch(0.82 0.16 85 / 0.45)",
          borderWidth: 2,
        } : undefined}
      >
        <div className="flex justify-between items-center text-xs uppercase tracking-widest text-muted-foreground">
          <span>{match.competition} · {match.is_home?"Home":"Away"}</span>
          {isLive ? (
            <span className="flex items-center gap-1.5 font-semibold" style={goldStyle}>
              <Radio className="h-3.5 w-3.5 animate-pulse"/> LIVE {match.current_minute ? `· ${match.current_minute}'` : ""}
            </span>
          ) : <Badge variant="outline">{match.status}</Badge>}
        </div>
        <div className="mt-6 grid grid-cols-3 items-center gap-4">
          <div className="text-center"><div className="font-display text-2xl uppercase">{match.is_home?"West Ham":match.opponent}</div></div>
          <div className="text-center font-display text-6xl" style={goldStyle}>
            {match.status==="finished" || match.status==="live"
              ? `${match.is_home?match.west_ham_score:match.opponent_score} - ${match.is_home?match.opponent_score:match.west_ham_score}`
              : "vs"}
          </div>
          <div className="text-center"><div className="font-display text-2xl uppercase">{match.is_home?match.opponent:"West Ham"}</div></div>
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">{new Date(match.kickoff).toLocaleString()} · {match.venue}</div>
        {match.motm && (
          <div className="mt-6 text-center">
            <p className="text-xs uppercase tracking-widest text-accent">Man of the Match</p>
            <p className="font-display text-xl mt-1">{(match.motm as any).name}</p>
          </div>
        )}
        {match.summary && <p className="mt-6 text-center text-muted-foreground max-w-2xl mx-auto">{match.summary}</p>}
      </div>

      {/* Goal scorers strip */}
      {events && events.some((e:any)=>e.event_type==="goal") && (
        <Card className="stadium-card p-6 border-0 mt-6">
          <h3 className="font-display uppercase text-sm text-accent mb-3 flex items-center gap-2"><Goal className="h-4 w-4"/> Goal scorers</h3>
          <div className="flex flex-wrap gap-2">
            {events.filter((e:any)=>e.event_type==="goal").map((e:any)=>(
              <span key={e.id} className="px-3 py-1 rounded-full bg-secondary text-sm">
                <span className="text-accent font-display mr-1">{e.minute}'</span>{e.players?.name ?? "—"}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Lineups */}
      <section className="mt-10 grid md:grid-cols-2 gap-4">
        <Lineup title="West Ham" players={(match.lineup_west_ham as any[]) ?? []} accent />
        <Lineup title={match.opponent} players={(match.lineup_opponent as any[]) ?? []} />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl uppercase mb-4">Match events</h2>
        <Card className="stadium-card p-6 border-0">
          {(!events || events.length === 0) && <p className="text-muted-foreground">No events recorded yet.</p>}
          <ul className="space-y-2">
            {events?.map((e:any) => (
              <li key={e.id} className="flex gap-4 items-center border-b border-border pb-2 last:border-0">
                <span className="font-display w-12 text-accent">{e.minute}'</span>
                <Badge variant="secondary" className="uppercase text-[10px] flex items-center gap-1">
                  {e.event_type==="goal" && <Goal className="h-3 w-3"/>}
                  {(e.event_type==="yellow"||e.event_type==="red") && <Square className="h-3 w-3" style={{color: e.event_type==="red"?"oklch(0.6 0.22 25)":"oklch(0.85 0.18 95)"}}/>}
                  {e.event_type}
                </Badge>
                <span className="text-sm">{e.players?.name ?? ""} {e.description ? `— ${e.description}` : ""}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}

function Lineup({ title, players, accent }: { title: string; players: any[]; accent?: boolean }) {
  return (
    <Card className="stadium-card p-6 border-0">
      <h3 className={`font-display uppercase mb-3 flex items-center gap-2 ${accent?"text-accent":""}`}><Trophy className="h-4 w-4"/>{title} XI</h3>
      {players.length === 0 ? (
        <p className="text-muted-foreground text-sm">Lineup not announced yet.</p>
      ) : (
        <ol className="space-y-1">
          {players.map((p, i) => (
            <li key={i} className="flex items-center gap-3 py-1 border-b border-border last:border-0 text-sm">
              {p.number && <span className="font-display w-7 text-muted-foreground">{p.number}</span>}
              <span className="flex-1">{p.name}</span>
              {p.position && <span className="text-xs text-muted-foreground uppercase">{p.position}</span>}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
