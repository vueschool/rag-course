#!/usr/bin/env tsx

import { config } from "dotenv";
import { performSemanticSearch } from "./semantic-search";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { SearchResult } from "./semantic-search";
import { generateMDNUrl } from "../src/app/helpers/general";

config();

interface RAGResponse {
  answer: string;
  sources: Array<{
    documentTitle: string;
    sourceFilePath: string;
    content: string;
    similarity: number;
  }>;
  tokensUsed?: number;
}

/**
 * Format retrieved chunks into context for the LLM
 */
function formatContextFromChunks(chunks: SearchResult[]): string {
  if (chunks.length === 0) {
    return "No relevant context found.";
  }

  const context = `Here are the relevant documents to help answer the question:\n\n
    <context>
    ${JSON.stringify(transformChunksForFrontend(chunks))}
    </context>
    `;
  return context;
}

export function transformChunksForFrontend(chunks: SearchResult[]) {
  return chunks.map((source, index) => ({
    id: String(index + 1),
    citationNumber: index + 1,
    title: source.documentTitle,
    url: generateMDNUrl(source.documentSlug, source.headingContext),
    similarity: source.similarity,
    sourceFilePath: source.sourceFilePath,
    chunkId: source.chunkId,
    content: source.content,
  }));
}

/**
 * Create a system prompt for the RAG query
 * @returns {string}
 */
function createRAGSystemPrompt(): string {
  return `You are a helpful AI assistant that answers questions based on the provided context documents. Please follow these guidelines:

1. Answer the question using primarily the information from the provided context documents
2. If the context doesn't contain enough information to fully answer the question, clearly state what information is missing
3. Be specific and cite which documents you're referencing when possible
4. If the context is contradictory or unclear, acknowledge this
5. Keep your answer concise but comprehensive
6. Use markdown formatting for better readability
7. Stick to the provided context as closely as possible and do NOT add any other information
8. Always include a link to referenced context document (it's url)
9. If the question is unrelated to the context, say so and don't try to answer it
10. Never ask a user to provide more context, they cannot.
11. When referring to the context documents, always use the term "MDN documentation"`;
}

/**
 * Create a prompt that combines the user's question with retrieved context
 */
function createRAGPrompt(question: string, context: string): string {
  return `${createRAGSystemPrompt()}

Context Documents:
${context}

Question: ${question}

Answer:`;
}

/**
 * Query the LLM with the augmented prompt
 */
async function queryLLM(
  question: string,
  context: string,
  model: string = "gpt-4o-mini"
): Promise<{ answer: string; tokensUsed?: number }> {
  console.log(`🤖 Querying ${model}...`);

  try {
    const prompt = createRAGPrompt(question, context);

    const { text, usage } = await generateText({
      model: openai(model),
      prompt,
      temperature: 0.1, // Low temperature for more factual responses
    });

    console.log(
      `✅ Generated response (${usage?.totalTokens || "unknown"} tokens)`
    );

    return {
      answer: text,
      tokensUsed: usage?.totalTokens,
    };
  } catch (error) {
    console.error("❌ Error querying LLM:", error);
    throw error;
  }
}

/**
 * Format and display the RAG response
 */
function displayRAGResponse(response: RAGResponse, question: string): void {
  console.log("\n" + "=".repeat(80));
  console.log(`🎯 RAG RESPONSE FOR: "${question}"`);
  console.log("=".repeat(80));

  console.log("\n🤖 AI ANSWER:");
  console.log("-".repeat(40));
  console.log(response.answer);

  if (response.tokensUsed) {
    console.log(`\n📊 Tokens used: ${response.tokensUsed}`);
  }

  console.log("\n📚 SOURCES USED:");
  console.log("-".repeat(40));
  response.sources.forEach((source, index) => {
    console.log(`${index + 1}. ${source.documentTitle}`);
    console.log(`   📁 ${source.sourceFilePath}`);
    console.log(`   🎯 Similarity: ${(source.similarity * 100).toFixed(1)}%`);
    console.log(
      `   📄 "${source.content.substring(0, 100).replace(/\n/g, " ")}..."`
    );
    console.log();
  });

  console.log("=".repeat(80));
}

/**
 * Main RAG query function that combines retrieval and generation
 */
async function performRAGQuery(
  question: string,
  options: {
    limit?: number;
    model?: string;
  } = {}
): Promise<RAGResponse> {
  const { limit = 5, model = "gpt-4o-mini" } = options;

  console.log("🚀 Starting RAG query...\n");
  console.log(`📝 Question: "${question}"`);
  console.log(`🤖 Using model: ${model}\n`);

  // Validate environment variables
  if (!process.env.VOYAGE_API_KEY) {
    console.error(
      "❌ VOYAGE_API_KEY environment variable is required but not set"
    );
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error(
      "❌ OPENAI_API_KEY environment variable is required but not set"
    );
    process.exit(1);
  }

  try {
    // Step 1: Retrieve relevant chunks using semantic search
    const retrievedChunks = await performSemanticSearch(question, limit);

    if (retrievedChunks.length === 0) {
      return {
        answer:
          "I couldn't find any relevant information in the knowledge base to answer your question. You may want to try rephrasing your question or checking if the information exists in the documents.",
        sources: [],
      };
    }

    // Step 2: Format context from retrieved chunks
    const context = formatContextFromChunks(retrievedChunks);

    // Step 3: Query LLM with augmented prompt
    const llmResponse = await queryLLM(question, context, model);

    // Step 4: Format response
    const response: RAGResponse = {
      answer: llmResponse.answer,
      sources: retrievedChunks,
      tokensUsed: llmResponse.tokensUsed,
    };

    return response;
  } catch (error) {
    console.error("❌ RAG query failed:", error);
    throw error;
  }
}

/**
 * Handle command line arguments and interactive input
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let question: string;
  let limit: number = 5;
  let model: string = "gpt-4o-mini";

  // Parse command line arguments
  if (args.length === 0) {
    // Interactive mode - prompt for question
    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    question = await new Promise<string>((resolve) => {
      rl.question("🤔 Ask me anything: ", (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  } else {
    // Parse arguments: question --limit=N --threshold=N --model=X
    question = args.filter((arg) => !arg.startsWith("--")).join(" ");

    // Parse optional parameters
    const limitArg = args.find((arg) => arg.startsWith("--limit="));
    const modelArg = args.find((arg) => arg.startsWith("--model="));

    if (limitArg) {
      limit = parseInt(limitArg.split("=")[1]) || 5;
    }

    if (modelArg) {
      model = modelArg.split("=")[1] || "gpt-4o-mini";
    }
  }

  if (!question) {
    console.error("❌ No question provided");
    console.log("Usage:");
    console.log('  tsx scripts/rag-query.ts "your question here"');
    console.log(
      '  tsx scripts/rag-query.ts "your question" --limit=10 --model=gpt-4'
    );
    console.log("  tsx scripts/rag-query.ts  (for interactive mode)");
    console.log(
      "\nAvailable models: gpt-4, gpt-4-turbo, gpt-4o, gpt-4o-mini, gpt-3.5-turbo"
    );
    process.exit(1);
  }

  // Perform the RAG query
  const response = await performRAGQuery(question, {
    limit,
    model,
  });

  // Display the response
  displayRAGResponse(response, question);
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
}

// Export for potential use as a module
export {
  performRAGQuery,
  formatContextFromChunks,
  createRAGPrompt,
  queryLLM,
  createRAGSystemPrompt,
};
