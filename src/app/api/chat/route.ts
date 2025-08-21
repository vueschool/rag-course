import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { voyage } from "voyage-ai-provider";
import { embedMany } from "ai";
import { db } from "@/db";
import { chunks, conversations, messages } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { NextRequest } from "next/server";
import { ChunkMetadata } from "@/types/chunks";

// Initialize Voyage for embeddings (matching existing chunks)
const embeddingModel = voyage.textEmbeddingModel("voyage-code-3");

export async function POST(req: NextRequest) {
  try {
    const { messages: chatMessages, conversationId } = await req.json();
    console.log("Chat API called with messages:", chatMessages);

    // Get the latest user message
    const userMessage = chatMessages[chatMessages.length - 1];
    if (!userMessage || userMessage.role !== "user") {
      return new Response("Invalid message format", { status: 400 });
    }

    console.log("User message:", userMessage.content);

    // Generate embedding for the user's question
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: [userMessage.content],
    });
    const embedding = embeddings[0];
    console.log("Generated embedding, length:", embedding.length);

    // Convert embedding to PostgreSQL vector format
    const embeddingVector = `[${embedding.join(",")}]`;

    // Search for relevant chunks using vector similarity
    const relevantChunks = await db
      .select({
        id: chunks.id,
        content: chunks.content,
        documentId: chunks.documentId,
        metadata: chunks.metadata,
        similarity: sql<number>`1 - (${chunks.embedding} <=> ${embeddingVector}::vector)`,
      })
      .from(chunks)
      .orderBy(
        desc(sql`1 - (${chunks.embedding} <=> ${embeddingVector}::vector)`)
      )
      .limit(5);

    console.log("Found relevant chunks:", relevantChunks.length);

    // Create context from relevant chunks
    const context = relevantChunks
      .map((chunk, index) => `Document ${index + 1}:\n${chunk.content}`)
      .join("\n\n---\n\n");

    // Create conversation if it doesn't exist
    let finalConversationId = conversationId;
    if (!conversationId) {
      const [newConversation] = await db
        .insert(conversations)
        .values({
          title: userMessage.content.slice(0, 100),
        })
        .returning({ id: conversations.id });
      finalConversationId = newConversation.id;
    }

    // Store user message
    await db.insert(messages).values({
      conversationId: finalConversationId,
      role: "user",
      content: userMessage.content,
    });

    // Create system prompt with context
    const systemPrompt = `You are a helpful assistant that answers questions based on the MDN documentation. Use the following MDN documentation to answer the user's question. If the MDN documentation doesn't contain relevant information, say so clearly.

<mdn-documentation>
${context}
</mdn-documentation>

<guidelines>
- Answer based primarily on the provided context
- Be accurate and cite specific parts of the documentation when possible
- If the context doesn't contain enough information, acknowledge this limitation
- Provide helpful and detailed explanations when the context supports it
</guidelines>`;

    // Prepare citations from relevant chunks
    const citations = relevantChunks.map((chunk) => {
      let metadata: Partial<ChunkMetadata> = {};
      try {
        metadata = chunk.metadata ? JSON.parse(chunk.metadata) : {};
      } catch (e) {
        console.warn("Failed to parse chunk metadata:", e);
      }

      return {
        id: chunk.id.toString(),
        title:
          metadata.documentTitle ||
          metadata.title ||
          `Document ${chunk.documentId}`,
        url: metadata.documentSlug
          ? `https://developer.mozilla.org/en-US/${metadata.documentSlug}`
          : metadata.url || "#",
        excerpt:
          chunk.content.slice(0, 200) +
          (chunk.content.length > 200 ? "..." : ""),
        section: metadata.section,
        documentSlug: metadata.documentSlug,
        nearestHeading: metadata.nearestHeading,
      };
    });

    // Stream the response using the AI SDK
    console.log(
      "Starting to stream response with context length:",
      context.length
    );
    const result = await streamText({
      model: openai("gpt-4-turbo"),
      system: systemPrompt,
      messages: chatMessages.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      onFinish: async ({ text }) => {
        // Store assistant response with citations
        await db.insert(messages).values({
          conversationId: finalConversationId,
          role: "assistant",
          content: text,
          citations: JSON.stringify(citations),
        });
      },
    });

    // Create a custom stream that includes citations
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send citations first
        const citationsData =
          JSON.stringify({
            type: "citations",
            data: citations,
          }) + "\n";
        controller.enqueue(encoder.encode(citationsData));

        // Then stream the text content
        const reader = result.textStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const textData =
              JSON.stringify({
                type: "text",
                data: value,
              }) + "\n";
            controller.enqueue(encoder.encode(textData));
          }
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    console.log("Returning custom streaming response with citations");
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Conversation-Id": finalConversationId.toString(),
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
