import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { PollWidget } from "@/components/site/PollWidget";

export const Route = createFileRoute("/news/$slug")({
  component: Article,
});

function Article() {
  const { slug } = Route.useParams();
  const { data: n } = useQuery({
    queryKey: ["news", slug],
    queryFn: async () => (await supabase.from("news").select("*").eq("slug", slug).maybeSingle()).data,
  });
  if (!n) return <div className="container mx-auto px-4 py-20">Loading...</div>;
  return (
    <article className="container mx-auto px-4 py-12 max-w-3xl">
      <Link to="/news" className="text-sm text-accent hover:underline">← All news</Link>
      <Badge className="bg-[var(--gradient-claret)] uppercase mt-6">{n.category}</Badge>
      <h1 className="font-display text-4xl md:text-5xl uppercase mt-3">{n.title}</h1>
      <p className="text-xs text-muted-foreground mt-3 uppercase tracking-widest">{new Date(n.published_at).toLocaleDateString()} {n.author && `· ${n.author}`}</p>
      {n.image_url && <img src={n.image_url} alt={n.title} className="w-full rounded-lg mt-6"/>}
      {n.excerpt && <p className="text-lg text-muted-foreground mt-6 leading-relaxed">{n.excerpt}</p>}
      <div className="prose prose-invert max-w-none mt-6 whitespace-pre-wrap leading-relaxed">{n.body}</div>
      {(n as any).poll_id && (
        <div className="mt-10">
          <p className="text-xs uppercase tracking-widest text-accent mb-3">Reader poll</p>
          <PollWidget pollId={(n as any).poll_id}/>
        </div>
      )}
    </article>
  );
}