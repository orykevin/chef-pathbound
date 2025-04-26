import { query, internalMutation, internalAction, MutationCtx, QueryCtx, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { api, internal } from "./_generated/api";
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai'
import * as z from 'zod'
import { getAuthUserId } from "@convex-dev/auth/server";

const VOTE_TIME = 60000;
const GENRE_LISTS = [
  "Fantasy",
  "Mystery",
  "Horror",
  "Romance",
  "Thriller",
  "Sci-Fi",
  "Comedy",
  "Drama",
  "Cyberpunk",
  "Post-apocalyptic",
  "Noir",
  "Supernatural",
  "Psychological",
  "RPG",
];

export const isAuthenticatedMiddleware = async (ctx: MutationCtx | QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Not authenticated");

  return userId;
};

export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export const difficulty = ["easy", "medium", "hard"];

export const diffcultyTargetScore = {
  easy: 10,
  medium: 25,
  hard: 50,
}

const google = createGoogleGenerativeAI({
  // custom settings
  apiKey: process.env.CONVEX_GOOGLE_AI_API_KEY
});

const model = google('gemini-2.0-flash-001', {
  structuredOutputs: false,
});

// campaigns
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("campaigns").collect();
  },
});

export const getCampaignHistory = query({
  args: {},
  handler: async (ctx) => {
    const campaigns = await ctx.db.query("campaigns").collect();
    return campaigns
  },
});

export const getAllCampaign = query({
  args: {},
  handler: async (ctx) => {
    const campaigns = await ctx.db.query("campaigns").order("desc").collect();
    return await Promise.all(campaigns.map(async (campaign) => {
      const progress = await ctx.db.query("campaignProgress").withIndex("byCampaign", (q) => q.eq("campaignId", campaign._id)).first();
      return {
        ...campaign,
        progress,
      };
    }));
  },
});

export const generateCampaign = internalAction({
  handler: async (ctx) => {

    const prevCampaigns = await ctx.runQuery(api.campaigns.getCampaignHistory);
    const randomDifficulty = difficulty[Math.floor(Math.random() * difficulty.length)];
    const randomTheme = shuffleArray(GENRE_LISTS)
    const theme1 = randomTheme[0];
    const theme2 = randomTheme[1];
    const prompt = `
    Previous Campaigns:
    ${prevCampaigns.map(c => `Name: ${c.name}, Theme: ${c.theme.join(', ')}, Difficulty: ${c.difficulty}`).join('\n')}
    
      You are a campaign generator. Generate a campaign with a name, theme with ${randomDifficulty} difficulty. 
      THEME : ${theme1}, ${theme2}
      GENERATE :
      - generate name based on the theme/genre generated on 'name' field
      - generate a short background story about campaign on 'background' field
      - for first campaign generation, please create a plot to starting the campaign, please keep plot short up to 3 sentences max on 'plot' field
      - for first campaign generation, please create 3 options path for campaign on 'options' field
      - 3 options should be different and cover different aspect of campaign
      - please give each options a value, to track the progress, give value (-1, 0 , 1) , please do not duplicate the value for other options
      `

    const result = await generateObject({
      model: model,
      schema: z.object({
        name: z.string(),
        background: z.string(),
        plot: z.string(),
        theme: z.array(z.string()),
        options: z.array(z.object({
          option: z.string(),
          value: z.number(),
        }))
      }),
      maxRetries: 3,
      prompt: prompt,
    })

    await ctx.runMutation(internal.campaigns.createCampaign, {
      name: result.object.name,
      theme: [theme1, theme2],
      difficulty: randomDifficulty as "easy" | "medium" | "hard",
      options: result.object.options,
      plot: result.object.plot,
      background: result.object.background,
    });
  },
})

export const createCampaign = internalMutation({
  args: {
    name: v.string(),
    theme: v.array(v.string()),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    options: v.array(v.object({
      option: v.string(),
      value: v.number(),
    })),
    plot: v.string(),
    background: v.string(),
  },
  handler: async (ctx, { name, theme, difficulty, options, plot, background }) => {
    const campaignId = await ctx.db.insert("campaigns", {
      name,
      theme,
      difficulty,
      isFinished: false,
      deadlineDate: Date.now() + 60 * 1000,
      background,
    });

    await ctx.db.insert("campaignProgress", {
      campaignId,
      totalPlayer: 0,
      currentStep: 1,
      targetScore: diffcultyTargetScore[difficulty],
      currentScore: 0,
      status: "voting",
    });
    const randomedOptions = shuffleArray(options).map((option, index) => ({
      id: index + 1,
      option: option.option,
      value: option.value,
    }));

    const campaignStepId = await ctx.db.insert("campaignSteps", {
      campaignId,
      plot,
      step: 1,
      options: randomedOptions,
      status: "voting",
    })

    await ctx.scheduler.runAfter(VOTE_TIME, internal.campaigns.resolveStep, { campaignStepId });
  },
})

