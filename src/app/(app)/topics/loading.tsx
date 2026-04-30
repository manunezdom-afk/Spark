export default function TopicsLoading() {
  return (
    <div className="p-6 md:p-10 max-w-6xl animate-pulse">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="h-2.5 w-20 bg-black/[0.06] rounded-full mb-3" />
          <div className="h-10 w-64 bg-black/[0.07] rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-black/[0.06] rounded-lg" />
      </div>

      {/* Topic cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-44 rounded-xl bg-black/[0.04] border border-black/[0.04]" />
        ))}
      </div>
    </div>
  );
}
