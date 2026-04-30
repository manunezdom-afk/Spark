export default function MasteryLoading() {
  return (
    <div className="p-6 md:p-10 max-w-3xl animate-pulse">
      <div className="h-2.5 w-24 bg-black/[0.06] rounded-full mb-3" />
      <div className="h-10 w-56 bg-black/[0.07] rounded-lg mb-12" />

      <div className="flex flex-col">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="py-5 border-b border-black/[0.05]">
            <div className="flex justify-between mb-3">
              <div className="h-4 w-48 bg-black/[0.06] rounded" />
              <div className="h-3 w-14 bg-black/[0.05] rounded" />
            </div>
            <div className="h-1.5 w-full bg-black/[0.05] rounded-full mb-2" />
            <div className="h-2.5 w-24 bg-black/[0.04] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
