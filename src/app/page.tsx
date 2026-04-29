import { Play, Activity, Clock, CheckCircle2 } from "lucide-react";

export default function SparkDashboard() {
  return (
    <div className="min-h-screen bg-[#07080B] text-white overflow-hidden relative selection:bg-purple-500/30">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#A78BFA]/10 blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-12">
        <header>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Spark <span className="text-purple-400">Dashboard</span>
          </h1>
          <p className="text-zinc-400 mt-2 text-lg">
            Centro de control de automatizaciones.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Action Button */}
          <div className="md:col-span-1">
            <button className="w-full group relative flex flex-col items-center justify-center gap-4 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:border-purple-500/50 hover:shadow-[0_0_30px_-5px_rgba(167,139,250,0.3)] text-left">
              <div className="h-16 w-16 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                <Play className="w-8 h-8 ml-1" fill="currentColor" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-medium text-white">Lanzar nueva automatización</h3>
                <p className="text-sm text-zinc-400 mt-1">Configurar y ejecutar</p>
              </div>
            </button>
          </div>

          {/* Active Tasks Section */}
          <div className="md:col-span-2 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-medium text-white">Tareas Activas</h2>
            </div>
            
            <div className="flex-1 flex flex-col gap-3">
              {/* Task Item 1 */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <div>
                    <h4 className="font-medium text-zinc-200">Sincronización de Base de Datos</h4>
                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> Hace 2 min
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">
                  Ejecutando
                </span>
              </div>

              {/* Task Item 2 */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <div>
                    <h4 className="font-medium text-zinc-200">Análisis de Feedback (Nova)</h4>
                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> Hace 15 min
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-400/10 text-purple-400 border border-purple-400/20">
                  Procesando
                </span>
              </div>
              
              {/* Task Item 3 */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md hover:bg-white/[0.04] transition-colors opacity-60">
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="w-5 h-5 text-zinc-500" />
                  <div>
                    <h4 className="font-medium text-zinc-400">Extracción de fechas Kairos</h4>
                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> Hace 1 hora
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                  Completado
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}