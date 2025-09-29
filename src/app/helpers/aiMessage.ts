import { UIMessage } from "ai";
import { z } from "zod";
import { type InferUITools, UIDataTypes } from "ai";
import { aiTools } from "./aiTools";

// Infer the types from the tool set
type MyUITools = InferUITools<typeof aiTools>;

// Define your metadata schema
export const messageMetadataSchema = z.object({
  createdAt: z.number(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export type AppUIMessage = UIMessage<MessageMetadata, UIDataTypes, MyUITools>;
