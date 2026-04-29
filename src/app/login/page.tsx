"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendOtp, verifyOtp } from "@/lib/auth/session";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await sendOtp(email.trim().toLowerCase());
      setStep("code");
      toast.success("Te enviamos un código por correo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar el código");
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
            {step === "email" ? "Empezar." : (
              <>Revisa tu correo.</>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === "email"
              ? "Te enviamos un código de 6 dígitos. Sin contraseñas."
              : `Enviamos el código a ${email}.`}
          </p>
        </div>

        {step === "email" ? (
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
              {busy ? "Enviando…" : "Enviar código"}
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          </form>
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
