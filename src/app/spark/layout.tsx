import type { ReactNode } from 'react';
import Link from 'next/link';
import { SparkIcon } from '@/components/SparkIcon';

// Spark shell: dark bg + orange ambient gradients shared by all /spark/* routes
export default function SparkLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07080B] text-white overflow-hidden relative selection:bg-orange-500/30">
      {/* Ambient gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#FB923C]/10 blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-20 border-b border-white/[0.05] bg-[#07080B]/60 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <SparkIcon size={28} />
            <span className="font-semibold text-sm tracking-tight">Spark</span>
          </Link>
        </div>
      </nav>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