// campaign steps
export const getCampaignSteps = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, { campaignId }) => {
    const steps = await ctx.db.query("campaignSteps").withIndex("byCampaign", (q) => q.eq("campaignId", campaignId)).collect();
    return steps.map(s => ({
      ...s,
      options: s.options.map(o => ({
        id: o.id,
        option: o.option,
      }))
    }));
  },
})

export const getPreviousCampaignSteps = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, { campaignId }) => {
    return await ctx.db.query("campaignSteps").withIndex("byCampaign", (q) => q.eq("campaignId", campaignId)).take(20);
  },
})

export const generateCampaignStep = internalAction({
  args:{
    campaignId: v.id("campaigns"),
    campaignName: v.string(),
    campaignTheme: v.array(v.string()),
    campaignDifficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    campaignScore: v.number(),
    campaignTargetScore: v.number(),
    campaignBackground: v.string(),
  },
  handler: async (ctx, args) => {
    const prevCampaigns = await ctx.runQuery(api.campaigns.getPreviousCampaignSteps, { campaignId: args.campaignId });

    const prompt = `
    You are a campaign story generator of the campaign

    Campaign Name: ${args.campaignName},
    Campaign Theme: ${args.campaignTheme.join(', ')},
    Campaign Difficulty: ${args.campaignDifficulty},
    Campaign Current Score: ${args.campaignScore},
    Campaign Target Score: ${args.campaignTargetScore},
    Campaign Background: ${args.campaignBackground},

    Previous Plot:
    ${prevCampaigns.map(c => `Step ${c.step}: ${c.plot}, Selected option : ${c.options.find(o => o.id === c.selectedOptionId)?.option || ''}`).join('\n')}
    
    Generate :
      - please create a plot to continue the campaign, please keep plot short up to 3 sentences max on 'plot' field
      - please create 3 options path for campaign on 'options' field
      - 3 options should be different and cover different aspect of campaign
      - please give each options a value, to track the progress, give value (-1, 0 , 1) , please do not duplicate the value for other options
    `

    const result = await generateObject({
      model: model,
      schema: z.object({
        plot: z.string(),
        options: z.array(z.object({
          option: z.string(),
          value: z.number(),
        }))
      }),
      maxRetries: 3,
      prompt: prompt,
    })

    await ctx.runMutation(internal.campaigns.continueCampaignStep, {
      campaignId: args.campaignId,
      options: result.object.options,
      plot: result.object.plot,
    });
  },
})

export const continueCampaignStep = internalMutation({
  args: {
    campaignId: v.id("campaigns"),
    options: v.array(v.object({
      option: v.string(),
      value: v.number(),
    })),
    plot: v.string(),
  },
  handler: async (ctx, { campaignId, options, plot }) => {
    const campaign = await ctx.db.get(campaignId);
    if (!campaign) throw new ConvexError("Campaign not found");
    if(campaign.isFinished) throw new ConvexError("Campaign is finished");
    const campaignProgress = await ctx.db.query("campaignProgress").withIndex("byCampaign", (q) => q.eq("campaignId", campaignId)).first();
    if (!campaignProgress) throw new ConvexError("Campaign progress not found");

    await ctx.db.patch(campaignProgress._id, {
      currentStep: campaignProgress.currentStep + 1,
      status: "voting",
    })

    const randomedOptions = shuffleArray(options).map((option, index) => ({
      id: index + 1,
      option: option.option,
      value: option.value,
    }));

    const campaignStepId = await ctx.db.insert("campaignSteps", {
      campaignId,
      plot,
      step: campaignProgress.currentStep + 1,
      options: randomedOptions,
      status: "voting",
    })
    await ctx.scheduler.runAfter(VOTE_TIME, internal.campaigns.resolveStep, { campaignStepId });
  },
})

// campaign votes
export const getRecentVotes = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, { campaignId }) => {
    const latestStep = await ctx.db.query("campaignSteps").withIndex("byCampaign", (q) => q.eq("campaignId", campaignId)).first();
    if (!latestStep) throw new ConvexError("Campaign not found");
    return await ctx.db.query("campaignVotes").withIndex("byCampaignStep", (q) => q.eq("campaignStepId", latestStep._id)).collect();
  },
})

