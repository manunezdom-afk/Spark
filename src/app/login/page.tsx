"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendOtp, signInAnonymously, signInWithGoogle, verifyOtp } from "@/lib/auth/session";
import { toast } from "sonner";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [guestBusy, setGuestBusy] = useState(false);

  async function onSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await sendOtp(email.trim().toLowerCase(), mode);
      setStep("code");
      toast.success("Te enviamos un código por correo.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al enviar el código";
      // Supabase devuelve "Signups not allowed for otp" cuando shouldCreateUser=false
      // y la cuenta no existe. Lo traducimos a algo accionable.
      if (/signups not allowed|user not found/i.test(msg)) {
        toast.error("No encontramos esa cuenta. Cambia a 'Crear cuenta' si es nueva.");
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setBusy(true);
    try {
      await verifyOtp(email.trim().toLowerCase(), code.trim());
      toast.success("Listo.");
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Código incorrecto");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setGoogleBusy(true);
    const result = await signInWithGoogle();
    if (!result.ok) {
      toast.error(result.error);
      setGoogleBusy(false);
    }
    // Si ok: Supabase redirige a Google, no hay nada más que hacer.
  }

  async function onGuest() {
    setGuestBusy(true);
    const result = await signInAnonymously();
    if (!result.ok) {
      toast.error(result.error);
      setGuestBusy(false);
      return;
    }
    toast.success("Listo. Tus datos se guardan en este dispositivo.");
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex items-center gap-2.5">
          <Zap className="w-5 h-5 text-spark" strokeWidth={1.5} />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Spark
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {step === "code"
              ? "Revisa tu correo."
              : mode === "signin"
                ? "Entra a Spark."
                : "Crea tu cuenta."}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === "code"
              ? `Enviamos el código a ${email}.`
              : mode === "signin"
                ? "Te enviamos un código de 6 dígitos. Sin contraseñas."
                : "Te enviamos un código y te creamos la cuenta al verificarlo."}
          </p>
        </div>

        {step === "email" ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={onGoogle}
              disabled={googleBusy || busy}
              className="h-12 justify-center gap-3"
            >
              <GoogleIcon />
              {googleBusy ? "Redirigiendo…" : "Continuar con Google"}
            </Button>

            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>o con correo</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={onSendCode} className="flex flex-col gap-4">
              <Input
                type="email"
                autoFocus
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
              />
              <Button type="submit" disabled={busy || !email} className="h-12">
                {busy
                  ? "Enviando…"
                  : mode === "signin"
                    ? "Enviar código"
                    : "Crear cuenta y enviar código"}
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                {mode === "signin"
                  ? "¿No tienes cuenta? Crear una nueva"
                  : "¿Ya tienes cuenta? Iniciar sesión"}
              </button>
            </form>

            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>o sin cuenta</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              onClick={onGuest}
              disabled={guestBusy || busy || googleBusy}
              className="h-12 flex items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-60"
            >
              {guestBusy ? "Entrando…" : "Probar sin cuenta"}
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <p className="text-[10.5px] leading-relaxed text-muted-foreground text-center -mt-2">
              Tu progreso se guarda. Crea cuenta luego para no perderlo.
            </p>
          </>
        ) : (
          <form onSubmit={onVerify} className="flex flex-col gap-4">
            <Input
              inputMode="numeric"
              autoFocus
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="h-12 text-center text-xl tracking-[0.5em] font-mono"
            />
            <Button type="submit" disabled={busy || code.length !== 6} className="h-12">
              {busy ? "Verificando…" : "Confirmar"}
            </Button>
            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              Usar otro correo
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}
