import React, { useState } from "react";
import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { TavernLayout } from "./components/TavernLayout";
import { CampaignCard } from "./components/CampaignCard";
import { VotePanel } from "./components/VotePanel";
import { UserStatsPanel } from "./components/UserStatsPanel";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-yellow-900/90 backdrop-blur-sm p-4 flex justify-between items-center border-b border-yellow-700">
        <h2 className="text-xl font-bold text-yellow-100 font-serif">PathBound Tavern</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const [selectedCampaign, setSelectedCampaign] = useState<Id<"campaigns"> | null>(null);
  const campaigns = useQuery(api.campaigns.getAllCampaign) || [];
  const userStats = useQuery(api.campaigns.userStats);
  const joinCampaign = useMutation(api.campaigns.join);

  if (selectedCampaign) {
    return (
      <TavernLayout>
        <CampaignScreen
          campaignId={selectedCampaign}
          onBack={() => setSelectedCampaign(null)}
        />
      </TavernLayout>
    );
  }

  return (
    <TavernLayout>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-yellow-900 mb-2">Available Campaigns</h2>
        <p className="text-yellow-800 mb-4">
          Choose a campaign to join the adventure!
        </p>
        <div>
          {campaigns.length === 0 && (
            <div className="text-yellow-700">No campaigns yet. (Add via DB for now)</div>
          )}
          {campaigns.map((c) => (
            <CampaignCard
              key={c._id}
              id={c._id}
              name={c.name}
              theme={c.theme}
              difficulty={c.difficulty}
              targetScore={c.progress?.targetScore ?? 0}
              currentScore={c.progress?.currentScore ?? 0}
              isActive={!c.isFinished}
              playerCount={c.progress?.totalPlayer ?? 1}
              onSelect={async (id) => {
                await joinCampaign({ campaignId: id });
                setSelectedCampaign(id);
              }}
            />
          ))}
        </div>
      </div>
      <UserStatsPanel stats={userStats} />
      <Unauthenticated>
        <div className="mt-8">
          <SignInForm />
        </div>
      </Unauthenticated>
    </TavernLayout>
  );
}

function CampaignScreen({
  campaignId,
  onBack,
}: {
  campaignId: Id<"campaigns">;
  onBack: () => void;
}) {
  const step = useQuery(api.campaigns.currentStep, { campaignId });
  const votes = useQuery(
    step ? api.campaigns.votesForStep : undefined,
    step ? { campaignStepId: step._id } : undefined
  );
  const progress = useQuery(api.campaigns.campaignProgress, { campaignId });
  const voteMutation = useMutation(api.campaigns.vote);

  // Find user's vote
  const userId = undefined; // TODO: get from auth context if needed
  const userVote =
    votes && userId
      ? votes.find((v) => v.userId === userId)?.optionIndex ?? null
      : null;

  if (!step || !progress) {
    return (
      <div className="text-yellow-800">Loading campaign...</div>
    );
  }

  return (
    <div>
      <button
        className="mb-4 px-4 py-2 bg-yellow-200 border border-yellow-700 rounded text-yellow-900 hover:bg-yellow-300"
        onClick={onBack}
      >
        ← Back to Tavern
      </button>
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-yellow-900 mb-2">Story</h3>
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
          <p className="text-yellow-800">{step.prompt}</p>
        </div>
      </div>
      <VotePanel
        options={step.options}
        onVote={async (idx) => {
          await voteMutation({ campaignStepId: step._id, optionIndex: idx });
        }}
        expiresAt={step.expiresAt}
        resolvedOption={step.resolvedOption}
        isResolved={step.isResolved}
        userVote={userVote}
      />
      <div className="mt-6">
        <h4 className="font-bold text-yellow-900">Campaign Progress</h4>
        <div className="flex gap-4 mt-2">
          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg px-4 py-2">
            Score: {progress.currentScore}/{progress.targetScore}
          </div>
          <div className={`px-4 py-2 rounded-lg border-2 ${progress.isActive ? "border-green-400 bg-green-100" : "border-red-400 bg-red-100"}`}>
            {progress.isActive ? "Active" : "Completed"}
          </div>
        </div>
      </div>
    </div>
  );
}
