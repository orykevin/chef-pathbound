import { query, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai'
import * as z from 'zod'

export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

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

// List all campaigns
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("campaigns").collect();
  },
});

export const getAllCampaign = query({
  args: {},
  handler: async (ctx) => {
    const campaigns = await ctx.db.query("campaigns").collect();
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
    const prompt = ` 
      You are a campaign generator. Generate a campaign with a name, theme, and difficulty level. 
      - randomly choose a difficulty level: easy, medium, or hard, on 'difficulty' field
      - randomly choose a theme/genre: 3-4 words, on 'theme' field
      - generate name based on the theme/genre generated on 'name' field
      - generate a short background story / trailer about campaign on 'background' field
      - for first campaign generation, please create a plot to starting the campaign on 'plot' field
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
        difficulty: z.union([z.literal("easy"), z.literal("medium"), z.literal("hard")]),
        options: z.array(z.object({
          option: z.string(),
          value: z.number(),
        }))
      }),
      maxRetries: 3,
      prompt: prompt
    })

    await ctx.runMutation(internal.campaigns.createCampaign, {
      name: result.object.name,
      theme: result.object.theme,
      difficulty: result.object.difficulty,
      options: result.object.options,
      plot: result.object.plot,
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
  },
  handler: async (ctx, { name, theme, difficulty, options, plot }) => {
    const campaignId = await ctx.db.insert("campaigns", {
      name,
      theme,
      difficulty,
      isFinished: false,
      deadlineDate: Date.now() + 60 * 1000,
      background: '',
    });

    await ctx.db.insert("campaignProgress", {
      campaignId,
      totalPlayer: 0,
      currentStep: 1,
      targetScore: diffcultyTargetScore[difficulty],
      currentScore: 0,
    });
    const randomedOptions = shuffleArray(options).map((option, index) => ({
      id: index + 1,
      option: option.option,
      value: option.value,
    }));

    await ctx.db.insert("campaignSteps", {
      campaignId,
      plot,
      step: 1,
      options: randomedOptions,
    })
  },
})

