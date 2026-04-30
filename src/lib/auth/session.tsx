"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSparkAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useSparkAuth must be used within AuthProvider");
  return ctx;
}

export async function sendOtp(email: string, mode: "signin" | "signup"): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // En "signin" exigimos que el usuario ya exista — evita la creación
      // silenciosa de cuentas. En "signup" sí permitimos crear, pero la UX
      // lo deja explícito en el copy del botón.
      shouldCreateUser: mode === "signup",
    },
  });
  if (error) throw error;
}

export async function verifyOtp(email: string, token: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) throw error;
}

export async function signInWithGoogle(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Modo invitado — crea una sesión anónima en Supabase. El usuario obtiene
 * un user_id real (UUID) y puede usar todo Spark con persistencia normal,
 * pero sin email ni Google. Después puede convertir su cuenta a una real
 * con `linkIdentity` o `updateUser` y todos sus datos se conservan.
 *
 * Requiere que "Anonymous sign-ins" esté habilitado en el proyecto Supabase
 * (Authentication → Providers → Anonymous).
 */
export async function signInAnonymously(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    // Mensaje accionable cuando aún no se habilitó en el dashboard.
    if (/anonymous|disabled|not enabled/i.test(error.message)) {
      return {
        ok: false,
        error:
          "El modo invitado aún no está activo. Contacta al soporte si esto sigue.",
      };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * `true` si la sesión actual es un usuario anónimo (modo invitado).
 * Supabase agrega `is_anonymous: true` a `user.app_metadata` o como flag
 * top-level dependiendo de la versión del SDK.
 */
export function isAnonymousUser(user: User | null): boolean {
  if (!user) return false;
  // Property is exposed on the user object directly in @supabase/supabase-js
  // ≥2.43, but TypeScript types lag — read defensively.
  const u = user as User & { is_anonymous?: boolean };
  return u.is_anonymous === true;
}
