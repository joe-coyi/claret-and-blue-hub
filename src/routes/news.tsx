import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/news")({
  head: () => ({ meta:[
    { title: "News — Claret & Co." },
    { name:"description", content:"All the latest West Ham United news, transfers and analysis." },
    { property:"og:title", content:"News — Claret & Co." },
    { property:"og:description", content:"All the latest West Ham United news, transfers and analysis." },
  ]}),
  component: NewsPage,
});

function NewsPage() {
  const location = useLocation();

  if (location.pathname !== "/news") {
    return <Outlet />;
  }

  const { data } = useQuery({
    queryKey: ["news"],
    queryFn: async () => (await supabase.from("news").select("*").eq("published", true).order("published_at", { ascending:false })).data ?? [],
  });
  const featured = data?.[0];
  const rest = (data ?? []).slice(1);

  return (
    <div className="container mx-auto px-4 py-12">
      <p className="text-xs uppercase tracking-widest text-accent">Newsroom</p>
      <h1 className="font-display text-4xl md:text-6xl uppercase">Hammers Headlines</h1>

      {featured && (
        <Link to="/news/$slug" params={{ slug: featured.slug }} className="block mt-10">
          <Card className="stadium-card border-0 overflow-hidden md:grid md:grid-cols-2 hover:border-accent transition">
            {featured.image_url && (
              <div className="aspect-video md:aspect-auto bg-muted" style={{backgroundImage:`url(${featured.image_url})`, backgroundSize:"cover", backgroundPosition:"center"}}/>
            )}
            <div className="p-8">
              <Badge className="bg-[var(--gradient-claret)] uppercase">{featured.category}</Badge>
              <h2 className="font-display text-3xl md:text-4xl uppercase mt-3">{featured.title}</h2>
              <p className="text-muted-foreground mt-3">{featured.excerpt}</p>
              <p className="text-xs text-muted-foreground mt-4 uppercase tracking-widest">{new Date(featured.published_at).toLocaleDateString()} {featured.author && `· ${featured.author}`}</p>
            </div>
          </Card>
        </Link>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {rest.map(n => (
          <Link key={n.id} to="/news/$slug" params={{ slug: n.slug }}>
            <Card className="stadium-card border-0 overflow-hidden hover:border-accent transition h-full">
              {n.image_url && <div className="aspect-video bg-muted" style={{backgroundImage:`url(${n.image_url})`, backgroundSize:"cover", backgroundPosition:"center"}}/>}
              <div className="p-5">
                <Badge variant="outline" className="uppercase text-[10px]">{n.category}</Badge>
                <h3 className="font-display text-xl mt-2">{n.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{n.excerpt}</p>
                <p className="text-xs text-muted-foreground mt-3 uppercase tracking-widest">{new Date(n.published_at).toLocaleDateString()}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {(!data || data.length===0) && <p className="text-muted-foreground mt-8">No articles published yet.</p>}
    </div>
  );
}