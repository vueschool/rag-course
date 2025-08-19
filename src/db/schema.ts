// src/db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  serial,
  integer,
  vector,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums for token usage tracking
export const operationTypeEnum = pgEnum("operation_type", [
  "embedding",
  "chat",
  "completion",
  "search",
  "summarization",
]);

export const modelEnum = pgEnum("model", [
  "voyage-code-3",
  "voyage-3",
  "gpt-4",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
  "claude-3-sonnet",
  "claude-3-haiku",
]);

// Example schema - you can modify this based on your needs
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chunks table for storing document chunks with vector embeddings
export const chunks = pgTable(
  "chunks",
  {
    id: serial("id").primaryKey(),
    documentId: text("document_id")
      .references(() => documents.id)
      .notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1024 }), // Voyage code 3 embeddings are 1024 dimensions
    metadata: text("metadata"), // Store additional metadata as JSON string
    chunkIndex: integer("chunk_index").notNull(), // Order of chunk in document
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("embeddingIndex").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);

// Chat/RAG related tables
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  citations: text("citations"), // Store citations as JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Token usage tracking table
export const tokenUsage = pgTable("token_usage", {
  id: serial("id").primaryKey(),
  operationType: operationTypeEnum("operation_type").notNull(),
  model: modelEnum("model").notNull(),
  promptTokens: integer("prompt_tokens").notNull(),
  totalTokens: integer("total_tokens").notNull(),
  relatedEntityId: text("related_entity_id"), // Could be chunk IDs, conversation ID, etc.
  metadata: text("metadata"), // Store additional metadata as JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
