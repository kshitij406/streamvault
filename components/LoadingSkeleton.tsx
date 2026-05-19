export function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-36 sm:w-44 animate-pulse">
      <div className="aspect-[2/3] bg-white/10 rounded-lg" />
      <div className="mt-2 h-3 bg-white/10 rounded w-3/4" />
      <div className="mt-1.5 h-3 bg-white/10 rounded w-1/2" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 mb-10">
      <div className="h-6 bg-white/10 rounded w-48 mb-4 animate-pulse" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
}

export function SkeletonHero() {
  return (
    <div className="relative h-[70vh] min-h-[500px] w-full animate-pulse">
      <div className="absolute inset-0 bg-white/5" />
      <div className="absolute bottom-16 left-8 right-8 space-y-4">
        <div className="h-10 bg-white/10 rounded w-64" />
        <div className="h-4 bg-white/10 rounded w-80" />
        <div className="h-4 bg-white/10 rounded w-72" />
        <div className="flex gap-3 mt-6">
          <div className="h-10 bg-white/10 rounded w-28" />
          <div className="h-10 bg-white/10 rounded w-28" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="animate-pulse">
      <div className="h-[50vh] bg-white/5" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="h-8 bg-white/10 rounded w-64" />
        <div className="h-4 bg-white/10 rounded w-80" />
        <div className="flex gap-2 mt-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-6 bg-white/10 rounded w-20" />)}
        </div>
        <div className="h-32 bg-white/10 rounded mt-4" />
      </div>
    </div>
  );
}
