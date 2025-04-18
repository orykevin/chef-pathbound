import React from "react";

type UserStatsPanelProps = {
  stats: {
    campaignsJoined: number;
    votesCast: number;
    contributions: number;
    lastActive: number;
  } | null;
};

export function UserStatsPanel({ stats }: UserStatsPanelProps) {
  if (!stats) return null;
  return (
    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mt-4">
      <h4 className="font-bold text-yellow-900 mb-2">Your Tavern Record</h4>
      <ul className="text-yellow-800 text-sm">
        <li>Campaigns Joined: {stats.campaignsJoined}</li>
        <li>Votes Cast: {stats.votesCast}</li>
        <li>Contributions: {stats.contributions}</li>
        <li>
          Last Active:{" "}
          {new Date(stats.lastActive).toLocaleString()}
        </li>
      </ul>
    </div>
  );
}
