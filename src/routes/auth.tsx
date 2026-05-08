import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Hammer } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta:[{title:"Sign in — Claret & Co."}]}),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) nav({ to: "/" }); }, [user, loading, nav]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Welcome back!"); nav({ to: "/" }); }
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin, data: { display_name: name || email.split("@")[0] } },
    });
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Account created — welcome to the family!"); nav({ to: "/" }); }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="text-center mb-8">
        <div className="h-14 w-14 rounded-md bg-[var(--gradient-claret)] grid place-items-center mx-auto claret-glow">
          <Hammer className="h-7 w-7 text-primary-foreground"/>
        </div>
        <h1 className="font-display text-3xl uppercase mt-4">Join the family</h1>
        <p className="text-muted-foreground text-sm mt-1">Sign in to vote, predict and earn your stripes.</p>
      </div>
      <Card className="stadium-card border-0 p-6">
        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={signIn} className="space-y-4 mt-4">
              <div><Label>Email</Label><Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></div>
              <Button disabled={busy} className="w-full bg-[var(--gradient-claret)]">Sign in</Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={signUp} className="space-y-4 mt-4">
              <div><Label>Display name</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="The Hammer" /></div>
              <div><Label>Email</Label><Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} /></div>
              <Button disabled={busy} className="w-full bg-[var(--gradient-claret)]">Create account</Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
      <p className="text-xs text-muted-foreground text-center mt-4"><Link to="/" className="hover:underline">← Back home</Link></p>
    </div>
  );
}
