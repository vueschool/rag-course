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
          "Hello! I'm here to help you with MDN documentation. Ask me anything about web technologies, HTML, CSS, JavaScript, and web APIs.",
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

    // TODO: Implement RAG pipeline
    // For now, simulate an AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I received your question: "${content}". This is a placeholder response. The RAG pipeline will be implemented to provide accurate answers with citations from MDN documentation.`,
        timestamp: new Date(),
        citations: [
          {
            id: "mdn-1",
            title: "Introduction to HTML",
            url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
            excerpt:
              "HTML (HyperText Markup Language) is the most basic building block of the Web...",
            section: "Getting started",
          },
        ],
      };

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }));
    }, 1500);
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
