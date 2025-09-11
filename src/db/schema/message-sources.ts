import {
  pgTable,
  text,
  timestamp,
  uuid,
  real,
  integer,
} from "drizzle-orm/pg-core";
import { messages } from "./messages";
import { chunks } from "./chunks";

export const messageSources = pgTable("message_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  messageId: uuid("message_id")
    .references(() => messages.id, { onDelete: "cascade" })
    .notNull(),
  chunkId: text("chunk_id")
    .references(() => chunks.id, { onDelete: "cascade" })
    .notNull(),
  relevanceScore: real("relevance_score"), // Similarity/relevance score from RAG
  citationNumber: integer("citation_number"), // For [1], [2], etc. in UI
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MessageSource = typeof messageSources.$inferSelect;
export type NewMessageSource = typeof messageSources.$inferInsert;
