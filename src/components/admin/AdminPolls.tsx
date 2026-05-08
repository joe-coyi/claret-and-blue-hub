import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function AdminPolls() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey:["admin-polls"], queryFn: async () => (await supabase.from("polls").select("*, poll_votes(count)").order("created_at",{ascending:false})).data ?? [] });
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState("Option A, Option B, Option C");
  const [endsAt, setEndsAt] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const options = opts.split(",").map(s => s.trim()).filter(Boolean).map((label,i)=>({id:`opt${i}`, label}));
    if (options.length < 2) return toast.error("Add at least 2 options");
    const { error } = await supabase.from("polls").insert({ question:q, options, ends_at: endsAt ? new Date(endsAt).toISOString() : null });
    if (error) toast.error(error.message); else { toast.success("Poll created"); setQ(""); qc.invalidateQueries({queryKey:["admin-polls"]}); }
  }

  async function exportCsv(pollId: string) {
    const { data: votes } = await supabase.from("poll_votes").select("option_id, created_at, user_id").eq("poll_id", pollId);
    const csv = "option_id,user_id,created_at\n" + (votes ?? []).map(v=>`${v.option_id},${v.user_id},${v.created_at}`).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `poll-${pollId}.csv`; a.click();
  }

  return (
    <div className="space-y-6 mt-6">
      <Card className="stadium-card p-6 border-0">
        <h3 className="font-display text-xl uppercase mb-4">Create poll</h3>
        <form onSubmit={add} className="space-y-3">
          <div><Label>Question</Label><Input required value={q} onChange={e=>setQ(e.target.value)}/></div>
          <div><Label>Options (comma separated)</Label><Input value={opts} onChange={e=>setOpts(e.target.value)}/></div>
          <div><Label>Ends at (optional)</Label><Input type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)}/></div>
          <Button className="bg-[var(--gradient-claret)]">Create poll</Button>
        </form>
      </Card>

      <div className="space-y-3">
        {data?.map((p:any) => (
          <Card key={p.id} className="stadium-card p-4 border-0 flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="font-display">{p.question}</div>
              <div className="text-xs text-muted-foreground">{p.poll_votes?.[0]?.count ?? 0} votes · ends {p.ends_at ? new Date(p.ends_at).toLocaleString():"never"}</div>
            </div>
            <Button variant="outline" size="sm" onClick={()=>exportCsv(p.id)}>Export CSV</Button>
            <Button variant="ghost" size="icon" onClick={async ()=>{ await supabase.from("polls").delete().eq("id",p.id); qc.invalidateQueries({queryKey:["admin-polls"]}); }}><Trash2 className="h-4 w-4 text-destructive"/></Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
