import React, { useEffect, useState } from "react";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type Option = { option: string; id: number };
type StepWithoutOptionValue = Omit<Doc<'campaignSteps'>, 'options'> & {
  options: Omit<Doc<'campaignSteps'>['options'][number], 'value'>[];
};
type VotePanelProps = {
  selectedCampaignUser: Doc<'campaignUsers'>;
  options: Option[];
  onVote: (index: number) => void;
  expiresAt: number;
  resolvedOption: number | null | undefined;
  isResolved: boolean;
  currentStep: StepWithoutOptionValue;
  isVoting: boolean;
};

export function VotePanel({
  selectedCampaignUser,
  options,
  onVote,
  expiresAt,
  isResolved,
  currentStep,
  isVoting
}: VotePanelProps) {
  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
  );
  const allStepVotes = useQuery(api.campaigns.getVotesStep, { campaignStepId: currentStep._id });

  useEffect(() => {
    if (isResolved) return;
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
    }, 500);
    return () => clearInterval(interval);
  }, [expiresAt, isResolved]);


  return (
    <div className="">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-yellow-800">
          {isResolved ? "The story continues... Get ready for the next path!" : currentStep.status === "pending" ? "Choose a path now to help continue the campaign!" : "Choose the path wisely to lead the campaign!"}
        </span>
      </div>
      <div>
        {/* Countdown Timer Progress Bar */}
        {(() => {
          const totalDuration = 60; // seconds
          const stepStart = currentStep._creationTime;
          const now = Date.now();
          const elapsed = Math.max(0, Math.floor((now - stepStart) / 1000));
          const left = Math.max(0, totalDuration - elapsed);
          const percent = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));

          return (
            <div className="w-full my-2">
              <div className="relative w-full h-4 bg-yellow-100 rounded-full overflow-hidden border border-yellow-300 text-xs md:text-sm md:h-5">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-400 to-yellow-200 transition-all"
                  style={{ width: `${100 - percent}%` }}
                />
                <div className="absolute w-full h-full flex items-center justify-center font-semibold text-yellow-900">
                  {currentStep.status === "pending" ? 'Vote Pending' : currentStep.status === "resolved" ? 'Voting ended' : `${left}s left`}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const voteCount = allStepVotes?.filter(v => v.selectedOptionId === opt.id) || []
          const myVote = allStepVotes?.find(v => v.userId === selectedCampaignUser.userId)
          return(
          <button
            key={opt.id}
            className={`w-full flex items-center justify-between gap-2 py-1 px-3 rounded border-2 text-left font-semibold transition-all text-sm border-yellow-400 hover:bg-yellow-200 disabled:opacity-75 disabled:pointer-events-none
              ${myVote !== undefined && myVote.selectedOptionId === opt.id ? "border-green-500 bg-yellow-200" : ""}
            `}
            onClick={() => !isResolved && onVote(opt.id)}
            disabled={isResolved || myVote !== undefined || isVoting}
          >
            <p>
              {opt.option}
            </p>
            <span className={"text-sm font-semibold min-h-8 min-w-8 flex items-center justify-center bg-white border-2 border-red-500 text-red-500 rounded-full"}>
              {voteCount.length}
            </span>
          </button>
        )})}
      </div>
    </div>
  );
}
