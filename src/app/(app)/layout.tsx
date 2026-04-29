import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { AuthProvider } from "@/lib/auth/session";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </AuthProvider>
  );
}
