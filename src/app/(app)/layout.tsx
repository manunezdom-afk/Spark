import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import { PageHelp } from "@/components/layout/PageHelp";
import { AuthProvider } from "@/lib/auth/session";
import { NovaAskProvider } from "@/components/nova/NovaAskProvider";
import { KairosBridgeProvider } from "@/components/providers/KairosBridgeProvider";
import { WelcomeTour } from "@/components/onboarding/WelcomeTour";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider delayDuration={200} skipDelayDuration={300}>
        <NovaAskProvider>
          <KairosBridgeProvider />
          <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main
              className="flex-1 flex flex-col min-w-0 pt-14 md:pt-0 pb-[74px] md:pb-0 relative overflow-hidden"
              style={{
                background:
                  "radial-gradient(ellipse 720px 360px at 92% -8%, rgba(255,138,76,0.05) 0%, transparent 60%), " +
                  "radial-gradient(ellipse 600px 300px at -8% 92%, rgba(168,85,247,0.04) 0%, transparent 55%)",
              }}
            >
              {/* Orbes gigantes de luz de fondo animados */}
              <div className="pointer-events-none absolute top-[-10%] right-[-10%] -z-10 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-spark/10 via-pink-500/8 to-transparent blur-[120px] animate-brand-pulse" />
              <div className="pointer-events-none absolute bottom-[-15%] left-[-15%] -z-10 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-purple-500/8 via-blue-500/5 to-transparent blur-[140px] animate-brand-pulse" style={{ animationDelay: "-2s" }} />
              <div className="pointer-events-none absolute top-[40%] left-[30%] -z-10 w-[400px] h-[400px] rounded-full bg-yellow-500/3 blur-[100px] animate-brand-pulse" style={{ animationDelay: "-4s" }} />

              <MobileTopBar />
              {children}
            </main>
            <MobileNav />
            <PageHelp />
          </div>
          <WelcomeTour />
        </NovaAskProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "font-sans text-[13px] rounded-xl border border-black/[0.08]",
            },
          }}
        />
      </TooltipProvider>
    </AuthProvider>
  );
}
