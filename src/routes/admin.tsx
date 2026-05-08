import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminMatches } from "@/components/admin/AdminMatches";
import { AdminPlayers } from "@/components/admin/AdminPlayers";
import { AdminPolls } from "@/components/admin/AdminPolls";
import { AdminEvents } from "@/components/admin/AdminEvents";
import { AdminNews } from "@/components/admin/AdminNews";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta:[{title:"Admin — Claret & Co."}]}),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div className="container mx-auto px-4 py-20">Loading...</div>;
  if (!user) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-3xl uppercase">Sign in required</h1>
      <Link to="/auth" className="text-accent underline">Go to sign in</Link>
    </div>
  );
  if (!isAdmin) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <Shield className="h-10 w-10 mx-auto text-destructive mb-4"/>
      <h1 className="font-display text-3xl uppercase">Admin access required</h1>
      <p className="text-muted-foreground mt-2">Your account doesn't have admin privileges.</p>
      <p className="text-xs text-muted-foreground mt-4">Tip: open the backend and add your user to <code>user_roles</code> with role <code>admin</code>.</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <p className="text-xs uppercase tracking-widest text-accent">Admin</p>
      <h1 className="font-display text-4xl md:text-5xl uppercase">Mission control</h1>
      <Tabs defaultValue="matches" className="mt-8">
        <TabsList>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="events">Live events</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="polls">Polls</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
        </TabsList>
        <TabsContent value="matches"><AdminMatches/></TabsContent>
        <TabsContent value="events"><AdminEvents/></TabsContent>
        <TabsContent value="players"><AdminPlayers/></TabsContent>
        <TabsContent value="polls"><AdminPolls/></TabsContent>
        <TabsContent value="news"><AdminNews/></TabsContent>
      </Tabs>
    </div>
  );
}
