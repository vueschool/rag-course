import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug"),
  sourceFilePath: text("source_file_path").notNull(),
  pageType: text("page_type"),
  sidebar: text("sidebar"),
  totalChunks: integer("total_chunks").notNull().default(0),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
