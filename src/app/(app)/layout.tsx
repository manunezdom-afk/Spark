import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import { PageHelp } from "@/components/layout/PageHelp";
import { AuthProvider } from "@/lib/auth/session";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 pt-14 md:pt-0 pb-[74px] md:pb-0">
          <MobileTopBar />
          {children}
        </main>
        <MobileNav />
        <PageHelp />
      </div>
    </AuthProvider>
  );
}
