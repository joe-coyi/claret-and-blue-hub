import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function AdminMatches() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey:["admin-matches"],
    queryFn: async () => (await supabase.from("matches").select("*, players(name)").order("kickoff",{ascending:false})).data ?? [],
  });
  const { data: players } = useQuery({ queryKey:["players-min"], queryFn: async () => (await supabase.from("players").select("id,name")).data ?? [] });

  const [form, setForm] = useState({ opponent:"", competition:"Premier League", kickoff:"", is_home:true, venue:"London Stadium" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("matches").insert({ ...form, kickoff: new Date(form.kickoff).toISOString() });
    if (error) toast.error(error.message); else { toast.success("Match added"); qc.invalidateQueries({queryKey:["admin-matches"]}); }
  }
  async function update(id: string, patch: any) {
    const { error } = await supabase.from("matches").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { qc.invalidateQueries({queryKey:["admin-matches"]}); }
  }
  async function remove(id: string) {
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) toast.error(error.message); else { qc.invalidateQueries({queryKey:["admin-matches"]}); }
  }

  return (
    <div className="space-y-6 mt-6">
      <Card className="stadium-card p-6 border-0">
        <h3 className="font-display text-xl uppercase mb-4">Add match</h3>
        <form onSubmit={add} className="grid md:grid-cols-5 gap-3">
          <div><Label>Opponent</Label><Input required value={form.opponent} onChange={e=>setForm({...form, opponent:e.target.value})}/></div>
          <div><Label>Competition</Label><Input value={form.competition} onChange={e=>setForm({...form, competition:e.target.value})}/></div>
          <div><Label>Kickoff</Label><Input required type="datetime-local" value={form.kickoff} onChange={e=>setForm({...form, kickoff:e.target.value})}/></div>
          <div><Label>Venue</Label><Input value={form.venue} onChange={e=>setForm({...form, venue:e.target.value})}/></div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_home} onChange={e=>setForm({...form, is_home:e.target.checked})}/>Home</label>
            <Button className="bg-[var(--gradient-claret)]">Add</Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {data?.map(m => (
          <Card key={m.id} className="stadium-card p-4 border-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="font-display">{m.is_home?"West Ham vs ":""}{m.opponent}{!m.is_home?" (A)":""}</div>
                <div className="text-xs text-muted-foreground">{new Date(m.kickoff).toLocaleString()} · {m.competition}</div>
              </div>
              <select value={m.status} onChange={e=>update(m.id, {status:e.target.value})}
                className="bg-input border border-border rounded-md px-2 py-1 text-sm">
                <option value="scheduled">Scheduled</option><option value="live">Live</option><option value="finished">Finished</option>
              </select>
              <Input type="number" className="w-20" placeholder="WH" defaultValue={m.west_ham_score ?? ""} onBlur={e=>update(m.id,{west_ham_score: e.target.value===""?null:Number(e.target.value)})}/>
              <Input type="number" className="w-20" placeholder="OPP" defaultValue={m.opponent_score ?? ""} onBlur={e=>update(m.id,{opponent_score: e.target.value===""?null:Number(e.target.value)})}/>
              <select value={m.motm_player_id ?? ""} onChange={e=>update(m.id,{motm_player_id: e.target.value || null})}
                className="bg-input border border-border rounded-md px-2 py-1 text-sm">
                <option value="">MOTM…</option>
                {players?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Button variant="ghost" size="icon" onClick={()=>remove(m.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
