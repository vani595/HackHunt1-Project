import React from "react";

export default function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-800/50">
      <div className="aspect-[16/9] bg-slate-700/80" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-slate-700/80" />
        <div className="h-3 w-1/2 rounded bg-slate-700/60" />
        <div className="h-3 w-2/3 rounded bg-slate-700/60" />
        <div className="h-10 w-full rounded-xl bg-slate-700/70" />
      </div>
    </div>
  );
}
