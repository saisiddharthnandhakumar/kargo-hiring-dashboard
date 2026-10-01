"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Shortlist" },
  { href: "/rubric", label: "Rubric" },
  { href: "/settings", label: "Settings" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0b0b0c]/95 backdrop-blur">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-2xl font-black tracking-tight text-white"
        >
          Kargo
        </Link>

        <nav aria-label="Main" className="flex items-center gap-2 sm:gap-3">
          <ul className="mr-2 hidden items-center gap-1 md:flex">
            {LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md px-4 py-2 text-[15px] font-medium transition-colors ${
                      active ? "text-white" : "text-white/70 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/dashboard?upload=1"
            className="rounded-lg border border-white/15 bg-[#0b0b0c] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:border-white/30 hover:bg-white/5"
          >
            Upload CV
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-[#e8e8e8] px-4 py-2.5 text-[15px] font-medium text-[#0b0b0c] transition-colors hover:bg-white"
          >
            Open Shortlist
          </Link>
        </nav>
      </div>
    </header>
  );
}
