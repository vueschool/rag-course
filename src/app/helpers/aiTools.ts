import { z } from "zod";
import { performSemanticSearch } from "@/../scripts/semantic-search";
import { ToolSet } from "ai";
import { transformChunksForFrontend } from "@/../scripts/rag-query";

export const aiTools = {
  queryKnowledgeBase: {
    description: "Query the provided context documents",
    inputSchema: z.object({
      message: z
        .string()
        .describe(
          "The question or comment to query the context documents about"
        ),
      limit: z.number().optional().default(5),
    }),
    execute: async ({ message, limit }) => {
      const retrievedChunks = await performSemanticSearch(message, limit);

      return transformChunksForFrontend(retrievedChunks);
    },
  },
} satisfies ToolSet;
