import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="container mx-auto px-4 py-12">
      <Link to="/matches" className="text-sm text-accent hover:underline">← All matches</Link>
      <div className="mt-4 stadium-card p-10">
        <div className="flex justify-between items-center text-xs uppercase tracking-widest text-muted-foreground">
          <span>{match.competition} · {match.is_home?"Home":"Away"}</span>
          <Badge variant="outline">{match.status}</Badge>
        </div>
        <div className="mt-6 grid grid-cols-3 items-center gap-4">
          <div className="text-center"><div className="font-display text-2xl uppercase">{match.is_home?"West Ham":match.opponent}</div></div>
          <div className="text-center font-display text-6xl">
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
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl uppercase mb-4">Match events</h2>
        <Card className="stadium-card p-6 border-0">
          {(!events || events.length === 0) && <p className="text-muted-foreground">No events recorded yet.</p>}
          <ul className="space-y-2">
            {events?.map((e:any) => (
              <li key={e.id} className="flex gap-4 items-center border-b border-border pb-2 last:border-0">
                <span className="font-display w-12 text-accent">{e.minute}'</span>
                <Badge variant="secondary" className="uppercase text-[10px]">{e.event_type}</Badge>
                <span className="text-sm">{e.players?.name ?? ""} {e.description ? `— ${e.description}` : ""}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
