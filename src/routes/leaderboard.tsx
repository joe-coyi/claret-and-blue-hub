import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta:[{title:"Leaderboard — Claret & Co."}]}),
  component: Leaderboard,
});

function Leaderboard() {
  const { data } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("points", { ascending: false }).limit(50)).data ?? [],
  });
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <p className="text-xs uppercase tracking-widest text-accent">Leaderboard</p>
      <h1 className="font-display text-4xl md:text-6xl uppercase">The loudest in the East End</h1>
      <Card className="stadium-card border-0 p-2 mt-8">
        {data?.length === 0 && <p className="p-6 text-muted-foreground">No fans yet — be the first!</p>}
        {data?.map((p, i) => (
          <div key={p.id} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
            <div className={`font-display text-2xl w-10 text-center ${i<3?"text-accent":""}`}>{i+1}</div>
            {i===0 && <Trophy className="h-5 w-5 text-accent" />}
            <div className="flex-1">
              <div className="font-medium">{p.display_name}</div>
              {p.bio && <div className="text-xs text-muted-foreground">{p.bio}</div>}
            </div>
            <div className="font-display text-xl tabular-nums">{p.points}<span className="text-xs ml-1 text-muted-foreground uppercase">pts</span></div>
          </div>
        ))}
      </Card>
    </div>
  );
}
