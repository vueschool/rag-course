import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  vector,
} from "drizzle-orm/pg-core";
import { documents } from "./documents";

export const chunks = pgTable("chunks", {
  id: text("id").primaryKey(), // e.g., "mdn-docs/closures/index.md_chunk_0"
  documentId: uuid("document_id")
    .references(() => documents.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  startLine: integer("start_line"),
  endLine: integer("end_line"),
  headingContextText: text("heading_context_text"),
  headingContextLevel: integer("heading_context_level"),
  headingLineNumber: integer("heading_line_number"),
  characterCount: integer("character_count").notNull(),
  wordCount: integer("word_count").notNull(),
  embedding: vector("embedding", { dimensions: 1024 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Chunk = typeof chunks.$inferSelect;
export type NewChunk = typeof chunks.$inferInsert;
