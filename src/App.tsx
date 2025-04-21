import React, { useMemo, useState } from "react";
import { Unauthenticated, useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { TavernLayout } from "./components/TavernLayout";
import { CampaignCard } from "./components/CampaignCard";
import { VotePanel } from "./components/VotePanel";
import { Doc, Id } from "../convex/_generated/dataModel";
import { useAuthActions } from "@convex-dev/auth/react";
import { cn } from "./lib/utils";

type CampaignDataType = Doc<"campaigns"> & {
  progress: Doc<"campaignProgress"> | null;
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { signOut } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const userData = useQuery(api.auth.loggedInUser, isAuthenticated ? {} : 'skip');
  const [selectedCampaign, setSelectedCampaign] = useState<Id<"campaigns"> | null>(null);

  // Countdown timer logic
  const campaigns = useQuery(api.campaigns.getAllCampaign, isAuthenticated ? {} : 'skip');
  const [countdown, setCountdown] = React.useState<string>("");

  React.useEffect(() => {
    if (!campaigns || campaigns.length === 0) {
      setCountdown("");
      return;
    }
    // Find newest campaign
    const newest = [...campaigns].sort((a, b) => b._creationTime - a._creationTime)[0];
    const targetTime = newest._creationTime + 24 * 60 * 60 * 1000;
    const update = () => {
      const now = Date.now();
      const diff = targetTime - now;
      if (diff <= 0) {
        setCountdown("Now!");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [campaigns]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-100 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-700"></div>
          <span className="text-yellow-700 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if(!isAuthenticated && !isLoading) return <SignInForm />;
  
  if(isAuthenticated && !isLoading && userData && !userData.name) return <NameForm />;

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {isAuthenticated && countdown && !selectedCampaign && (
        <div className="w-full bg-yellow-200 text-yellow-900 text-center font-semibold py-2 border-b border-yellow-400">
          New campaign will be added in: <span className="font-mono">{countdown}</span>
        </div>
      )}
      {isAuthenticated && <header className="sticky top-0 z-10 bg-yellow-900/90 backdrop-blur-sm p-1 md:p-3 md:px-8 flex justify-between items-center border-b border-yellow-700">
        <div className="flex items-center gap-2">
          {/* Sidebar toggle button, only on mobile */}
          {isAuthenticated && <button
            className="md:hidden p-2 rounded hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            {/* Hamburger icon */}
            <svg className="w-6 h-6 text-yellow-100" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>}
          <h2 className="text-xl font-bold text-yellow-100 font-serif">PathBound</h2>
        </div>
        <div className="hidden md:flex gap-2">
          <button className="px-4 py-2 rounded-lg transition-colors bg-yellow-500 text-white" onClick={() => setSelectedCampaign(null)}>Campaigns</button>
          <SignOutButton />
        </div>
      </header>}
      <div className="flex flex-1">
        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/40 md:hidden h-[30vh]" onClick={() => setSidebarOpen(false)} />
        )}
        <aside
          className={`fixed z-30 top-0 left-0 h-full w-64 bg-yellow-200 border-r-2 border-yellow-400 p-4 transform transition-transform duration-200 md:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          style={{ minHeight: '100vh' }}
        >
          <div className="mb-8 flex justify-between items-center">
            <span className="font-bold text-yellow-900 text-lg">Pathbound</span>
            <button
              className="p-1 rounded hover:bg-yellow-300"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5 text-yellow-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col gap-2">
            <button className="text-left px-2 py-1 rounded hover:bg-yellow-300 text-yellow-900 font-semibold" onClick={() => setSelectedCampaign(null)}>Campaigns</button>
            <button className="text-left px-2 py-1 rounded hover:bg-yellow-300 text-yellow-900 font-semibold" onClick={() => void signOut()}>Sign out</button>
          </nav>
        </aside>
        {/* Main content */}
        <main className={cn("flex-1 flex items-start justify-center p-2 md:p-8 h-[calc(100vh-92px)] md:h-[calc(100vh-112px)] overflow-auto", selectedCampaign && "h-[calc(100vh-74px)]")}>
          <div className="w-full max-w-2xl md:max-w-4xl lg:max-w-6xl md:p-3 h-full mx-auto">
            <Content selectedCampaign={selectedCampaign} setSelectedCampaign={setSelectedCampaign} name={userData?.name ?? ""} />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

function NameForm() {
  const submitName = useMutation(api.auth.submitName);
  return (
    <div className="flex flex-col gap-2 min-h-screen items-center justify-center pb-16">
      <h1 className="text-3xl font-bold text-yellow-900 mb-2">Enter your name</h1>
      <h4 className="text-yellow-700 mb-3">So the tale may remember you.</h4>
      <form className="flex flex-col gap-2  max-w-[320px] sm:max-w-[420px] mx-auto" onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get("name");
        if (!name) return;
        void submitName({ name: name.toString() });
      }}>
        <input
            className="rounded-lg border border-yellow-300 px-4 py-2 bg-yellow-50 text-yellow-900 placeholder-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-600 transition"
            type="text"
            name="name"
            placeholder="Enter your name"
            required
          />
        <button
          className="px-4 py-2 rounded-lg transition-colors bg-yellow-500 text-white"
          type="submit"
        >
          Submit
        </button>
      </form>
    </div>
  );
}

function Content({selectedCampaign, setSelectedCampaign, name}: {selectedCampaign: Id<"campaigns"> | null, setSelectedCampaign: (id: Id<"campaigns"> | null) => void, name: string | null}) {
  const { isAuthenticated } = useConvexAuth();

  const campaigns = useQuery(api.campaigns.getAllCampaign, isAuthenticated ? {} : 'skip')
  const userCampaings = useQuery(api.campaigns.getCampaignUser, isAuthenticated ? {} : 'skip')

  const userJoinCampaign = useMutation(api.campaigns.userJoinCampaign);

  const selectedCampaignData = useMemo(() => {
    if (!selectedCampaign) return null;
    return campaigns?.find(c => c._id === selectedCampaign);
  }, [selectedCampaign, campaigns]);

  const selectedCampaignUser = useMemo(() => {
    if (!selectedCampaign) return null;
    return userCampaings?.find(c => c.campaignId === selectedCampaign);
  }, [selectedCampaign, userCampaings]);

  if(!campaigns || !userCampaings) return(
    <div className="flex flex-col items-center gap-2">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-700"></div>
    <span className="text-yellow-700 font-medium">Loading...</span>
  </div>
  )
  
  if (selectedCampaign && selectedCampaignData && selectedCampaignUser) {
    return (
      <TavernLayout>
        <CampaignScreen
          selectedCampaignData={selectedCampaignData}
          selectedCampaignUser={selectedCampaignUser}
          onBack={() => setSelectedCampaign(null)}
        />
      </TavernLayout>
    );
  }

  return (
    <TavernLayout>
      <div className="mb-6 w-full pb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-yellow-900">Welcome {name}</h2>
        <p className="text-yellow-800 mb-4">
          Choose a campaign to join the adventure!
        </p>
        <div className="flex flex-col gap-2 md:gap-4">
          {campaigns.length === 0 && (
            <div className="text-yellow-700 w-full">No campaigns yet. (Add via DB for now)</div>
          )}
          {campaigns.map((c) => {
            const isUserInCampaign = userCampaings?.some(u => u.campaignId === c._id);
            const selectHandler = () => {
              if (isUserInCampaign) {
                setSelectedCampaign(c._id);
              } else {
                userJoinCampaign({ campaignId: c._id }).then((res) => {
                  if (res) {
                    setSelectedCampaign(c._id);
                  }
                });
              }
            };
            return(
            <CampaignCard
              key={c._id}
              id={c._id}
              name={c.name}
              theme={c.theme}
              chapters={c.progress?.currentStep ?? 0}
              difficulty={c.difficulty}
              targetScore={c.progress?.targetScore ?? 0}
              currentScore={c.progress?.currentScore ?? 0}
              status={c.progress?.status ?? "pending"}
              playerCount={c.progress?.totalPlayer ?? 1}
              onSelect={selectHandler}
              createdAt={c._creationTime}
              isUserInCampaign={isUserInCampaign}
              isFinished={c.isFinished}
              endingStory={c.endingStory}
              backgroundStory={c.background}
            />
          )})}
        </div>
      </div>
    </TavernLayout>
  );
}

function CampaignScreen({
  selectedCampaignData,
  selectedCampaignUser,
  onBack,
}: {
  selectedCampaignData: CampaignDataType;
  selectedCampaignUser: Doc<"campaignUsers">;
  onBack: () => void;
}) {
  const [openUserTab, setOpenUserTab] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const steps = useQuery(api.campaigns.getCampaignSteps, { campaignId: selectedCampaignData._id });
  const latestStep = useMemo(() => steps?.[steps?.length - 1], [steps]);

  const allPlayer = useQuery(api.campaigns.getAllCampaignUser, { campaignId: selectedCampaignData._id });

  // Scroll to bottom of story-container on steps change
  React.useEffect(() => {
    const el = document.getElementById('story-container');
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [steps]);

  const voteMutation = useMutation(api.campaigns.selectVoteStep);

  const handleSelectVote = (index: number) => {
    if (!latestStep || selectedCampaignData.isFinished) return;
    setIsVoting(true);
    voteMutation({ campaignStepId: latestStep._id, optionId: index}).then((res) => {
      setIsVoting(false);
    })
  };

  if (!latestStep) {
    return (
      <div className="text-yellow-800">Loading campaign...</div>
    );
  }

  return (
    <div className="relative h-full flex flex-col gap-2 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
        <button
        className="px-2 py-1 bg-yellow-200 border border-yellow-700 rounded text-yellow-900 hover:bg-yellow-300"
        onClick={onBack}
      >
        ←
      </button>
        </div>
      
      <div className="flex gap-3">
      <button className="px-2 py-1 bg-yellow-200 border border-yellow-700 rounded text-yellow-900 hover:bg-yellow-300" onClick={() => setOpenUserTab((prev) => !prev)}>{openUserTab ? 'Hide User List' : 'User List'}</button>
        <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg px-2 py-1">
        Score {selectedCampaignData.progress?.currentScore}/{selectedCampaignData.progress?.targetScore}
        </div>
      </div>
      </div>

      {allPlayer && openUserTab && <div className="absolute top-10 right-0 w-full md:w-1/2 md:top-16 h-[50vh] overflow-y-auto bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 z-10">
          <div className="text-sm font-semibold items-center justify-between mb-2 grid grid-cols-12 border-b border-yellow-400 pb-2">
            <p className="col-span-6">Name</p>
            <p className="col-span-3">Votes</p>
            <p className="col-span-3">Impacts</p>
          </div>
          {allPlayer.map((playerCampaign, i) => {
            const totalVotes = playerCampaign.totalVotes;
            const totalContributions = playerCampaign.totalContributions;
            return(
            <div className=" gap-2 mb-2 grid grid-cols-12 pb-1 border-b border-yellow-400">
              <p className="col-span-6">{playerCampaign.name ?? `Player ${playerCampaign._id.slice(0, 5)}`}</p>
              <p className="col-span-3">{totalVotes}</p>
              <p className="col-span-3">{totalContributions}</p>
            </div>
          )})}
      </div>}
      
      <div className="relative h-full flex flex-col md:flex-row gap-2 w-full">
        {/* Story container: full width */}
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 w-full h-full overflow-y-auto" id="story-container">
          {steps?.map((step) => {
            const isResolved = step.status === "resolved";
            const selectedOptions = step.options.find(option => option.id === step.selectedOptionId);
            return(
            <div key={step._id}>
              <div className="flex items-center justify-center mt-2">
                <span className="border-b-2 border-yellow-400 w-full"/>
                <span className="text-center min-w-max px-3 text-sm">{step.step > 1 ? `Chapter ${step.step}` : "First story"}</span>
                <span className="border-b-2 border-yellow-400 w-full"/>
              </div>
              <p className="text-yellow-800 mt-2">{step.plot}</p>
              {isResolved && <div className="relative bg-yellow-200 font-semibold text-yellow-800 mt-2 border-2 border-yellow-400 rounded-lg p-1 px-2">
                <p>{isResolved && selectedOptions && `${selectedOptions.option}`}</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <p className="text-sm bg-yellow-100 rounded py-0.5 px-2 border border-yellow-400">Total Vote : {step.selectedCount}</p>
                  <p className="text-sm bg-yellow-100 rounded py-0.5 px-2 border border-yellow-400">Story Value: {step.selectedValue}</p>
                </div>
              </div>}
            </div>
          )})}
        </div>
        {/* Vote container: full width */}
        <div className="w-full min-h-max flex overflow-y-auto py-2 md:p-3">
          {selectedCampaignData.isFinished && <div>
            <h2 className="text-2xl font-bold text-yellow-900 text-center">Campaign Complete!</h2>
            <p className="text-yellow-800 text-center">Our Journey has come to an end.</p>
            <div className="relative border-y py-3 border-yellow-400 text-center my-2">
              <p>{selectedCampaignData.endingStory}</p>
            </div>
            <div className="flex gap-2">
              <p className="text-sm">
                Total Chapters: <b>{selectedCampaignData.progress?.currentStep}</b>
              </p>
              <p className="text-sm">
                Total Player: <b>{selectedCampaignData.progress?.totalPlayer}</b>
              </p>
            </div>
          </div>}
          {latestStep && !selectedCampaignData.isFinished && <VotePanel
            selectedCampaignUser={selectedCampaignUser}
            options={latestStep.options}
            onVote={handleSelectVote}
            expiresAt={latestStep._creationTime + 60000}
            resolvedOption={latestStep.selectedOptionId}
            isResolved={latestStep.status === "resolved"}
            currentStep={latestStep}
            isVoting={isVoting}
          />}
        </div>
      </div>
    </div>
  );
}
