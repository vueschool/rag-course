import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { createRAGSystemPrompt } from "@/../scripts/rag-query";
import { aiTools } from "@/app/helpers/aiTools";
import { AppUIMessage } from "@/app/helpers/aiMessage";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: AppUIMessage[] };

    // Validate environment variables
    if (!process.env.VOYAGE_API_KEY || !process.env.OPENAI_API_KEY) {
      return new Response("Missing required API keys", { status: 500 });
    }

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(2),

      system:
        createRAGSystemPrompt() +
        `\n\n Context documents are accessible with the queryKnowledgeBase tool. 
        Always check your knowledge base before answering any questions.`,
      temperature: 0.1,
      tools: aiTools,
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages, // pass this in for type-safe return objects
      messageMetadata: ({ part }) => {
        if (part.type === "start") {
          return {
            createdAt: Date.now(),
          };
        }
      },
    });
  } catch (error) {
    console.error("RAG API error:", error);
    return new Response("Failed to process question", { status: 500 });
  }
}
