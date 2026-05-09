import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Trophy, Users, Vote, Brain, Sparkles, Activity } from "lucide-react";
import { LiveBanner } from "./matches";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Claret & Co. — The West Ham Fan Hub" },
      { name: "description", content: "Live matchday stats, polls, quizzes and the home of every Hammers supporter." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: matches } = useQuery({
    queryKey: ["home-matches"],
    queryFn: async () => {
      const { data } = await supabase.from("matches").select("*").order("kickoff", { ascending: true }).limit(20);
      return data ?? [];
    },
  });
  const upcoming = (matches ?? []).filter(m => m.status !== "finished").slice(0, 3);
  const recent = (matches ?? []).filter(m => m.status === "finished").slice(-2);
  const live = (matches ?? []).filter(m => m.status === "live");

  return (
    <div>
      {live.length > 0 && (
        <div className="container mx-auto px-4 pt-6">
          {live.map(m => <LiveBanner key={m.id} m={m} />)}
        </div>
      )}
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-50"
          style={{ background: "var(--gradient-pitch)" }}
        />
        <div className="container mx-auto px-4 pt-20 pb-24 lg:pt-32 lg:pb-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground mb-6">
              <Sparkles className="h-3 w-3 text-accent" /> The home of the Irons
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] uppercase">
              Forever <span className="text-gradient-claret">Blowing</span><br/>
              Bubbles.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Live matchday stats, fantasy predictions, fan polls, trivia and a leaderboard
              that crowns the loudest voice in the East End. Built by fans, for fans.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-[var(--gradient-claret)] hover:opacity-90 claret-glow">
                <Link to="/auth">Join the family <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/matches">Today&apos;s matchday</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK STATS / FEATURES */}
      <section className="container mx-auto px-4 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Activity, label: "Live matchday", to: "/matches" },
            { icon: Users, label: "Squad & stats", to: "/players" },
            { icon: Vote, label: "Fan polls", to: "/polls" },
            { icon: Brain, label: "Trivia quizzes", to: "/quizzes" },
          ].map(f => (
            <Link key={f.label} to={f.to} className="stadium-card p-4 hover:border-accent transition-colors group">
              <f.icon className="h-5 w-5 text-accent mb-2" />
              <div className="font-display uppercase tracking-wide text-sm">{f.label}</div>
              <div className="text-xs text-muted-foreground mt-1 group-hover:text-foreground">Open →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* UPCOMING FIXTURES */}
      <section className="container mx-auto px-4 mt-20">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent">Fixtures</p>
            <h2 className="font-display text-3xl md:text-4xl uppercase">Next up at the London Stadium</h2>
          </div>
          <Button asChild variant="ghost"><Link to="/matches">All fixtures →</Link></Button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {upcoming.map(m => (
            <Link key={m.id} to="/matches/$id" params={{ id: m.id }} className="block h-full">
            <Card className="stadium-card p-6 border-0 h-full hover:border-accent transition-colors">
              <div className="text-xs uppercase text-muted-foreground tracking-widest">{m.competition} · {m.is_home ? "Home" : "Away"}</div>
              <div className="mt-3 font-display text-2xl">West Ham vs {m.opponent}</div>
              <div className="mt-1 text-sm text-muted-foreground">{new Date(m.kickoff).toLocaleString(undefined,{ weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit"})}</div>
              <div className="mt-4 text-xs text-muted-foreground">{m.venue}</div>
            </Card>
            </Link>
          ))}
          {upcoming.length === 0 && <p className="text-muted-foreground">No upcoming fixtures.</p>}
        </div>
      </section>

      {/* RECENT RESULTS */}
      <section className="container mx-auto px-4 mt-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent">Results</p>
            <h2 className="font-display text-3xl md:text-4xl uppercase">From the terraces</h2>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {recent.map(m => {
            const won = (m.west_ham_score ?? 0) > (m.opponent_score ?? 0);
            const draw = m.west_ham_score === m.opponent_score;
            return (
              <Link key={m.id} to="/matches/$id" params={{ id: m.id }} className="block">
              <Card className="stadium-card p-6 border-0 flex items-center justify-between hover:border-accent transition-colors">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{m.competition}</div>
                  <div className="font-display text-xl mt-2">{m.is_home ? "West Ham" : m.opponent}<span className="mx-2 text-muted-foreground">vs</span>{m.is_home ? m.opponent : "West Ham"}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-4xl">{m.is_home ? m.west_ham_score : m.opponent_score} - {m.is_home ? m.opponent_score : m.west_ham_score}</div>
                  <div className={`text-xs uppercase tracking-widest mt-1 ${won?"text-accent":draw?"text-muted-foreground":"text-destructive"}`}>{won?"Win":draw?"Draw":"Loss"}</div>
                </div>
              </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* GAMIFICATION CTA */}
      <section className="container mx-auto px-4 mt-20">
        <div className="stadium-card p-10 md:p-14 relative overflow-hidden">
          <Trophy className="absolute -right-8 -top-8 h-48 w-48 text-primary/10" />
          <p className="text-xs uppercase tracking-widest text-accent">Gamified fandom</p>
          <h3 className="font-display text-3xl md:text-5xl uppercase mt-2 max-w-2xl">Predict. Vote. Earn your stripes.</h3>
          <p className="mt-4 text-muted-foreground max-w-xl">Every poll, quiz and prediction earns you points. Climb the leaderboard, unlock badges, and prove you bleed claret &amp; sky.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-[var(--gradient-claret)] hover:opacity-90"><Link to="/leaderboard">View leaderboard</Link></Button>
            <Button asChild variant="outline"><Link to="/quizzes">Take a quiz</Link></Button>
          </div>
        </div>
      </section>
    </div>
  );
}
