#!/usr/bin/env tsx

import { config } from "dotenv";
import { db } from "../src/db/index";
import { chunks, documents } from "../src/db/schema";
import { embed } from "ai";
import { createVoyage } from "voyage-ai-provider";
import { sql } from "drizzle-orm";

config();

// Initialize Voyage AI provider
const voyageProvider = createVoyage();

export interface SearchResult {
  chunkId: string;
  documentTitle: string;
  content: string;
  headingContext: string | null;
  similarity: number;
  characterCount: number;
  wordCount: number;
  sourceFilePath: string;
  documentSlug: string | null;
}

/**
 * Generate embedding for a question using Voyage AI
 */
async function generateQuestionEmbedding(question: string): Promise<number[]> {
  console.log(`🔮 Generating embedding for question...`);

  try {
    const { embedding } = await embed({
      model: voyageProvider.textEmbeddingModel("voyage-code-3"),
      value: question,
    });

    console.log(`✅ Generated embedding with ${embedding.length} dimensions`);
    return embedding;
  } catch (error) {
    console.error("❌ Error generating embedding:", error);
    throw error;
  }
}

/**
 * Search for semantically similar chunks using vector similarity
 */
async function searchSimilarChunks(
  questionEmbedding: number[],
  limit: number = 5,
  similarityThreshold: number = 0.5
): Promise<SearchResult[]> {
  console.log(`🔍 Searching for ${limit} most similar chunks...`);

  try {
    // Use cosine similarity for vector search
    // 1 - cosine_distance gives us cosine similarity (higher = more similar)
    const results = await db
      .select({
        chunkId: chunks.id,
        documentTitle: documents.title,
        content: chunks.content,
        headingContext: chunks.headingContextText,
        characterCount: chunks.characterCount,
        wordCount: chunks.wordCount,
        sourceFilePath: documents.sourceFilePath,
        documentSlug: documents.slug,
        similarity: sql<number>`1 - (${chunks.embedding} <=> ${JSON.stringify(
          questionEmbedding
        )})`,
      })
      .from(chunks)
      .innerJoin(documents, sql`${chunks.documentId} = ${documents.id}`)
      .where(sql`${chunks.embedding} IS NOT NULL`)
      .orderBy(
        sql`${chunks.embedding} <=> ${JSON.stringify(questionEmbedding)}`
      )
      .limit(limit);

    // Filter by similarity threshold
    const filteredResults = results.filter(
      (result) => result.similarity >= similarityThreshold
    );

    console.log(
      `✅ Found ${filteredResults.length} chunks above similarity threshold of ${similarityThreshold}`
    );
    return filteredResults;
  } catch (error) {
    console.error("❌ Error searching similar chunks:", error);
    throw error;
  }
}

/**
 * Format and display search results
 */
function displayResults(results: SearchResult[], question: string): void {
  console.log("\n" + "=".repeat(80));
  console.log(`📊 SEMANTIC SEARCH RESULTS FOR: "${question}"`);
  console.log("=".repeat(80));

  if (results.length === 0) {
    console.log("🔍 No relevant chunks found above the similarity threshold.");
    console.log("💡 Try:");
    console.log("   - Rephrasing your question");
    console.log("   - Using different keywords");
    console.log("   - Lowering the similarity threshold");
    return;
  }

  results.forEach((result, index) => {
    console.log(`\n📄 RESULT ${index + 1}:`);
    console.log(`   📋 Document: ${result.documentTitle}`);
    console.log(`   📁 Source: ${result.sourceFilePath}`);
    console.log(`   🔗 Slug: ${result.documentSlug || "N/A"}`);
    console.log(`   🎯 Similarity: ${(result.similarity * 100).toFixed(2)}%`);
    console.log(
      `   📏 Length: ${result.characterCount} chars, ${result.wordCount} words`
    );

    if (result.headingContext) {
      console.log(`   🏷️  Context: ${result.headingContext}`);
    }

    console.log(`   💬 Content Preview:`);
    console.log(
      `   "${result.content.substring(0, 200).replace(/\n/g, " ")}${
        result.content.length > 200 ? "..." : ""
      }"`
    );
    console.log(`   🆔 Chunk ID: ${result.chunkId}`);

    if (index < results.length - 1) {
      console.log("\n" + "-".repeat(40));
    }
  });

  console.log("\n" + "=".repeat(80));
}

/**
 * Main function to handle semantic search
 */
async function performSemanticSearch(
  question: string,
  limit: number = 5
): Promise<SearchResult[]> {
  const similarityThreshold = 0.7;
  console.log("🚀 Starting semantic search...\n");

  // Validate environment variable
  if (!process.env.VOYAGE_API_KEY) {
    console.error(
      "❌ VOYAGE_API_KEY environment variable is required but not set"
    );
    process.exit(1);
  }

  try {
    // Generate embedding for the question
    const questionEmbedding = await generateQuestionEmbedding(question);

    // Search for similar chunks
    const results = await searchSimilarChunks(
      questionEmbedding,
      limit,
      similarityThreshold
    );

    // Display results
    displayResults(results, question);

    return results;
  } catch (error) {
    console.error("❌ Semantic search failed:", error);
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

  // Parse command line arguments
  if (args.length === 0) {
    // Interactive mode - prompt for question
    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    question = await new Promise<string>((resolve) => {
      rl.question("🤔 Enter your question: ", (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  } else {
    // Parse arguments: question --limit=N --threshold=N
    question = args.filter((arg) => !arg.startsWith("--")).join(" ");

    // Parse optional parameters
    const limitArg = args.find((arg) => arg.startsWith("--limit="));

    if (limitArg) {
      limit = parseInt(limitArg.split("=")[1]) || 5;
    }
  }

  if (!question) {
    console.error("❌ No question provided");
    console.log("Usage:");
    console.log('  tsx scripts/semantic-search.ts "your question here"');
    console.log(
      '  tsx scripts/semantic-search.ts "your question" --limit=10 --threshold=0.6'
    );
    console.log("  tsx scripts/semantic-search.ts  (for interactive mode)");
    process.exit(1);
  }

  console.log(`Question: "${question}"`);
  console.log(`Limit: ${limit} results`);

  // Perform the search
  await performSemanticSearch(question, limit);
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
  performSemanticSearch,
  generateQuestionEmbedding,
  searchSimilarChunks,
};
