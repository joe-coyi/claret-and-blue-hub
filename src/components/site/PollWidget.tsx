import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

export function PollWidget({ pollId }: { pollId: string }) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: p } = useQuery({
    queryKey: ["poll", pollId],
    queryFn: async () => (await supabase.from("polls").select("*").eq("id", pollId).maybeSingle()).data,
  });
  const { data: votes } = useQuery({
    queryKey: ["poll-votes", pollId],
    queryFn: async () => (await supabase.from("poll_votes").select("*").eq("poll_id", pollId)).data ?? [],
  });
  const { data: myVotes } = useQuery({
    queryKey: ["my-votes", pollId, user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("poll_votes").select("*").eq("poll_id", pollId).eq("user_id", user!.id)).data ?? [],
  });

  const vote = useMutation({
    mutationFn: async (optionIds: string[]) => {
      if (!user) throw new Error("Sign in to vote");
      const rows = optionIds.map(option_id => ({ poll_id: pollId, user_id: user.id, option_id }));
      const { error } = await supabase.from("poll_votes").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vote cast! +5 points");
      qc.invalidateQueries({ queryKey: ["poll-votes", pollId] });
      qc.invalidateQueries({ queryKey: ["my-votes", pollId] });
    },
    onError: (e:any) => toast.error(e.message),
  });

  const [picks, setPicks] = useState<string[]>([]);
  if (!p) return null;

  const isLineup = p.poll_type === "lineup";
  const maxSel = p.max_selections ?? 1;
  const closed = p.ends_at && new Date(p.ends_at) < new Date();
  const myPollVotes = myVotes ?? [];
  const hasVoted = myPollVotes.length > 0;
  const pollVotes = votes ?? [];
  const totalBallots = isLineup
    ? new Set(pollVotes.map((v:any)=>v.user_id)).size
    : pollVotes.length;

  function toggle(id: string) {
    if (hasVoted || closed) return;
    setPicks(prev => {
      if (prev.includes(id)) return prev.filter(x=>x!==id);
      if (!isLineup) return [id];
      if (prev.length >= maxSel) return prev;
      return [...prev, id];
    });
  }

  function submit() {
    if (!user || picks.length === 0) return;
    if (isLineup && picks.length !== maxSel) return;
    vote.mutate(picks);
  }

  return (
    <Card className="stadium-card p-6 border-0 not-prose">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <span>{closed ? "Closed" : "Open"}</span>
        {isLineup && <span className="text-accent">· Lineup picker · choose {maxSel}</span>}
      </div>
      <h3 className="font-display text-xl mt-2">{p.question}</h3>
      {!user && <p className="text-sm text-muted-foreground mt-2"><Link to="/auth" className="text-accent underline">Sign in</Link> to vote.</p>}
      <div className={`mt-4 ${isLineup ? "grid grid-cols-2 gap-2" : "space-y-2"}`}>
        {(p.options as any[]).map(opt => {
          const count = pollVotes.filter((v:any) => v.option_id === opt.id).length;
          const pct = totalBallots ? Math.round((count/totalBallots)*100) : 0;
          const myPick = myPollVotes.some((v:any)=>v.option_id===opt.id);
          const previewPick = picks.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              disabled={hasVoted || !user || vote.isPending || !!closed}
              onClick={() => toggle(opt.id)}
              className={`w-full text-left relative overflow-hidden rounded-md border px-4 py-3 transition-colors disabled:cursor-not-allowed
                ${myPick || previewPick ? "border-accent" : "border-border"}
                ${!hasVoted ? "hover:border-accent bg-secondary/40" : "bg-secondary/20"}`}
            >
              {hasVoted && (
                <div className="absolute inset-y-0 left-0 transition-all" style={{ width: `${pct}%`, background: myPick ? "var(--gradient-claret)" : "color-mix(in oklab, var(--accent) 25%, transparent)" }}/>
              )}
              <div className="relative flex justify-between items-center gap-3">
                <span className={myPick ? "font-semibold" : ""}>{opt.label}</span>
                {hasVoted ? (
                  <span className="text-sm tabular-nums whitespace-nowrap">{pct}% · {count}</span>
                ) : previewPick ? (
                  <span className="text-xs uppercase text-accent">Selected</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{totalBallots} {isLineup?"ballot":"vote"}{totalBallots!==1?"s":""}</span>
        {!hasVoted && !closed && user && (
          <button
            disabled={vote.isPending || (isLineup ? picks.length !== maxSel : picks.length === 0)}
            onClick={submit}
            className="px-4 py-2 rounded-md bg-[var(--gradient-claret)] text-primary-foreground text-sm font-medium uppercase tracking-wide disabled:opacity-50"
          >
            {isLineup ? `Submit lineup (${picks.length}/${maxSel})` : "Cast vote"}
          </button>
        )}
      </div>
    </Card>
  );
}