"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/silos";

export function NavPills() {
  const pathname = usePathname();
  const match = pathname.match(/^\/([^/]+)\/([^/]+)/);
  const current = match?.[1] ?? "";
  const citySlug = match && match[1] !== "stadium" ? match[2] : "new-york-city";

  return (
    <nav aria-label="Weather desks">
      <ul className="flex gap-2 overflow-x-auto pb-1">
        {NAV_ITEMS.map((item) => {
          const href = item.id === "stadium" ? "/stadium/lords" : `/${item.id}/${citySlug}`;
          const active = current === item.id;
          return (
            <li key={item.id} className="shrink-0">
              <a
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex rounded-full px-3 py-1.5 text-sm ${active ? "bg-white text-slate-950" : "bg-white/10 text-slate-100 ring-1 ring-white/15"}`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
