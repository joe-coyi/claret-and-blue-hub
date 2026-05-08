import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Brain } from "lucide-react";

export const Route = createFileRoute("/quizzes")({
  head: () => ({ meta:[{title:"Trivia — Claret & Co."},{name:"description",content:"Test your West Ham knowledge."}]}),
  component: Quizzes,
});

function Quizzes() {
  const { data: quizzes } = useQuery({
    queryKey: ["quizzes"],
    queryFn: async () => (await supabase.from("quizzes").select("*, quiz_questions(count)").order("created_at")).data ?? [],
  });
  return (
    <div className="container mx-auto px-4 py-12">
      <p className="text-xs uppercase tracking-widest text-accent">Trivia</p>
      <h1 className="font-display text-4xl md:text-6xl uppercase">Prove you bleed claret</h1>
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {quizzes?.map((q:any) => (
          <Link key={q.id} to="/quizzes/$id" params={{ id: q.id }}>
            <Card className="stadium-card p-6 border-0 hover:border-accent transition-colors h-full">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-[var(--gradient-claret)] grid place-items-center"><Brain className="h-5 w-5"/></div>
                <div className="flex-1">
                  <h3 className="font-display text-xl">{q.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{q.description}</p>
                  <div className="mt-3 flex gap-3 text-xs uppercase tracking-widest text-muted-foreground">
                    <span>{q.difficulty}</span>·<span>{q.quiz_questions?.[0]?.count ?? 0} questions</span>·<span>+{q.points_reward} pts</span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
