#!/usr/bin/env tsx

import { promises as fs } from "fs";
import path from "path";
import { db } from "../src/db/index";
import { documents, chunks } from "../src/db/schema";
import { embedMany } from "ai";
import { createVoyage } from "voyage-ai-provider";
import { config } from "dotenv";
import { isNull } from "drizzle-orm";
config();

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

// Initialize Voyage AI provider
const voyageProvider = createVoyage();

/**
 * Check existing chunks in database and determine which ones need embeddings
 */
async function analyzeExistingChunks(inputChunks: ChunkData[]): Promise<{
  chunksWithEmbeddings: Set<string>;
  chunksWithoutEmbeddings: ChunkData[];
  documentsToInsert: Array<{
    source: string;
    title: string;
    slug: string;
    pageType: string;
    sidebar: string;
    totalChunks: number;
    chunks: ChunkData[];
  }>;
  documentIdMap: Map<string, string>; // source -> document ID
}> {
  console.log("🔍 Analyzing existing chunks and documents...");

  // Get all existing documents and chunks from database
  const existingDocuments = await db.select().from(documents);
  const existingChunks = await db
    .select({
      id: chunks.id,
      documentId: chunks.documentId,
      hasEmbedding: chunks.embedding,
    })
    .from(chunks);

  console.log(`   📚 Found ${existingDocuments.length} existing documents`);
  console.log(`   📄 Found ${existingChunks.length} existing chunks`);

  // Create maps for quick lookup
  const existingDocumentsBySource = new Map<
    string,
    (typeof existingDocuments)[0]
  >();
  const existingChunkIds = new Set<string>();
  const chunksWithEmbeddings = new Set<string>();

  for (const doc of existingDocuments) {
    existingDocumentsBySource.set(doc.sourceFilePath, doc);
  }

  for (const chunk of existingChunks) {
    existingChunkIds.add(chunk.id);
    if (chunk.hasEmbedding !== null) {
      chunksWithEmbeddings.add(chunk.id);
    }
  }

  console.log(
    `   ✅ ${chunksWithEmbeddings.size} chunks already have embeddings`
  );
  console.log(
    `   ❌ ${
      existingChunkIds.size - chunksWithEmbeddings.size
    } chunks exist but lack embeddings`
  );

  // Group input chunks by document source
  const inputDocumentMap = new Map<
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

  for (const chunk of inputChunks) {
    const source = chunk.metadata.source;
    if (!inputDocumentMap.has(source)) {
      inputDocumentMap.set(source, {
        source,
        title: chunk.metadata.documentMetadata.title,
        slug: chunk.metadata.documentMetadata.slug,
        pageType: chunk.metadata.documentMetadata["page-type"],
        sidebar: chunk.metadata.documentMetadata.sidebar,
        totalChunks: chunk.metadata.totalChunks,
        chunks: [],
      });
    }
    inputDocumentMap.get(source)!.chunks.push(chunk);
  }

  // Determine which documents need to be inserted
  const documentsToInsert: Array<{
    source: string;
    title: string;
    slug: string;
    pageType: string;
    sidebar: string;
    totalChunks: number;
    chunks: ChunkData[];
  }> = [];

  const documentIdMap = new Map<string, string>(); // source -> document ID

  for (const [source, docData] of inputDocumentMap.entries()) {
    const existingDoc = existingDocumentsBySource.get(source);
    if (existingDoc) {
      documentIdMap.set(source, existingDoc.id);
      console.log(`   📖 Document "${docData.title}" already exists`);
    } else {
      documentsToInsert.push(docData);
      console.log(`   📖 Document "${docData.title}" will be created`);
    }
  }

  // Find chunks that need embeddings (either don't exist or exist without embeddings)
  const chunksWithoutEmbeddings: ChunkData[] = [];
  let newChunks = 0;
  let existingWithoutEmbeddings = 0;

  for (const chunk of inputChunks) {
    if (!chunksWithEmbeddings.has(chunk.id)) {
      chunksWithoutEmbeddings.push(chunk);
      if (existingChunkIds.has(chunk.id)) {
        existingWithoutEmbeddings++;
      } else {
        newChunks++;
      }
    }
  }

  console.log(`   📊 Analysis summary:`);
  console.log(`      🆕 ${newChunks} completely new chunks need processing`);
  console.log(
    `      🔄 ${existingWithoutEmbeddings} existing chunks need embeddings`
  );
  console.log(
    `      ⏭️  ${chunksWithEmbeddings.size} chunks already have embeddings (will skip)`
  );
  console.log(
    `      🎯 Total chunks to process: ${chunksWithoutEmbeddings.length}`
  );

  return {
    chunksWithEmbeddings,
    chunksWithoutEmbeddings,
    documentsToInsert,
    documentIdMap,
  };
}

/**
 * Generate embeddings for an array of text chunks using Voyage AI
 */
async function generateEmbeddingsForChunks(
  texts: string[]
): Promise<number[][]> {
  console.log(`🔮 Generating embeddings for ${texts.length} chunks...`);

  try {
    const { embeddings } = await embedMany({
      model: voyageProvider.textEmbeddingModel("voyage-code-3"),
      values: texts,
    });

    console.log(`✅ Generated ${embeddings.length} embeddings`);
    return embeddings;
  } catch (error) {
    console.error("❌ Error generating embeddings:", error);
    throw error;
  }
}

