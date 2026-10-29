"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold">The forecast request did not finish</h1>
      <p className="mt-3 text-slate-300">The weather source did not return a complete hour. Nothing on this screen was filled in with a guess.</p>
      <button type="button" onClick={reset} className="mt-6 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">
        Try again
      </button>
    </main>
  );
}
