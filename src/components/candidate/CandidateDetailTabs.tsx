"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";

interface Tab {
  key: string;
  label: string;
  content: ReactNode;
}

/**
 * Left-aligned tabs (not centered pills, not an accordion) for secondary,
 * reference-style evidence — score breakdown, raw CV evidence, interview
 * brief, history — that supports the above-the-fold decision but isn't
 * needed to act on it. Tabs read as "pick what you need" rather than an
 * accordion's implied sequential checklist, which fits this use case.
 */
export function CandidateDetailTabs({ tabs }: { tabs: Tab[] }) {
  const [activeKey, setActiveKey] = useState(tabs[0]?.key);
  const activeIndex = tabs.findIndex((t) => t.key === activeKey);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (activeIndex + delta + tabs.length) % tabs.length;
    setActiveKey(tabs[nextIndex]!.key);
  }

  const active = tabs.find((t) => t.key === activeKey) ?? tabs[0];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Candidate evidence"
        onKeyDown={onKeyDown}
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`panel-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveKey(tab.key)}
              className={`relative shrink-0 cursor-pointer px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
      {active && (
        <div
          id={`panel-${active.key}`}
          role="tabpanel"
          aria-labelledby={`tab-${active.key}`}
          className="pt-4"
        >
          {active.content}
        </div>
      )}
    </div>
  );
}
