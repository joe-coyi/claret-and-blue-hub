import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

type DraftQ = { question: string; options: { id: string; label: string }[]; correct_option: string };

function blankQ(): DraftQ {
  return { question: "", options: [{id:"a",label:""},{id:"b",label:""},{id:"c",label:""},{id:"d",label:""}], correct_option: "a" };
}

export function AdminQuizzes() {
  const qc = useQueryClient();
  const { data: quizzes } = useQuery({
    queryKey: ["admin-quizzes"],
    queryFn: async () => (await supabase.from("quizzes").select("*, quiz_questions(count)").order("created_at",{ascending:false})).data ?? [],
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [points, setPoints] = useState(10);
  const [questions, setQuestions] = useState<DraftQ[]>([blankQ()]);

  function updateQ(i: number, patch: Partial<DraftQ>) {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  }
  function updateOpt(i: number, oi: number, label: string) {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, options: q.options.map((o, j) => j === oi ? { ...o, label } : o) } : q));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title required");
    if (questions.some(q => !q.question.trim() || q.options.some(o => !o.label.trim())))
      return toast.error("Fill in every question and option");

    const { data: quiz, error } = await supabase.from("quizzes").insert({
      title, description, difficulty, points_reward: points,
    }).select().single();
    if (error || !quiz) return toast.error(error?.message ?? "Failed");

    const rows = questions.map((q, i) => ({
      quiz_id: quiz.id, question: q.question, options: q.options, correct_option: q.correct_option, position: i,
    }));
    const { error: qErr } = await supabase.from("quiz_questions").insert(rows);
    if (qErr) return toast.error(qErr.message);

    toast.success("Quiz published");
    setTitle(""); setDescription(""); setDifficulty("easy"); setPoints(10); setQuestions([blankQ()]);
    qc.invalidateQueries({ queryKey: ["admin-quizzes"] });
  }

  async function del(id: string) {
    await supabase.from("quiz_questions").delete().eq("quiz_id", id);
    await supabase.from("quizzes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-quizzes"] });
  }

  return (
    <div className="space-y-6 mt-6">
      <Card className="stadium-card p-6 border-0">
        <h3 className="font-display text-xl uppercase mb-4">Create quiz</h3>
        <form onSubmit={save} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label>Title</Label><Input required value={title} onChange={e=>setTitle(e.target.value)}/></div>
            <div><Label>Difficulty</Label>
              <select value={difficulty} onChange={e=>setDifficulty(e.target.value)} className="w-full bg-input border border-border rounded-md px-2 py-2 text-sm">
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </div>
            <div className="md:col-span-2"><Label>Description</Label><Textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2}/></div>
            <div><Label>Points reward</Label><Input type="number" min={1} value={points} onChange={e=>setPoints(Number(e.target.value))}/></div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display uppercase text-sm">Questions</h4>
              <Button type="button" variant="outline" size="sm" onClick={()=>setQuestions(qs=>[...qs, blankQ()])}><Plus className="h-3.5 w-3.5 mr-1"/>Add question</Button>
            </div>
            {questions.map((q, i) => (
              <Card key={i} className="p-4 border border-border bg-secondary/20">
                <div className="flex items-start gap-2">
                  <span className="font-display text-accent">Q{i+1}</span>
                  <div className="flex-1 space-y-3">
                    <Input placeholder="Question text" value={q.question} onChange={e=>updateQ(i,{question:e.target.value})}/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options.map((o, oi) => (
                        <label key={o.id} className="flex items-center gap-2">
                          <input type="radio" name={`correct-${i}`} checked={q.correct_option===o.id} onChange={()=>updateQ(i,{correct_option:o.id})}/>
                          <Input placeholder={`Option ${o.id.toUpperCase()}`} value={o.label} onChange={e=>updateOpt(i,oi,e.target.value)}/>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Select the radio next to the correct answer.</p>
                  </div>
                  {questions.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={()=>setQuestions(qs=>qs.filter((_,idx)=>idx!==i))}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Button className="bg-[var(--gradient-claret)]">Publish quiz</Button>
        </form>
      </Card>

      <div className="space-y-3">
        {quizzes?.map((q:any) => (
          <Card key={q.id} className="stadium-card p-4 border-0 flex items-center gap-3">
            <div className="flex-1">
              <div className="font-display">{q.title}</div>
              <div className="text-xs text-muted-foreground">{q.difficulty} · {q.quiz_questions?.[0]?.count ?? 0} questions · +{q.points_reward} pts</div>
            </div>
            <Button variant="ghost" size="icon" onClick={()=>del(q.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
          </Card>
        ))}
      </div>
    </div>
  );
}