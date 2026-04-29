import type { ReactNode } from 'react';

// Spark shell: dark bg + purple ambient gradients shared by all /spark/* routes
export default function SparkLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07080B] text-white overflow-hidden relative selection:bg-purple-500/30">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#A78BFA]/10 blur-[120px]" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
