import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold">That page is not on the desk</h1>
      <p className="mt-3 text-slate-300">Try search, or go back to the world board.</p>
      <Link href="/" className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">Home</Link>
    </main>
  );
}
