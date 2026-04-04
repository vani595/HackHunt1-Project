import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";

export default function FilterBar({
  search,
  onSearchChange,
  platform,
  onPlatformChange,
  sort,
  onSortChange
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-700/80 bg-slate-800/40 p-4 backdrop-blur-sm md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title…"
            className="w-full rounded-xl border border-slate-600 bg-slate-900/80 py-2.5 pl-11 pr-4 text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Platform
          </span>
          {["All", "Devpost", "Unstop", "DoraHacks"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPlatformChange(p)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                platform === p
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                  : "border border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-700/60 pt-4">
        <SlidersHorizontal className="h-4 w-4 text-slate-500" />
        <label className="text-sm text-slate-400" htmlFor="sort-live-hackathons">
          Sort by
        </label>
        <select
          id="sort-live-hackathons"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        >
          <option value="ending">Ending soon</option>
          <option value="newest">Newest first</option>
          <option value="prize">Highest prize</option>
        </select>
      </div>
    </div>
  );
}
