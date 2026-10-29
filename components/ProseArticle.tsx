import { Children, Fragment, type ReactNode } from "react";

export function ProseArticle({
  kicker,
  heading,
  children,
}: {
  kicker: string;
  heading: string;
  children: ReactNode;
}) {
  const blocks = Children.toArray(children);
  return (
    <section className="reading bg-[#f3f6fb] text-slate-900">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{kicker}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{heading}</h2>
        <article className="prose prose-slate mt-8 max-w-none">
          {blocks.map((block, index) => (
            <Fragment key={index}>
              {block}
              {(index + 1) % 2 === 0 && index < blocks.length - 1 ? <div className="not-prose h-10" aria-hidden="true" /> : null}
            </Fragment>
          ))}
        </article>
      </div>
    </section>
  );
}