// resolve step
export const resolveStep = internalMutation({
  args: {
    campaignStepId: v.id("campaignSteps"),
  },
  handler: async (ctx, { campaignStepId }) => {
    const step = await ctx.db.get(campaignStepId);
    if (!step) throw new ConvexError("Campaign step not found");
    if (step.status !== "voting") throw new ConvexError("Campaign step is not in voting state");
    const campaign = await ctx.db.get(step.campaignId);
    if (!campaign) throw new ConvexError("Campaign not found");
    if(campaign.isFinished) throw new ConvexError("Campaign is finished");
    const campaignProgress = await ctx.db.query("campaignProgress").withIndex("byCampaign", (q) => q.eq("campaignId", campaign._id)).first();
    if (!campaignProgress) throw new ConvexError("Campaign progress not found");
    const votes = await ctx.db.query("campaignVotes").withIndex("byCampaignStep", (q) => q.eq("campaignStepId", campaignStepId)).collect();
    // if no vote, set status to pending
    if(votes.length === 0){
      await ctx.db.patch(campaignStepId, {
        status: "pending",
      });
      await ctx.db.patch(campaignProgress._id, {
        status: "pending",
      });
      return "Vote not found, set progress to pending"
    }
    
    let selectedCount : {[key: number]: number} = {}

    votes.map((vote) => {
      if (!selectedCount[vote.selectedOptionId]) {
        selectedCount[vote.selectedOptionId] = 0;
      }
      selectedCount[vote.selectedOptionId]++;
    })

    const selectedOptionId = Object.keys(selectedCount).reduce((a, b) => selectedCount[Number(a)] > selectedCount[Number(b)] ? a : b);
    const selectedOption = step.options.find(option => option.id === Number(selectedOptionId));
    if (!selectedOption) throw new ConvexError("Selected option not found");
    
    // update campaign step if vote resolved
    await ctx.db.patch(campaignStepId, {
      status: "resolved",
      selectedOptionId: Number(selectedOptionId),
      selectedValue: selectedOption.value,
      selectedCount: selectedCount[Number(selectedOptionId)],
    });
    // update campaign progress
    await ctx.db.patch(campaignProgress._id, {
      status: "resolved",
      currentScore: campaignProgress.currentScore + selectedOption.value,
    });
    // update campaign users
    const allVotes = await ctx.db.query("campaignVotes").withIndex("bySelectedOption", (q) => q.eq("campaignStepId", campaignStepId).eq("selectedOptionId", Number(selectedOptionId))).collect();
    await Promise.all(allVotes.map(async (vote) => {
      const campaignUser = await ctx.db.get(vote.campaignUserId)
      if(!campaignUser) return ;
      await ctx.db.patch(campaignUser._id, {
        totalContributions: campaignUser.totalContributions + selectedOption.value,
      });
    }));
    // if current score + selected option value >= target score, set campaign to finished
    const isGoodEnding = campaignProgress.currentScore + selectedOption.value >= campaignProgress.targetScore
    const isBadEnding = campaignProgress.currentScore + selectedOption.value === (campaignProgress.targetScore * -1)
    if(isGoodEnding || isBadEnding){
      await ctx.scheduler.runAfter(0, internal.campaigns.generateEndingStory, {
        campaignId: campaign._id, 
        campaignName: campaign.name, 
        campaignTheme: campaign.theme, 
        campaignDifficulty: campaign.difficulty, 
        campaignBackground: campaign.background,
        isGoodEnding : isGoodEnding,
      });
    }else{
      await ctx.scheduler.runAfter(0, internal.campaigns.generateCampaignStep, 
        { 
          campaignId: campaign._id, 
          campaignName: campaign.name, 
          campaignTheme: campaign.theme, 
          campaignDifficulty: campaign.difficulty, 
          campaignScore: campaignProgress.currentScore, 
          campaignTargetScore: campaignProgress.targetScore, 
          campaignBackground: campaign.background 
        }
      );
    }
    return "Vote resolved";
  },
})

export const generateEndingStory = internalAction({
  args:{
    campaignId: v.id("campaigns"),
    campaignName: v.string(),
    campaignTheme: v.array(v.string()),
    campaignDifficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    campaignBackground: v.string(),
    isGoodEnding: v.boolean(),
  },
  handler: async (ctx, args) => {
    const prevCampaigns = await ctx.runQuery(api.campaigns.getPreviousCampaignSteps, { campaignId: args.campaignId });

    const prompt = `
    You are a campaign story generator and you will generate a campaign ending story.

    Campaign Name: ${args.campaignName},
    Campaign Theme: ${args.campaignTheme.join(', ')},
    Campaign Difficulty: ${args.campaignDifficulty},
    Campaign Background: ${args.campaignBackground},

    Previous Plot:
    ${prevCampaigns.map(c => `Chapter ${c.step}: ${c.plot}, Selected option : ${c.options.find(o => o.id === c.selectedOptionId)?.option || ''}`).join('\n')}
    
    Generate : a ${args.isGoodEnding ? 'good' : 'bad'} ending story for the campaign with previous plot context, please keep story short up to 3 sentences max on 'ending' field
    `

    const result = await generateObject({
      model: model,
      schema: z.object({
        ending: z.string(),
      }),
      maxRetries: 3,
      prompt: prompt,
    })

    await ctx.runMutation(internal.campaigns.setEndingStory, {
      campaignId: args.campaignId,
      endingStory: result.object.ending,
    });
  },
})

