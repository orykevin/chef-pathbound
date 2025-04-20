import React, { useState } from "react";
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
  endingStory: string | undefined;
  backgroundStory: string | undefined;
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
  isFinished,
  endingStory,
  backgroundStory
}: CampaignCardProps) {

  const [showRecapModal, setShowRecapModal] = useState(false);
  const isUserFinishedCampaign = isFinished && isUserInCampaign;
  return (
    <div
      className={`bg-yellow-50 border-2 border-yellow-400 rounded-xl p-3 pb-1 shadow-lg cursor-pointer hover:shadow-xl hover:bg-yellow-100 transition-all group`}
    >
      {/* Header: Name and Status */}
      <div className="flex justify-between items-start mb-2 gap-2">
        <h2 className="text-2xl font-bold text-yellow-900 group-hover:text-yellow-700 transition-colors">{name}</h2>
        {isFinished ? <span className={`capitalize px-3 py-1 text-sm rounded-full font-semibold border-2 bg-blue-100 text-blue-800 border-blue-400`}>
          Finished
        </span> : <span className={`capitalize px-3 py-1 text-sm rounded-full font-semibold border-2 ${status === "pending" ? "bg-yellow-100 text-yellow-800 border-yellow-400" : status === "voting" ? "bg-green-100 text-green-800 border-green-400" : "bg-red-100 text-red-800 border-red-400"}`}>
          {status}
        </span>}
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
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
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
        <div className="flex flex-col md:flex-row md:items-center md:gap-3 md:min-w-[380px]">
          {(isUserFinishedCampaign || !isFinished) && <button
            className="w-full mt-3 md:mt-0 px-4 py-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 font-semibold rounded-lg border border-yellow-500 transition-all shadow group-hover:shadow-md whitespace-nowrap disabled:opacity-75 disabled:pointer-events-none"
            onClick={e => {
              e.stopPropagation();
              onSelect(id);
            }}
            disabled={isFinished && !isUserFinishedCampaign}
          >
            {isUserFinishedCampaign ? "See Recap" : isFinished ? "Campaign Finished" : isUserInCampaign ? "Continue Campaign" : "Join Campaign"}
          </button>}
          {<button onClick={() => setShowRecapModal(true)} className="w-full mt-3 md:mt-0 px-4 py-2 bg-yellow-50 hover:bg-yellow-200 text-yellow-900 font-semibold rounded-lg border border-yellow-600 transition-all shadow group-hover:shadow-md whitespace-nowrap">{isFinished ? 'See Ending Story' : 'See Background Story'}</button>}
        </div>
      </div>

      {/* Recap Modal Popup */}
      {showRecapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-auto">
          <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-[95%] max-w-md relative">
            <button
              className="absolute top-3 right-6 text-gray-500 hover:text-gray-800 text-xl font-bold"
              onClick={() => setShowRecapModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-yellow-900">{isFinished ? 'Campaign Completed' : 'Campaign Background'}</h3>
            <div className="text-yellow-800 mb-4">
              <h2 className="text-lg font-semibold mb-2">Background Story :</h2>
              <p className="text-yellow-900">{backgroundStory}</p>
            </div>
            <div className="text-yellow-800 mb-4">
              {isFinished && <h2 className="text-lg font-semibold mb-2">Ending Story :</h2>}
              <p className="text-yellow-900">{isFinished ? endingStory : backgroundStory}</p>
            </div>
            
            <button
              className="mt-2 px-4 py-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 font-semibold rounded-lg border border-yellow-500 transition-all"
              onClick={() => setShowRecapModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

