export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 w-24 bg-slate-200 rounded" />
      <div className="grid md:grid-cols-3 gap-6 mt-4">
        <div className="md:col-span-2 space-y-4">
          <div className="h-8 w-2/3 bg-slate-200 rounded" />
          <div className="h-4 w-1/3 bg-slate-100 rounded" />
          <div className="aspect-[16/9] rounded-xl bg-slate-200" />
          <div className="h-32 bg-slate-100 rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="h-40 bg-slate-100 rounded-xl" />
          <div className="h-24 bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
