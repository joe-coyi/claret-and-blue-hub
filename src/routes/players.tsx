import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/players")({
  head: () => ({ meta:[{ title:"The Squad — Claret & Co." },{name:"description",content:"West Ham player profiles, season stats and career history."}]}),
  component: Players,
});

function Players() {
  const location = useLocation();

  if (location.pathname !== "/players") {
    return <Outlet />;
  }

  const { data: players } = useQuery({
    queryKey: ["players"],
    queryFn: async () => (await supabase.from("players").select("*").order("shirt_number")).data ?? [],
  });

  const grouped = (players ?? []).reduce((acc: any, p: any) => {
    (acc[p.position] ||= []).push(p); return acc;
  }, {});
  const order = ["Goalkeeper", "Defender", "Midfielder", "Forward"];
  const labels: Record<string, string> = {
    Goalkeeper: "Goalkeepers",
    Defender: "Defenders",
    Midfielder: "Midfielders",
    Forward: "Attackers",
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <p className="text-xs uppercase tracking-widest text-accent">The Squad</p>
      <h1 className="font-display text-4xl md:text-6xl uppercase">Meet the Hammers</h1>

      {order.filter((pos) => grouped[pos]?.length).map((pos) => (
        <section key={pos} className="mt-10">
          <h2 className="font-display uppercase text-xl mb-4 text-muted-foreground">{labels[pos]}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {grouped[pos].map((p:any) => (
              <Link key={p.id} to="/players/$id" params={{ id: p.id }} className="block h-full">
              <Card className="stadium-card h-full p-6 border-0 hover:border-accent transition-colors">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-[var(--gradient-claret)] grid place-items-center font-display text-2xl">
                    {p.shirt_number}
                  </div>
                  <div className="flex-1">
                    <div className="font-display text-xl">{p.name}</div>
                    <div className="text-xs uppercase text-muted-foreground tracking-widest">{p.position}</div>
                  </div>
                </div>
                {p.bio && <p className="mt-4 text-sm text-muted-foreground">{p.bio}</p>}
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <Stat label="Apps" v={p.appearances} />
                  <Stat label="Goals" v={p.goals} />
                  <Stat label="Asts" v={p.assists} />
                  <Stat label="Cards" v={p.yellow_cards + p.red_cards} />
                </div>
              </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="bg-secondary/50 rounded-md p-2">
      <div className="font-display text-xl">{v}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
