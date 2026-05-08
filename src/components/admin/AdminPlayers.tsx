import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function AdminPlayers() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey:["admin-players"], queryFn: async () => (await supabase.from("players").select("*").order("shirt_number")).data ?? []});
  const [f, setF] = useState({ name:"", position:"Forward", shirt_number:0, bio:"" });

  async function add(e:React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("players").insert(f);
    if (error) toast.error(error.message); else { toast.success("Added"); qc.invalidateQueries({queryKey:["admin-players"]}); }
  }
  async function update(id:string, patch:any) {
    const { error } = await supabase.from("players").update(patch).eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({queryKey:["admin-players"]});
  }
  async function remove(id:string) {
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({queryKey:["admin-players"]});
  }

  return (
    <div className="space-y-6 mt-6">
      <Card className="stadium-card p-6 border-0">
        <h3 className="font-display text-xl uppercase mb-4">Add player</h3>
        <form onSubmit={add} className="grid md:grid-cols-5 gap-3">
          <div><Label>Name</Label><Input required value={f.name} onChange={e=>setF({...f, name:e.target.value})}/></div>
          <div><Label>Position</Label>
            <select value={f.position} onChange={e=>setF({...f, position:e.target.value})} className="w-full bg-input border border-border rounded-md px-2 py-2 text-sm">
              <option>Goalkeeper</option><option>Defender</option><option>Midfielder</option><option>Forward</option>
            </select>
          </div>
          <div><Label>Shirt #</Label><Input type="number" value={f.shirt_number} onChange={e=>setF({...f, shirt_number:Number(e.target.value)})}/></div>
          <div className="md:col-span-2"><Label>Bio</Label><Input value={f.bio} onChange={e=>setF({...f, bio:e.target.value})}/></div>
          <div><Button className="bg-[var(--gradient-claret)]">Add</Button></div>
        </form>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        {data?.map(p => (
          <Card key={p.id} className="stadium-card p-4 border-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-display text-lg">#{p.shirt_number} {p.name}</div>
              <Button variant="ghost" size="icon" onClick={()=>remove(p.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <Input type="number" defaultValue={p.appearances} onBlur={e=>update(p.id,{appearances:Number(e.target.value)})} title="Apps"/>
              <Input type="number" defaultValue={p.goals} onBlur={e=>update(p.id,{goals:Number(e.target.value)})} title="Goals"/>
              <Input type="number" defaultValue={p.assists} onBlur={e=>update(p.id,{assists:Number(e.target.value)})} title="Assists"/>
              <Input type="number" defaultValue={p.yellow_cards} onBlur={e=>update(p.id,{yellow_cards:Number(e.target.value)})} title="Yellow"/>
              <Input type="number" defaultValue={p.red_cards} onBlur={e=>update(p.id,{red_cards:Number(e.target.value)})} title="Red"/>
            </div>
            <Textarea defaultValue={p.bio ?? ""} onBlur={e=>update(p.id,{bio:e.target.value})} placeholder="Bio"/>
          </Card>
        ))}
      </div>
    </div>
  );
}
