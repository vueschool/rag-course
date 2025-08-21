"use client";

import { useState } from "react";
import { Message, ChatState } from "@/types/chat";
import ChatContainer from "@/components/ChatContainer";

export default function ChatPage() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [
      {
        id: "1",
        role: "assistant",
        content:
          "Hello! I'm here to help you with documentation. Ask me anything about web technologies, HTML, CSS, JavaScript, and web APIs.",
        timestamp: new Date(),
      },
    ],
    isLoading: false,
  });

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...chatState.messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        citations: [],
      };

      let pendingCitations: any[] = [];

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines (newline-delimited JSON)
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);

              if (data.type === "citations") {
                // Store citations but don't display them yet
                pendingCitations = data.data;
              } else if (data.type === "text") {
                // Append text content
                setChatState((prev) => ({
                  ...prev,
                  messages: prev.messages.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: msg.content + data.data }
                      : msg
                  ),
                }));
              }
            } catch (error) {
              console.error("Error parsing streaming data:", error);
            }
          }
        }
      }

      // Apply citations once streaming is complete
      if (pendingCitations.length > 0) {
        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, citations: pendingCitations }
              : msg
          ),
        }));
      }
    } catch (error) {
      console.error("Error:", error);
      setChatState((prev) => ({
        ...prev,
        error: "Failed to send message",
      }));
    } finally {
      setChatState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto h-screen flex">
        <ChatContainer
          chatState={chatState}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
