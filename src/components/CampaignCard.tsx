import React from "react";
import { Id } from "../../convex/_generated/dataModel";

type CampaignCardProps = {
  id: Id<"campaigns">;
  name: string;
  theme: string;
  difficulty: string;
  targetScore: number;
  currentScore: number;
  isActive: boolean;
  playerCount: number;
  onSelect: (id: Id<"campaigns">) => void;
};

export function CampaignCard({
  id,
  name,
  theme,
  difficulty,
  targetScore,
  currentScore,
  isActive,
  playerCount,
  onSelect,
}: CampaignCardProps) {
  return (
    <div
      className={`bg-yellow-100 border-2 border-yellow-700 rounded-lg p-4 mb-4 shadow-md cursor-pointer hover:bg-yellow-200 transition-all`}
      onClick={() => onSelect(id)}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-yellow-900">{name}</h3>
        <span className="text-sm bg-yellow-300 px-2 py-1 rounded">{theme}</span>
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-yellow-800">Difficulty: {difficulty}</span>
        <span className="text-xs text-yellow-800">
          Score: {currentScore}/{targetScore}
        </span>
        <span className="text-xs text-yellow-800">
          Players: {playerCount}
        </span>
        <span className={`text-xs px-2 py-1 rounded ${isActive ? "bg-green-200" : "bg-red-200"}`}>
          {isActive ? "Active" : "Completed"}
        </span>
      </div>
    </div>
  );
}