export const setEndingStory = internalMutation({
  args: {
    campaignId: v.id("campaigns"),
    endingStory: v.string(),
  },
  handler: async (ctx, { campaignId, endingStory }) => {
    const campaign = await ctx.db.get(campaignId);
    if (!campaign) throw new ConvexError("Campaign not found");
    if(campaign.isFinished) throw new ConvexError("Campaign is finished");

    await ctx.db.patch(campaignId, {
      isFinished: true,
      endingStory,
    });
  },
});

// campaign user

export const getCampaignUser = query({
  handler: async (ctx) => {
    const userId = await isAuthenticatedMiddleware(ctx);
    return await ctx.db.query("campaignUsers").withIndex("byUser", (q) => q.eq("userId", userId)).collect();
  },
});

export const getAllCampaignUser = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, { campaignId }) => {
    return await ctx.db.query("campaignUsers").withIndex("byCampaignScore", (q) => q.eq("campaignId", campaignId)).order("desc").collect();
  },
});

export const userJoinCampaign = mutation({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, { campaignId }) => {
    const userId = await isAuthenticatedMiddleware(ctx);
    const userData = await ctx.db.get(userId);
    if (!userData) throw new ConvexError("User not found");
    const campaign = await ctx.db.get(campaignId);
    if (!campaign) throw new ConvexError("Campaign not found");
    if (campaign.isFinished) throw new ConvexError("Campaign is finished");
    const campaignUser = await ctx.db.query("campaignUsers").withIndex("byCampaign", (q) => q.eq("campaignId", campaignId).eq("userId", userId)).first();
    if (campaignUser) throw new ConvexError("User already joined campaign");
    const campaignProgress = await ctx.db.query("campaignProgress").withIndex("byCampaign", (q) => q.eq("campaignId", campaignId)).first();
    if (!campaignProgress) throw new ConvexError("Campaign progress not found");

    await ctx.db.patch(campaignProgress._id, {
      totalPlayer: campaignProgress.totalPlayer + 1,
    })

    await ctx.db.insert("campaignUsers", {
      campaignId,
      userId,
      totalContributions: 0,
      totalVotes: 0,
      name: userData.name,
    });

    return "Successfully joined campaign";
  },
})

//campaign vote

export const getVotesStep = query({
  args: {
    campaignStepId: v.id("campaignSteps"),
  },
  handler: async (ctx, { campaignStepId }) => {
    await isAuthenticatedMiddleware(ctx);
    return await ctx.db.query("campaignVotes").withIndex("byCampaignStep", (q) => q.eq("campaignStepId", campaignStepId)).collect();
  }
})

export const selectVoteStep = mutation({
  args: {
    campaignStepId: v.id("campaignSteps"),
    optionId: v.number(),
  },
  handler: async (ctx, { campaignStepId, optionId }) => {
    const userId = await isAuthenticatedMiddleware(ctx);
    const campaignStep = await ctx.db.get(campaignStepId);
    if (!campaignStep) throw new ConvexError("Campaign step not found");
    const campaign = await ctx.db.get(campaignStep.campaignId);
    if (!campaign) throw new ConvexError("Campaign not found");
    if (campaign.isFinished) throw new ConvexError("Campaign is finished");
    const campaignProgress = await ctx.db.query("campaignProgress").withIndex("byCampaign", (q) => q.eq("campaignId", campaign._id)).first();
    if (!campaignProgress) throw new ConvexError("Campaign progress not found");
    const campaignUser = await ctx.db.query("campaignUsers").withIndex("byCampaign", (q) => q.eq("campaignId", campaign._id).eq('userId', userId)).first();
    if (!campaignUser) throw new ConvexError("User not found");
    const campaignVote = await ctx.db.query("campaignVotes").withIndex("byCampaignStep", (q) => q.eq("campaignStepId", campaignStepId).eq("userId", userId)).first();
    if (campaignVote) throw new ConvexError("User already voted");
    const campaignStepOptions = campaignStep.options.find(option => option.id === optionId);
    if (!campaignStepOptions) throw new ConvexError("Option not found");
    await ctx.db.insert("campaignVotes", {
      campaignUserId: campaignUser._id,
      campaignStepId,
      selectedOptionId: campaignStepOptions.id,
      userId,
    });

    if(campaignStep.status === "pending"){
      await ctx.db.patch(campaignStepId, {
        status: "voting",
      })
      await ctx.scheduler.runAfter(0, internal.campaigns.resolveStep, { campaignStepId });
    }else{
      await ctx.db.patch(campaignUser._id, {
        totalVotes: campaignUser.totalVotes + 1,
      });
    }
    return "Successfully voted";
  },
});