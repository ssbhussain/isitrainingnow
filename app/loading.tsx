export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm text-slate-300">Loading the live desk…</p>
      <div className="mt-4 grid gap-3 md:grid-cols-12">
        <div className="glass h-56 md:col-span-7" />
        <div className="glass h-56 md:col-span-5" />
      </div>
    </main>
  );
}
