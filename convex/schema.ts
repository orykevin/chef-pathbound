import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  campaigns: defineTable({
    name: v.string(),
    theme: v.array(v.string()),
    background: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    isFinished: v.boolean(),
    deadlineDate: v.number(),
  }),
  campaignUsers: defineTable({
    userId: v.id("users"),
    campaignId: v.id("campaigns"),
    totalVotes: v.number(),
    totalContributions: v.number(),
  }).index("byCampaign", ["campaignId"]),
  campaignProgress: defineTable({
    campaignId: v.id("campaigns"),
    totalPlayer: v.number(),
    currentStep: v.number(),
    targetScore: v.number(),
    currentScore: v.number(),
  }).index("byCampaign", ["campaignId"]),
  campaignSteps: defineTable({
    campaignId: v.id("campaigns"),
    plot: v.string(),
    step: v.number(),
    options: v.array(v.object({
      id: v.number(),
      option: v.string(),
      value: v.number(),
    }))
  }).index("byCampaign", ["campaignId", "step"]),
  campaignVotes: defineTable({
    userId: v.id("users"),
    campaignUserId: v.id("campaignUsers"),
    campaignStepId: v.id("campaignSteps"),
    selectedOptionId: v.number(),
  }).index("byCampaignStep", ["campaignStepId", "userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
