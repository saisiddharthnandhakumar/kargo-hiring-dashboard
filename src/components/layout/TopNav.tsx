import Link from "next/link";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/rubric", label: "Rubric" },
  { href: "/settings", label: "Settings" },
];

export function TopNav() {
  return (
    <div className="border-b border-border">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3">
        <span className="font-mono text-xs tracking-widest text-muted uppercase">Kargo</span>
        <nav className="flex gap-4">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
