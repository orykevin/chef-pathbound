import React from "react";
import { Id } from "../../convex/_generated/dataModel";

type CampaignCardProps = {
  id: Id<"campaigns">;
  name: string;
  theme: string[];
  difficulty: string;
  targetScore: number;
  currentScore: number;
  status: "pending" | "resolved" | "voting";
  playerCount: number;
  chapters: number;
  createdAt: number;
  onSelect: (id: Id<"campaigns">) => void;
  isUserInCampaign: boolean;
  isFinished: boolean;
};

export function CampaignCard({
  id,
  name,
  theme,
  difficulty,
  targetScore,
  currentScore,
  status,
  playerCount,
  chapters,
  createdAt,
  onSelect,
  isUserInCampaign,
  isFinished
}: CampaignCardProps) {
  return (
    <div
      className={`bg-yellow-50 border-2 border-yellow-400 rounded-xl p-3 mb-6 shadow-lg cursor-pointer hover:shadow-xl hover:bg-yellow-100 transition-all group`}
      onClick={() => onSelect(id)}
    >
      {/* Header: Name and Status */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-yellow-900 group-hover:text-yellow-700 transition-colors">{name}</h2>
        <span className={`capitalize px-3 py-1 text-sm rounded-full font-semibold border-2 ${status === "pending" ? "bg-yellow-100 text-yellow-800 border-yellow-400" : status === "voting" ? "bg-green-100 text-green-800 border-green-400" : "bg-red-100 text-red-800 border-red-400"}`}>
          {status}
        </span>
      </div>

      {/* Themes as badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {theme && theme.length > 0 ? (
          theme.map((t, idx) => (
            <span
              key={idx}
              className="bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-medium border border-yellow-400"
            >
              {t}
            </span>
          ))
        ) : (
          <span className="text-yellow-600 text-xs italic">No theme</span>
        )}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-3">
        <div>
          <div className="text-xs text-yellow-700">Difficulty</div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold border-2 
              ${difficulty.toLowerCase() === "easy" ? "bg-green-100 text-green-800 border-green-400" : ""}
              ${difficulty.toLowerCase() === "medium" ? "bg-yellow-100 text-yellow-800 border-yellow-400" : ""}
              ${difficulty.toLowerCase() === "hard" ? "bg-red-100 text-red-800 border-red-400" : ""}
            `}
          >
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </span>
        </div>
        <div>
          <div className="text-xs text-yellow-700">Players</div>
          <div className="text-base font-semibold text-yellow-900">{playerCount}</div>
        </div>
        <div>
          <div className="text-xs text-yellow-700">Chapters</div>
          <div className="text-base font-semibold text-yellow-900">{chapters}</div>
        </div>
        <div>
          <div className="text-xs text-yellow-700">Created</div>
          <div className="text-base text-yellow-900 font-medium min-w-max">
            {new Date(createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Progress bar and button row */}
      <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-4">
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-yellow-700 font-medium">Progress</span>
            <span className="text-xs text-yellow-700 font-medium">{currentScore} / {targetScore}</span>
          </div>
          <div className="w-full bg-yellow-200 rounded-full h-4 border border-yellow-400 relative">
            <div
              className="bg-yellow-400 h-4 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.round((currentScore / (targetScore || 1)) * 100))}%` }}
            ></div>
          </div>
        </div>
        <button
          className="mt-3 md:mt-0 md:ml-4 px-4 py-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 font-semibold rounded-lg border border-yellow-500 transition-all shadow group-hover:shadow-md whitespace-nowrap"
          onClick={e => { e.stopPropagation(); onSelect(id); }}
          disabled={isFinished}
        >
          {isFinished ? "Campaign Finished" : isUserInCampaign ? "Continue Campaign" : "Join Campaign"}
        </button>
      </div>
    </div>
  );
}

