import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  vector,
} from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source"),
  chunkIndex: integer("chunk_index"),
  embedding: vector("embedding", { dimensions: 1536 }), // Will add this after enabling pgvector
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
