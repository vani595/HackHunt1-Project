import React, { useState } from "react";
import { ExternalLink, Trophy, Calendar } from "lucide-react";

const PLATFORM_STYLES = {
  Devpost: "bg-blue-600/90 text-white border-blue-400/40",
  Unstop: "bg-orange-600/90 text-white border-orange-400/40",
  DoraHacks: "bg-emerald-600/90 text-white border-emerald-400/40",
  Devfolio: "bg-purple-600/90 text-white border-purple-400/40"
};

function formatDeadline(raw) {
  if (!raw || !String(raw).trim()) return null;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }
  return String(raw).trim();
}

export default function HackathonCard({ hackathon }) {
  const [imgError, setImgError] = useState(false);
  const badgeClass =
    PLATFORM_STYLES[hackathon.platform] ||
    "bg-slate-600/90 text-white border-slate-400/40";
  const deadlineLabel = formatDeadline(hackathon.deadline);
  const showImg = hackathon.image && !imgError;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-800/40 shadow-lg transition duration-300 hover:scale-[1.02] hover:border-slate-500 hover:shadow-2xl hover:shadow-violet-500/10">
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-900">
        <span
          className={`absolute left-3 top-3 z-10 rounded-full border px-3 py-1 text-xs font-semibold shadow-md backdrop-blur-sm ${badgeClass}`}
        >
          {hackathon.platform}
        </span>
        {showImg ? (
          <img
            src={hackathon.image}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-500">
            <span className="text-sm font-medium">No banner</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-lg font-semibold text-slate-100">
          {hackathon.title}
        </h3>

        {deadlineLabel && (
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="h-4 w-4 shrink-0 text-cyan-400/80" />
            <span>Ends: {deadlineLabel}</span>
          </p>
        )}

        <p className="mt-2 flex items-start gap-2 text-sm text-amber-200/90">
          <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/90" />
          <span className="line-clamp-2">{hackathon.prize || "N/A"}</span>
        </p>

        <div className="mt-auto pt-4">
          <a
            href={hackathon.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-blue-500"
          >
            View hackathon
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  );
}
