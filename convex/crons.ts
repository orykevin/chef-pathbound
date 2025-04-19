import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "generate campaign",
  { hours: 24 }, // every 24 hours
  internal.campaigns.generateCampaign,
  {},
);

export default crons;