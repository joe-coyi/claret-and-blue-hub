import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/quizzes/$id")({
  component: QuizPlay,
});

function QuizPlay() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: quiz } = useQuery({
    queryKey: ["quiz", id],
    queryFn: async () => (await supabase.from("quizzes").select("*").eq("id", id).maybeSingle()).data,
  });
  const { data: questions } = useQuery({
    queryKey: ["quiz-q", id],
    queryFn: async () => (await supabase.from("quiz_questions").select("*").eq("quiz_id", id).order("position")).data ?? [],
  });

  const score = questions?.filter(q => answers[q.id] === q.correct_option).length ?? 0;

  async function submit() {
    setSubmitted(true);
    if (user && quiz && questions) {
      await supabase.from("quiz_attempts").insert({
        quiz_id: quiz.id, user_id: user.id, score, total: questions.length
      });
      const points = score === questions.length ? quiz.points_reward : Math.round(quiz.points_reward * (score/questions.length));
      const { data: prof } = await supabase.from("profiles").select("points").eq("id", user.id).maybeSingle();
      if (prof) await supabase.from("profiles").update({ points: (prof.points ?? 0) + points }).eq("id", user.id);
      toast.success(`You scored ${score}/${questions.length} — +${points} points`);
    }
  }

  if (!quiz) return <div className="container mx-auto px-4 py-20">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Link to="/quizzes" className="text-sm text-accent hover:underline">← All quizzes</Link>
      <h1 className="font-display text-4xl uppercase mt-4">{quiz.title}</h1>
      <p className="text-muted-foreground">{quiz.description}</p>

      <div className="mt-8 space-y-6">
        {questions?.map((q:any, i:number) => (
          <Card key={q.id} className="stadium-card p-6 border-0">
            <div className="text-xs uppercase tracking-widest text-accent">Question {i+1}</div>
            <h3 className="font-display text-xl mt-2">{q.question}</h3>
            <div className="mt-4 space-y-2">
              {(q.options as any[]).map(opt => {
                const selected = answers[q.id] === opt.id;
                const correct = submitted && opt.id === q.correct_option;
                const wrong = submitted && selected && opt.id !== q.correct_option;
                return (
                  <button
                    key={opt.id}
                    disabled={submitted}
                    onClick={() => setAnswers(a => ({ ...a, [q.id]: opt.id }))}
                    className={`w-full text-left rounded-md border px-4 py-3 transition-colors
                      ${correct?"border-accent bg-accent/10":""}
                      ${wrong?"border-destructive bg-destructive/10":""}
                      ${!submitted && selected?"border-accent":"border-border"}
                      ${!submitted?"hover:border-accent":""}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {!submitted ? (
        <Button onClick={submit} disabled={Object.keys(answers).length < (questions?.length ?? 0)}
          className="mt-8 w-full bg-[var(--gradient-claret)]" size="lg">Submit answers</Button>
      ) : (
        <Card className="stadium-card p-6 border-0 mt-8 text-center">
          <div className="font-display text-5xl">{score}/{questions?.length}</div>
          <p className="text-muted-foreground mt-2">{score === questions?.length ? "Perfect — true Hammer!" : "Not bad. Try another quiz."}</p>
        </Card>
      )}
    </div>
  );
}
