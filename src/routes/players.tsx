import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/players")({
  head: () => ({ meta:[{ title:"The Squad — Claret & Co." },{name:"description",content:"West Ham player profiles, season stats and career history."}]}),
  component: Players,
});

function Players() {
  const { data: players } = useQuery({
    queryKey: ["players"],
    queryFn: async () => (await supabase.from("players").select("*").order("shirt_number")).data ?? [],
  });

  const grouped = (players ?? []).reduce((acc: any, p: any) => {
    (acc[p.position] ||= []).push(p); return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-12">
      <p className="text-xs uppercase tracking-widest text-accent">The Squad</p>
      <h1 className="font-display text-4xl md:text-6xl uppercase">Meet the Hammers</h1>

      {Object.entries(grouped).map(([pos, list]: any) => (
        <section key={pos} className="mt-10">
          <h2 className="font-display uppercase text-xl mb-4 text-muted-foreground">{pos}s</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((p:any) => (
              <Card key={p.id} className="stadium-card p-6 border-0">
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
