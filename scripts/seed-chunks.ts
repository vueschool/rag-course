import "dotenv/config";
import { db } from "../src/db";
import { chunks, documents } from "../src/db/schema";
import { DocumentChunk } from "../src/types/chunks";
import fs from "fs";
import path from "path";
import { Pool } from "pg";

async function seedChunks() {
  try {
    console.log("Starting to seed chunks...");

    // Read chunks.json file
    const chunksPath = path.join(process.cwd(), "./chunks.json");
    const chunksData: DocumentChunk[] = JSON.parse(
      fs.readFileSync(chunksPath, "utf-8")
    );

    console.log(`Found ${chunksData.length} chunks to process`);

    // Track unique documents to insert
    const uniqueDocuments = new Map<
      string,
      { title: string; content: string }
    >();

    // Extract document information from chunks
    chunksData.forEach((chunk) => {
      const source = chunk.metadata.source;
      if (!uniqueDocuments.has(source)) {
        uniqueDocuments.set(source, {
          title: chunk.metadata.documentTitle || source,
          content: "", // We'll aggregate content later if needed
        });
      }
    });

    console.log(`Found ${uniqueDocuments.size} unique documents`);

    // Insert documents first
    for (const [source, docInfo] of uniqueDocuments) {
      try {
        await db
          .insert(documents)
          .values({
            id: source,
            title: docInfo.title,
            content: docInfo.content,
          })
          .onConflictDoNothing();
        console.log(`Inserted document: ${source}`);
      } catch (error) {
        console.error(`Error inserting document ${source}:`, error);
      }
    }

    // Insert chunks in batches
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < chunksData.length; i += batchSize) {
      const batch = chunksData.slice(i, i + batchSize);

      const chunkValues = batch.map((chunk) => ({
        documentId: chunk.metadata.source,
        content: chunk.content,
        metadata: JSON.stringify(chunk.metadata),
        chunkIndex: chunk.metadata.chunkIndex,
        // Note: embedding will be null initially - you can add embeddings later
      }));

      try {
        await db.insert(chunks).values(chunkValues);
        insertedCount += batch.length;
        console.log(
          `Inserted batch ${Math.floor(i / batchSize) + 1}: ${insertedCount}/${
            chunksData.length
          } chunks`
        );
      } catch (error) {
        console.error(`Error inserting batch starting at index ${i}:`, error);
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
