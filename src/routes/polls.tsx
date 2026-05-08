import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/polls")({
  head: () => ({ meta:[{title:"Fan Polls — Claret & Co."},{name:"description",content:"Vote in fan polls and predict matches."}]}),
  component: Polls,
});

function Polls() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: polls } = useQuery({
    queryKey: ["polls"],
    queryFn: async () => (await supabase.from("polls").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: votes } = useQuery({
    queryKey: ["poll-votes"],
    queryFn: async () => (await supabase.from("poll_votes").select("*")).data ?? [],
  });
  const { data: myVotes } = useQuery({
    queryKey: ["my-votes", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("poll_votes").select("*").eq("user_id", user!.id)).data ?? [],
  });

  const vote = useMutation({
    mutationFn: async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
      if (!user) throw new Error("Sign in to vote");
      const { error } = await supabase.from("poll_votes").insert({ poll_id: pollId, user_id: user.id, option_id: optionId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vote cast! +5 points");
      qc.invalidateQueries({ queryKey: ["poll-votes"] });
      qc.invalidateQueries({ queryKey: ["my-votes"] });
    },
    onError: (e:any) => toast.error(e.message),
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <p className="text-xs uppercase tracking-widest text-accent">Fan Polls</p>
      <h1 className="font-display text-4xl md:text-6xl uppercase">Have your say</h1>
      {!user && (
        <p className="mt-4 text-muted-foreground">
          <Link to="/auth" className="text-accent underline">Sign in</Link> to cast your vote.
        </p>
      )}
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {polls?.map(p => {
          const pollVotes = votes?.filter(v => v.poll_id === p.id) ?? [];
          const myVote = myVotes?.find(v => v.poll_id === p.id);
          const total = pollVotes.length;
          return (
            <Card key={p.id} className="stadium-card p-6 border-0">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{p.ends_at && new Date(p.ends_at) < new Date() ? "Closed" : "Open"}</div>
              <h3 className="font-display text-xl mt-2">{p.question}</h3>
              <div className="mt-4 space-y-2">
                {(p.options as any[]).map(opt => {
                  const count = pollVotes.filter(v => v.option_id === opt.id).length;
                  const pct = total ? Math.round((count/total)*100) : 0;
                  const voted = myVote?.option_id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      disabled={!!myVote || !user || vote.isPending}
                      onClick={() => vote.mutate({ pollId: p.id, optionId: opt.id })}
                      className="w-full text-left relative overflow-hidden rounded-md border border-border bg-secondary/40 px-4 py-3 hover:border-accent disabled:cursor-not-allowed transition-colors"
                    >
                      {myVote && <div className={`absolute inset-y-0 left-0 ${voted?"bg-[var(--gradient-claret)]":"bg-secondary"}`} style={{width:`${pct}%`}} />}
                      <div className="relative flex justify-between items-center">
                        <span className={voted?"font-semibold":""}>{opt.label}</span>
                        {myVote && <span className="text-sm tabular-nums">{pct}% · {count}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 text-xs text-muted-foreground">{total} vote{total!==1?"s":""}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
