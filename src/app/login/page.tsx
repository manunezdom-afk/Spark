export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#07080B] text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-white/[0.03] border border-white/10 w-full max-w-sm">
        <h1 className="text-2xl font-semibold">
          <span className="text-[#C97B3F]">Spark</span>{" "}
          <span className="text-purple-400">Login</span>
        </h1>
        <p className="text-zinc-500 text-sm text-center">
          Autenticación con Supabase — próximamente.
        </p>
      </div>
    </div>
  );
}
