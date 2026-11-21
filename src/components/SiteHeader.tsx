import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user?.email ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <header className="border-b border-foreground/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-3xl leading-none">Unfit</span>
          <span className="label-mono text-muted-foreground">phone screening</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {email ? (
            <>
              <Link to="/quiz" className="hover:text-accent">New screening</Link>
              <Link to="/history" className="hover:text-accent">My results</Link>
              <button onClick={signOut} className="text-muted-foreground hover:text-foreground">Sign out</button>
            </>
          ) : (
            <Link to="/auth" className="hover:text-accent">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
