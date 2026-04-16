interface CardProps {
  count?: number;
}

export function ListingCardSkeleton({ count = 4 }: CardProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse"
        >
          <div className="aspect-[16/9] rounded-md bg-slate-200 mb-3" />
          <div className="h-4 w-2/3 bg-slate-200 rounded" />
          <div className="h-3 w-1/2 bg-slate-100 rounded mt-2" />
          <div className="flex justify-between items-center mt-3">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-7 w-20 bg-slate-100 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="h-[calc(100vh-56px)] w-full flex">
      <div className="hidden md:flex w-[380px] shrink-0 border-r border-slate-200 bg-white flex-col">
        <div className="p-4 space-y-3 animate-pulse">
          <div className="h-4 w-1/2 bg-slate-200 rounded" />
          <div className="h-8 w-full bg-slate-100 rounded" />
          <div className="h-8 w-full bg-slate-100 rounded" />
        </div>
        <div className="flex-1 p-3">
          <ListingCardSkeleton count={3} />
        </div>
      </div>
      <div className="flex-1 bg-gradient-to-br from-emerald-50 to-sky-50 animate-pulse" />
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse space-y-3"
        >
          <div className="h-4 w-1/3 bg-slate-200 rounded" />
          <div className="h-10 w-full bg-slate-100 rounded" />
          <div className="h-10 w-full bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
}
