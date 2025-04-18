import React, { useEffect, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

type Option = { text: string; value: number };
type VotePanelProps = {
  options: Option[];
  onVote: (index: number) => void;
  expiresAt: number;
  resolvedOption: number | null | undefined;
  isResolved: boolean;
  userVote: number | null;
};

export function VotePanel({
  options,
  onVote,
  expiresAt,
  resolvedOption,
  isResolved,
  userVote,
}: VotePanelProps) {
  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
  );

  useEffect(() => {
    if (isResolved) return;
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
    }, 500);
    return () => clearInterval(interval);
  }, [expiresAt, isResolved]);

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-yellow-800">Vote for the next action!</span>
        <span className="text-sm text-yellow-700">
          {isResolved ? "Voting ended" : `Time left: ${timeLeft}s`}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {options.map((opt, idx) => (
          <button
            key={idx}
            className={`w-full py-2 px-4 rounded border-2 text-left font-semibold transition-all
              ${
                userVote === idx
                  ? "bg-yellow-400 border-yellow-700 text-yellow-900"
                  : "bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200"
              }
              ${isResolved && resolvedOption === idx ? "ring-2 ring-green-500" : ""}
            `}
            onClick={() => !isResolved && onVote(idx)}
            disabled={isResolved || userVote !== null}
          >
            {opt.text}{" "}
            <span className="ml-2 text-xs text-yellow-700">
              {opt.value === 1 ? "🟢" : opt.value === 0 ? "🟡" : "🔴"}
            </span>
          </button>
        ))}
      </div>
      {userVote !== null && !isResolved && (
        <div className="mt-2 text-sm text-yellow-800">You voted!</div>
      )}
    </div>
  );
}
