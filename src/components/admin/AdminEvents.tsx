import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function AdminEvents() {
  const qc = useQueryClient();
  const { data: matches } = useQuery({ queryKey:["matches-min"], queryFn: async () => (await supabase.from("matches").select("id,opponent,kickoff,status").order("kickoff",{ascending:false})).data ?? [] });
  const [matchId, setMatchId] = useState<string>("");
  const { data: players } = useQuery({ queryKey:["players-min"], queryFn: async () => (await supabase.from("players").select("id,name")).data ?? [] });
  const { data: events } = useQuery({
    queryKey:["events-admin", matchId],
    enabled: !!matchId,
    queryFn: async () => (await supabase.from("match_events").select("*, players(name)").eq("match_id", matchId).order("minute")).data ?? [],
  });
  const [f, setF] = useState({ minute:0, event_type:"goal", player_id:"", description:"" });

  async function add(e:React.FormEvent) {
    e.preventDefault();
    if (!matchId) return toast.error("Pick a match");
    const { error } = await supabase.from("match_events").insert({ match_id: matchId, ...f, player_id: f.player_id || null });
    if (error) toast.error(error.message); else { toast.success("Event added"); qc.invalidateQueries({queryKey:["events-admin"]}); }
  }

  return (
    <div className="space-y-6 mt-6">
      <Card className="stadium-card p-6 border-0">
        <Label>Match</Label>
        <select value={matchId} onChange={e=>setMatchId(e.target.value)} className="w-full bg-input border border-border rounded-md px-2 py-2 text-sm mt-1">
          <option value="">Choose a match…</option>
          {matches?.map(m => <option key={m.id} value={m.id}>{m.opponent} · {new Date(m.kickoff).toLocaleDateString()} · {m.status}</option>)}
        </select>
      </Card>

      {matchId && (
        <>
          <Card className="stadium-card p-6 border-0">
            <h3 className="font-display text-xl uppercase mb-4">Add live event</h3>
            <form onSubmit={add} className="grid md:grid-cols-5 gap-3">
              <div><Label>Minute</Label><Input type="number" value={f.minute} onChange={e=>setF({...f, minute:Number(e.target.value)})}/></div>
              <div><Label>Type</Label>
                <select value={f.event_type} onChange={e=>setF({...f, event_type:e.target.value})} className="w-full bg-input border border-border rounded-md px-2 py-2 text-sm">
                  <option>goal</option><option>assist</option><option>yellow</option><option>red</option><option>sub_in</option><option>sub_out</option>
                </select>
              </div>
              <div><Label>Player</Label>
                <select value={f.player_id} onChange={e=>setF({...f, player_id:e.target.value})} className="w-full bg-input border border-border rounded-md px-2 py-2 text-sm">
                  <option value="">—</option>
                  {players?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-1"><Label>Note</Label><Input value={f.description} onChange={e=>setF({...f, description:e.target.value})}/></div>
              <div><Button className="bg-[var(--gradient-claret)] w-full">Add</Button></div>
            </form>
          </Card>

          <Card className="stadium-card p-6 border-0">
            <h3 className="font-display text-lg uppercase mb-4">Events</h3>
            <ul className="space-y-2">
              {events?.map((e:any) => (
                <li key={e.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <span className="font-display w-12 text-accent">{e.minute}'</span>
                  <span className="text-xs uppercase">{e.event_type}</span>
                  <span className="flex-1">{e.players?.name} {e.description && `— ${e.description}`}</span>
                  <Button size="icon" variant="ghost" onClick={async()=>{ await supabase.from("match_events").delete().eq("id",e.id); qc.invalidateQueries({queryKey:["events-admin"]}); }}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                </li>
              ))}
              {events?.length===0 && <li className="text-muted-foreground text-sm">No events yet.</li>}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
