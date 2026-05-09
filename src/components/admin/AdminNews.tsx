import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export function AdminNews() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-news"],
    queryFn: async () => (await supabase.from("news").select("*").order("published_at", { ascending:false })).data ?? [],
  });
  const { data: polls } = useQuery({
    queryKey: ["admin-news-polls"],
    queryFn: async () => (await supabase.from("polls").select("id,question").order("created_at",{ascending:false})).data ?? [],
  });

  const [f, setF] = useState({ title:"", excerpt:"", body:"", image_url:"", category:"general", author:"", published:true, poll_id:"" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const slug = slugify(f.title) + "-" + Math.random().toString(36).slice(2,6);
    const { poll_id, ...rest } = f;
    const { error } = await supabase.from("news").insert({ ...rest, slug, poll_id: poll_id || null } as any);
    if (error) toast.error(error.message); else { toast.success("Article published"); setF({ title:"", excerpt:"", body:"", image_url:"", category:"general", author:"", published:true, poll_id:"" }); qc.invalidateQueries({queryKey:["admin-news"]}); }
  }

  return (
    <div className="space-y-6 mt-6">
      <Card className="stadium-card p-6 border-0">
        <h3 className="font-display text-xl uppercase mb-4">Write article</h3>
        <form onSubmit={add} className="grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2"><Label>Title</Label><Input required value={f.title} onChange={e=>setF({...f, title:e.target.value})}/></div>
          <div><Label>Category</Label>
            <select value={f.category} onChange={e=>setF({...f, category:e.target.value})} className="w-full bg-input border border-border rounded-md px-2 py-2 text-sm">
              <option value="general">General</option><option value="transfer">Transfer</option><option value="match">Match</option><option value="opinion">Opinion</option><option value="injury">Injury</option><option value="academy">Academy</option>
            </select>
          </div>
          <div><Label>Author</Label><Input value={f.author} onChange={e=>setF({...f, author:e.target.value})}/></div>
          <div className="md:col-span-2"><Label>Image URL</Label><Input value={f.image_url} onChange={e=>setF({...f, image_url:e.target.value})} placeholder="https://..."/></div>
          <div className="md:col-span-2"><Label>Excerpt</Label><Textarea value={f.excerpt} onChange={e=>setF({...f, excerpt:e.target.value})} rows={2}/></div>
          <div className="md:col-span-2"><Label>Body</Label><Textarea required value={f.body} onChange={e=>setF({...f, body:e.target.value})} rows={8}/></div>
          <div className="md:col-span-2"><Label>Embed poll (optional)</Label>
            <select value={f.poll_id} onChange={e=>setF({...f, poll_id:e.target.value})} className="w-full bg-input border border-border rounded-md px-2 py-2 text-sm">
              <option value="">— None —</option>
              {polls?.map(p => <option key={p.id} value={p.id}>{p.question}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.published} onChange={e=>setF({...f, published:e.target.checked})}/>Published</label>
            <Button className="bg-[var(--gradient-claret)] ml-auto">Publish</Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {data?.map(n => (
          <Card key={n.id} className="stadium-card p-4 border-0 flex items-center gap-3">
            <div className="flex-1">
              <div className="font-display">{n.title}</div>
              <div className="text-xs text-muted-foreground">{n.category} · {new Date(n.published_at).toLocaleString()} · {n.published?"published":"draft"}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={async()=>{ await supabase.from("news").delete().eq("id", n.id); qc.invalidateQueries({queryKey:["admin-news"]}); }}><Trash2 className="h-4 w-4 text-destructive"/></Button>
          </Card>
        ))}
      </div>
    </div>
  );
}