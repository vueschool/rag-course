import "dotenv/config";
import { db } from "../src/db";
import { chunks, tokenUsage } from "../src/db/schema";
import {
  DocumentChunk,
  EmbeddingResult,
  TokenUsageData,
  OperationType,
  Model,
} from "../src/types/chunks";
import fs from "fs";
import { execSync } from "child_process";
import path from "path";
import { Pool } from "pg";
import { voyage } from "voyage-ai-provider";
import { embedMany } from "ai";

// Configuration for testing - set to null to process all chunks
// Examples: 1 (single chunk), 5 (small test), 50 (medium test), null (all chunks)
const MAX_CHUNKS_TO_PROCESS = 5; // Set to a number to limit chunks for testing, or null for all chunks

// Configure the Voyage Code 3 embedding model
const embeddingModel = voyage.textEmbeddingModel("voyage-code-3");

// Function to generate embeddings for a batch of text
async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult> {
  try {
    const result = await embedMany({
      model: embeddingModel,
      values: texts,
    });

    // Extract token usage information
    const tokenUsageData: TokenUsageData = {
      operationType: OperationType.EMBEDDING,
      model: Model.VOYAGE_CODE_3,
      promptTokens: result.usage?.tokens || 0, // For embeddings, input tokens are often just called 'tokens'
      totalTokens: result.usage?.tokens || 0, // For embeddings, total tokens equal input tokens
      metadata: {
        chunksBatchSize: texts.length, // Moved from top-level field to metadata
        batchSize: texts.length,
        textLengths: texts.map((t) => t.length),
        usageData: result.usage, // Store raw usage data for debugging
      },
    };

    return {
      embeddings: result.embeddings,
      tokenUsage: tokenUsageData,
    };
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
}

async function seedChunks() {
  try {
    console.log("Starting to seed chunks...");

    console.log("Seeding docs first...");
    const seedDocsPath = path.join(process.cwd(), "scripts/seed-docs.ts");
    await execSync(`npx tsx ${seedDocsPath}`);

    // Read chunks.json file
    const chunksPath = path.join(process.cwd(), "./chunks.json");
    const allChunksData: DocumentChunk[] = JSON.parse(
      fs.readFileSync(chunksPath, "utf-8")
    );

    // Limit chunks for testing if configured
    const chunksData = MAX_CHUNKS_TO_PROCESS
      ? allChunksData.slice(0, MAX_CHUNKS_TO_PROCESS)
      : allChunksData;

    console.log(
      `Found ${allChunksData.length} total chunks, processing ${
        chunksData.length
      } chunks${MAX_CHUNKS_TO_PROCESS ? " (limited for testing)" : ""}`
    );

    // Insert chunks in batches
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < chunksData.length; i += batchSize) {
      const batch = chunksData.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      try {
        console.log(`Generating embeddings for batch ${batchNumber}...`);

        // Extract content for embedding generation
        const batchTexts = batch.map((chunk) => chunk.content);

        // Generate embeddings for the batch
        const embeddingResult = await generateEmbeddings(batchTexts);

        // Prepare chunk values with embeddings
        const chunkValues = batch.map((chunk, index) => ({
          documentId: chunk.metadata.source,
          content: chunk.content,
          embedding: embeddingResult.embeddings[index],
          metadata: JSON.stringify(chunk.metadata),
          chunkIndex: chunk.metadata.chunkIndex,
        }));

        // Insert the batch with embeddings
        const insertedChunks = await db
          .insert(chunks)
          .values(chunkValues)
          .returning({ id: chunks.id });

        // Store token usage data
        const chunkIds = insertedChunks.map((chunk) => chunk.id.toString());
        const tokenUsageRecord = {
          ...embeddingResult.tokenUsage,
          relatedEntityId: chunkIds.join(","), // Store comma-separated chunk IDs
          metadata: JSON.stringify({
            ...embeddingResult.tokenUsage.metadata,
            chunkIds: chunkIds,
            batchNumber: batchNumber,
          }),
        };

        await db.insert(tokenUsage).values(tokenUsageRecord);

        insertedCount += batch.length;
        console.log(
          `Inserted batch ${batchNumber}: ${insertedCount}/${chunksData.length} chunks with embeddings`
        );
        console.log(
          `Token usage - Prompt: ${embeddingResult.tokenUsage.promptTokens}, Total: ${embeddingResult.tokenUsage.totalTokens}`
        );
      } catch (error) {
        console.error(`Error processing batch starting at index ${i}:`, error);
        // Continue with next batch instead of failing completely
        continue;
      }
    }

    console.log(`Successfully seeded ${insertedCount} chunks!`);
  } catch (error) {
    console.error("Error seeding chunks:", error);
    process.exit(1);
  } finally {
    // Close the database connection
    const pool = (db as { $client: Pool }).$client;
    await pool.end();
    process.exit(0);
  }
}

// Run the seeding function
seedChunks();
