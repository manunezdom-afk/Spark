export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-10 max-w-5xl animate-pulse">
      {/* Date */}
      <div className="h-3 w-28 bg-black/[0.07] rounded-full mb-5" />
      {/* Greeting */}
      <div className="h-11 w-72 bg-black/[0.07] rounded-lg mb-2" />
      <div className="h-11 w-52 bg-black/[0.05] rounded-lg mb-12" />

      {/* Section label */}
      <div className="h-2.5 w-32 bg-black/[0.06] rounded-full mb-4" />

      {/* Engine cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-black/[0.04] border border-black/[0.04]" />
        ))}
      </div>
    </div>
  );
}
