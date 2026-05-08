import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock3, Shirt, Target, Handshake, Shield, Star } from "lucide-react";

type CareerItem = {
  season?: string;
  club?: string;
  appearances?: number;
  goals?: number;
  assists?: number;
};

export const Route = createFileRoute("/players/$id")({
  head: () => ({
    meta: [
      { title: "Player Profile — Claret & Co." },
      { name: "description", content: "West Ham player profile, stats and recent match information." },
    ],
  }),
  component: PlayerPage,
});

function PlayerPage() {
  const { id } = Route.useParams();

  const { data: player } = useQuery({
    queryKey: ["player", id],
    queryFn: async () => (await supabase.from("players").select("*").eq("id", id).maybeSingle()).data,
  });

  const { data: recentMatches } = useQuery({
    queryKey: ["player-recent-matches", id],
    queryFn: async () => {
      const { data: events } = await supabase
        .from("match_events")
        .select("minute, event_type, description, match_id")
        .eq("player_id", id)
        .order("created_at", { ascending: false })
        .limit(8);

      const matchIds = [...new Set((events ?? []).map((event) => event.match_id))];
      if (matchIds.length === 0) {
        return [];
      }

      const { data: matches } = await supabase
        .from("matches")
        .select("id, opponent, competition, kickoff, status, west_ham_score, opponent_score, is_home")
        .in("id", matchIds);

      return matchIds
        .map((matchId) => {
          const match = (matches ?? []).find((item) => item.id === matchId);
          const eventList = (events ?? []).filter((event) => event.match_id === matchId);
          return match ? { ...match, events: eventList } : null;
        })
        .filter(Boolean);
    },
  });

  if (!player) {
    return <div className="container mx-auto px-4 py-20">Loading...</div>;
  }

  const career = Array.isArray(player.career_stats) ? (player.career_stats as CareerItem[]) : [];
  const profile = getProfileFields(player.career_stats);

  return (
    <div className="container mx-auto px-4 py-12">
      <Link to="/players" className="text-sm text-accent hover:underline">← Back to squad</Link>

      <section className="mt-4 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="stadium-card border-0 p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[var(--gradient-claret)] font-display text-4xl text-primary-foreground">
              {player.shirt_number ?? "—"}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">{player.position}</Badge>
                <Badge className="bg-secondary text-foreground">West Ham United</Badge>
              </div>
              <h1 className="mt-4 font-display text-4xl uppercase md:text-6xl">{player.name}</h1>
              <p className="mt-4 max-w-2xl text-muted-foreground">{player.bio || "First-team Hammer profile and season snapshot."}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoTile icon={CalendarDays} label="Age" value={profile.age} />
            <InfoTile icon={CalendarDays} label="Date of birth" value={profile.dob} />
            <InfoTile icon={Handshake} label="Signed" value={profile.signed} />
            <InfoTile icon={Clock3} label="Contract" value={profile.contract} />
          </div>
        </Card>

        <Card className="stadium-card border-0 p-6">
          <h2 className="font-display text-xl uppercase">Season stats</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <StatTile icon={Shirt} label="Appearances" value={player.appearances} />
            <StatTile icon={Target} label="Goals" value={player.goals} />
            <StatTile icon={Star} label="Assists" value={player.assists} />
            <StatTile icon={Shield} label="Cards" value={player.yellow_cards + player.red_cards} />
          </div>
        </Card>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="stadium-card border-0 p-6">
          <h2 className="font-display text-2xl uppercase">Recent matches</h2>
          <div className="mt-5 space-y-3">
            {(recentMatches ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Recent player-specific match events will appear here once they are added in admin.</p>
            )}
            {recentMatches?.map((match: any) => (
              <Link key={match.id} to="/matches/$id" params={{ id: match.id }} className="block">
                <div className="rounded-md border border-border bg-secondary/30 p-4 transition-colors hover:border-accent">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">{match.competition}</p>
                      <p className="mt-1 font-display text-xl">West Ham vs {match.opponent}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{new Date(match.kickoff).toLocaleString()}</p>
                    </div>
                    <Badge variant="outline">{match.status}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {match.events.map((event: any, index: number) => (
                      <span key={`${match.id}-${index}`} className="rounded-full bg-background/70 px-3 py-1">
                        {event.minute}' {event.event_type}{event.description ? ` · ${event.description}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="stadium-card border-0 p-6">
          <h2 className="font-display text-2xl uppercase">Career & profile</h2>
          <div className="mt-5 space-y-4">
            <ProfileRow label="Position" value={player.position} />
            <ProfileRow label="Pictures" value={player.photo_url ? "Photo added" : "No photo added yet"} />
            <ProfileRow label="Yellow cards" value={String(player.yellow_cards)} />
            <ProfileRow label="Red cards" value={String(player.red_cards)} />
            <ProfileRow label="Goals" value={String(player.goals)} />
            <ProfileRow label="Assists" value={String(player.assists)} />
          </div>

          <div className="mt-8">
            <h3 className="font-display text-lg uppercase">Career timeline</h3>
            <div className="mt-4 space-y-3">
              {career.length === 0 && (
                <p className="text-sm text-muted-foreground">Add career history in the player record to show former clubs, seasons and totals.</p>
              )}
              {career.map((item, index) => (
                <div key={index} className="rounded-md border border-border bg-secondary/20 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-base">{item.club || "Club"}</span>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">{item.season || "Season"}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-muted-foreground">
                    <span>Apps: {item.appearances ?? 0}</span>
                    <span>Goals: {item.goals ?? 0}</span>
                    <span>Assists: {item.assists ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

function getProfileFields(careerStats: unknown) {
  const profile = careerStats && typeof careerStats === "object" && !Array.isArray(careerStats)
    ? (careerStats as Record<string, unknown>)
    : {};

  return {
    age: formatField(profile.age),
    dob: formatField(profile.dob ?? profile.date_of_birth),
    signed: formatField(profile.signed ?? profile.signed_on ?? profile.joined),
    contract: formatField(profile.contract ?? profile.contract_until),
  };
}

function formatField(value: unknown) {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return "—";
}

function InfoTile({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="h-4 w-4 text-accent" />
        {label}
      </div>
      <div className="mt-3 font-display text-2xl uppercase">{value}</div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="h-4 w-4 text-accent" />
        {label}
      </div>
      <div className="mt-3 font-display text-3xl">{value}</div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
