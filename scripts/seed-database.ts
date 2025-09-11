#!/usr/bin/env tsx

import { promises as fs } from "fs";
import path from "path";
import { db } from "../src/db/index";
import { documents, chunks } from "../src/db/schema";

interface ChunkMetadata {
  source: string;
  filePath: string;
  chunkIndex: number;
  totalChunks: number;
  startLine?: number;
  endLine?: number;
  documentMetadata: {
    title: string;
    slug: string;
    "page-type": string;
    sidebar: string;
  };
  headingContext?: {
    text: string;
    level: number;
    lineNumber: number;
  } | null;
  characterCount: number;
  wordCount: number;
}

interface ChunkData {
  id: string;
  content: string;
  metadata: ChunkMetadata;
}

interface ChunksFile {
  metadata: {
    totalChunks: number;
    generatedAt: string;
    chunkingStrategy: string;
    chunkSize: number;
    chunkOverlap: number;
  };
  chunks: ChunkData[];
}

async function seedDatabase() {
  console.log("🌱 Starting database seeding...\n");

  try {
    // Read chunks.json file
    const chunksFilePath = path.join(process.cwd(), "chunks.json");
    const chunksFileContent = await fs.readFile(chunksFilePath, "utf-8");
    const chunksData: ChunksFile = JSON.parse(chunksFileContent);

    console.log(`📊 Total chunks to process: ${chunksData.chunks.length}`);
    console.log(`📅 Generated at: ${chunksData.metadata.generatedAt}\n`);

    // Group chunks by document source to create unique documents
    const documentMap = new Map<
      string,
      {
        source: string;
        title: string;
        slug: string;
        pageType: string;
        sidebar: string;
        totalChunks: number;
        chunks: ChunkData[];
      }
    >();

    // Group chunks by their source document
    for (const chunk of chunksData.chunks) {
      const source = chunk.metadata.source;

      if (!documentMap.has(source)) {
        documentMap.set(source, {
          source,
          title: chunk.metadata.documentMetadata.title,
          slug: chunk.metadata.documentMetadata.slug,
          pageType: chunk.metadata.documentMetadata["page-type"],
          sidebar: chunk.metadata.documentMetadata.sidebar,
          totalChunks: chunk.metadata.totalChunks,
          chunks: [],
        });
      }

      documentMap.get(source)!.chunks.push(chunk);
    }

    console.log(`📚 Unique documents found: ${documentMap.size}\n`);

    // Clear existing data (optional - comment out if you want to append)
    console.log("🧹 Clearing existing data...");
    await db.delete(chunks); // This will cascade and also delete message_sources
    await db.delete(documents);
    console.log("✅ Cleared existing chunks and documents\n");

    // Insert documents first
    console.log("📖 Inserting documents...");
    const documentsToInsert = Array.from(documentMap.values()).map((doc) => ({
      title: doc.title,
      slug: doc.slug,
      sourceFilePath: doc.source,
      pageType: doc.pageType,
      sidebar: doc.sidebar,
      totalChunks: doc.totalChunks,
      processedAt: new Date(),
    }));

    const insertedDocuments = await db
      .insert(documents)
      .values(documentsToInsert)
      .returning();

    console.log(`✅ Inserted ${insertedDocuments.length} documents\n`);

    // Create a mapping from source path to document ID
    const sourceToDocId = new Map<string, string>();
    for (let i = 0; i < insertedDocuments.length; i++) {
      const doc = insertedDocuments[i];
      const originalDoc = Array.from(documentMap.values())[i];
      sourceToDocId.set(originalDoc.source, doc.id);
    }

    // Insert chunks in batches to avoid memory issues
    console.log("📄 Inserting chunks...");
    const batchSize = 100;
    let totalInserted = 0;

    for (const [source, docData] of documentMap.entries()) {
      const documentId = sourceToDocId.get(source)!;

      for (let i = 0; i < docData.chunks.length; i += batchSize) {
        const batch = docData.chunks.slice(i, i + batchSize);

        const chunksToInsert = batch.map((chunk) => ({
          id: chunk.id,
          documentId,
          content: chunk.content,
          chunkIndex: chunk.metadata.chunkIndex,
          startLine: chunk.metadata.startLine || null,
          endLine: chunk.metadata.endLine || null,
          headingContextText: chunk.metadata.headingContext?.text || null,
          headingContextLevel: chunk.metadata.headingContext?.level || null,
          headingLineNumber: chunk.metadata.headingContext?.lineNumber || null,
          characterCount: chunk.metadata.characterCount,
          wordCount: chunk.metadata.wordCount,
          // Note: embedding will be null initially - you'll need to generate these separately
          embedding: null,
        }));

        await db.insert(chunks).values(chunksToInsert);
        totalInserted += batch.length;

        // Progress indicator
        if (
          totalInserted % 500 === 0 ||
          totalInserted === chunksData.chunks.length
        ) {
          console.log(
            `   Progress: ${totalInserted}/${chunksData.chunks.length} chunks inserted`
          );
        }
      }
    }

    console.log(`✅ Inserted ${totalInserted} chunks\n`);

    // Verify the seeding
    const documentCount = await db.select().from(documents);
    const chunkCount = await db.select().from(chunks);

    console.log("📊 Seeding Summary:");
    console.log(`   📚 Documents: ${documentCount.length}`);
    console.log(`   📄 Chunks: ${chunkCount.length}`);
    console.log(`   🎯 Expected chunks: ${chunksData.chunks.length}`);

    if (chunkCount.length === chunksData.chunks.length) {
      console.log("✅ All chunks successfully seeded!");
    } else {
      console.log("⚠️  Chunk count mismatch - please check for errors");
    }

    console.log("\n🚀 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  }
}

// Run the seeding script
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log("👋 Seeding script finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding script failed:", error);
      process.exit(1);
    });
}

export { seedDatabase };