async function seedDatabase() {
  console.log("🌱 Starting database seeding with incremental processing...\n");

  // Validate environment variable
  if (!process.env.VOYAGE_API_KEY) {
    console.error(
      "❌ VOYAGE_API_KEY environment variable is required but not set"
    );
    process.exit(1);
  }

  try {
    // Read chunks.json file
    const chunksFilePath = path.join(process.cwd(), "chunks.json");
    const chunksFileContent = await fs.readFile(chunksFilePath, "utf-8");
    const chunksData: ChunksFile = JSON.parse(chunksFileContent);

    console.log(`📊 Total chunks in input file: ${chunksData.chunks.length}`);
    console.log(`📅 Generated at: ${chunksData.metadata.generatedAt}\n`);

    // Analyze existing chunks and determine what needs to be processed
    const analysis = await analyzeExistingChunks(chunksData.chunks);

    // Early exit if nothing needs processing
    if (analysis.chunksWithoutEmbeddings.length === 0) {
      console.log("🎉 All chunks already have embeddings! Nothing to process.");
      console.log("✅ Database is up to date.\n");
      return;
    }

    console.log("");

    // Insert new documents if needed
    if (analysis.documentsToInsert.length > 0) {
      console.log("📖 Inserting new documents...");
      const documentsToInsert = analysis.documentsToInsert.map((doc) => ({
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

      console.log(`✅ Inserted ${insertedDocuments.length} new documents\n`);

      // Update document ID mapping for new documents
      for (let i = 0; i < insertedDocuments.length; i++) {
        const doc = insertedDocuments[i];
        const originalDoc = analysis.documentsToInsert[i];
        analysis.documentIdMap.set(originalDoc.source, doc.id);
      }
    } else {
      console.log(
        "📖 All documents already exist, no new documents to insert\n"
      );
    }

    // Process chunks that need embeddings in batches
    console.log("📄 Processing chunks that need embeddings...");
    const batchSize = 25; // Conservative batch size for rate limiting
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalUpdated = 0;

    // Get all existing chunk IDs from the database before we start
    const existingChunkIds = new Set(
      (await db.select({ id: chunks.id }).from(chunks)).map((c) => c.id)
    );

    const chunksToProcess = analysis.chunksWithoutEmbeddings;

    for (let i = 0; i < chunksToProcess.length; i += batchSize) {
      const batch = chunksToProcess.slice(i, i + batchSize);

      // Extract text content from batch for embedding generation
      const textsForEmbedding = batch.map((chunk) => chunk.content);

      // Generate embeddings for this batch
      const embeddings = await generateEmbeddingsForChunks(textsForEmbedding);

      // Process each chunk in the batch
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const embedding = embeddings[j];
        const documentId = analysis.documentIdMap.get(chunk.metadata.source);

        if (!documentId) {
          console.warn(
            `⚠️  Document ID not found for chunk ${chunk.id}, skipping...`
          );
          continue;
        }

        const chunkData = {
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
          embedding: embedding,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Use upsert to handle both new chunks and updates to existing chunks
        const result = await db
          .insert(chunks)
          .values(chunkData)
          .onConflictDoUpdate({
            target: chunks.id,
            set: {
              embedding: chunkData.embedding,
              updatedAt: new Date(),
            },
          })
          .returning({ id: chunks.id });

        if (result.length > 0) {
          // Check if this was an insert or update based on whether chunk existed before
          if (existingChunkIds.has(chunk.id)) {
            totalUpdated++;
          } else {
            totalInserted++;
          }
        }
      }

      totalProcessed += batch.length;

      // Progress indicator with rate limiting pause
      console.log(
        `   Progress: ${totalProcessed}/${chunksToProcess.length} chunks processed with embeddings`
      );
    }

    console.log(`✅ Processing completed!`);
    console.log(`   🆕 Inserted: ${totalInserted} new chunks`);
    console.log(`   🔄 Updated: ${totalUpdated} existing chunks`);
    console.log("");

    // Verify the final state
    const documentCount = await db.select().from(documents);
    const chunkCount = await db.select().from(chunks);
    const chunksWithEmbeddings = await db
      .select()
      .from(chunks)
      .where(isNull(chunks.embedding));

    console.log("📊 Final Database Summary:");
    console.log(`   📚 Total documents: ${documentCount.length}`);
    console.log(`   📄 Total chunks: ${chunkCount.length}`);
    console.log(
      `   🔮 Chunks with embeddings: ${
        chunkCount.length - chunksWithEmbeddings.length
      }`
    );
    console.log(
      `   ❌ Chunks without embeddings: ${chunksWithEmbeddings.length}`
    );
    console.log(`   🎯 Input file had: ${chunksData.chunks.length} chunks`);

    if (chunksWithEmbeddings.length === 0) {
      console.log("✅ All chunks now have embeddings!");
    } else {
      console.log(
        "⚠️  Some chunks still lack embeddings. Run the script again to continue processing."
      );
    }

    console.log("\n🚀 Incremental database seeding completed successfully!");
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
