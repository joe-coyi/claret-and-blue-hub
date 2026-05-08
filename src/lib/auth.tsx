import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null, session: null, loading: true, isAdmin: false, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  async function loadRole(userId: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!error && !!data);
  }

  async function applySession(nextSession: Session | null) {
    setSession(nextSession);

    if (!nextSession?.user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    await loadRole(nextSession.user.id);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    const runApplySession = async (nextSession: Session | null) => {
      if (!active) return;
      await applySession(nextSession);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, nextSession) => {
      void runApplySession(nextSession);
    });
    void supabase.auth.getSession().then(({ data }) => {
      void runApplySession(data.session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <Ctx.Provider value={{
      user: session?.user ?? null,
      session,
      loading,
      isAdmin,
      signOut: async () => { await supabase.auth.signOut(); },
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
