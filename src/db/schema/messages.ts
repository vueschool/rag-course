import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { conversations } from "./conversations";

export const messageTypeEnum = ["user", "ai"] as const;

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .references(() => conversations.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type", { enum: messageTypeEnum }).notNull(),
  content: text("content").notNull(),
  isStreaming: boolean("is_streaming").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MessageType = (typeof messageTypeEnum)[number];
