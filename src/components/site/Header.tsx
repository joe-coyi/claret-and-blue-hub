import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Hammer, LogOut, Shield } from "lucide-react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/matches", label: "Matchday" },
  { to: "/news", label: "News" },
  { to: "/players", label: "Squad" },
  { to: "/polls", label: "Polls" },
  { to: "/quizzes", label: "Quizzes" },
  { to: "/leaderboard", label: "Leaderboard" },
];

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-md bg-[var(--gradient-claret)] grid place-items-center claret-glow">
            <Hammer className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl tracking-wide">CLARET <span className="text-accent">&amp; CO.</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {nav.map(n => (
            <Link
              key={n.to}
              to={n.to}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
              activeProps={{ className: "px-3 py-2 text-sm font-medium text-foreground bg-secondary rounded-md" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button asChild variant="outline" size="sm">
              <Link to="/admin"><Shield className="h-4 w-4" />Admin</Link>
            </Button>
          )}
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" />Sign out</Button>
          ) : (
            <Button asChild size="sm" className="bg-[var(--gradient-claret)] hover:opacity-90">
              <Link to="/auth">Join the family</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
