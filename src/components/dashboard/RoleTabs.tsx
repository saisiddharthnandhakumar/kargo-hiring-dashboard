import Link from "next/link";
import type { RoleKey } from "@/lib/rubric";

const TABS: { key: RoleKey; label: string }[] = [
  { key: "pm", label: "Product Manager" },
  { key: "spm", label: "Senior Product Manager" },
];

export function RoleTabs({ active }: { active: RoleKey }) {
  return (
    <nav aria-label="Select role" className="flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={`/dashboard?role=${tab.key}`}
            aria-current={isActive ? "page" : undefined}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive ? "text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            {isActive && (
              <span
                className="absolute inset-x-0 -bottom-px h-0.5 bg-accent"
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
