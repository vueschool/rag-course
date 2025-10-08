"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AppUIMessage } from "@/app/helpers/aiMessage";

import {
  Send,
  RotateCcw,
  PanelLeftOpen,
  PanelLeftClose,
  Download,
} from "lucide-react";
import { clsx } from "clsx";
import { Message, ChatMessage } from "./ChatMessage";
import { ChatMessageLoading } from "./ChatMessageLoading";
import { ContextPanel } from "./ContextPanel";
import { ExportDialog } from "./ExportDialog";

export interface ChatSource {
  id: string;
  title: string;
  content: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  sources?: ChatSource[];
  isStreaming?: boolean;
}

export function Chat() {
  const [input, setInput] = useState("");
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat<AppUIMessage>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  // Convert useChat messages to our Message format
  const chatMessages: Message[] = messages.map((msg) => {
    const isDone = Boolean(
      msg?.parts?.find((part) => part.type === "text" && part.state === "done")
    );

    return {
      id: msg.id,
      type: msg.role === "user" ? "user" : "ai",
      content:
        msg.parts
          ?.filter((part) => part.type === "text")
          .map((part) => ("text" in part ? part.text : ""))
          .join("") || "",
      timestamp: msg.metadata?.createdAt
        ? new Date(msg.metadata.createdAt)
        : null,
      sources: isDone
        ? msg.parts?.find((part) => {
            return (
              part?.type === "tool-queryKnowledgeBase" &&
              part?.state === "output-available"
            );
          })?.output || []
        : [],
    };
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;

    const currentInput = input.trim();
    setInput("");

    sendMessage({ text: currentInput, metadata: { createdAt: Date.now() } });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as React.FormEvent);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const toggleContextPanel = () => {
    setIsContextPanelOpen((prev) => !prev);
  };

  return (
    <div className="flex h-screen bg-[#0f0f23] text-white">
      {/* Main Chat Area */}

      <div
        className={clsx(
          "flex flex-col transition-all duration-300",
          isContextPanelOpen ? "flex-1" : "w-full"
        )}
      >
        {/* Header */}
        <header className="border-b border-gray-800 p-4 flex items-center justify-between bg-[#1a1a2e]">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white">
              MDN Developer Chat
            </h1>
            <span className="text-sm text-gray-400">
              AI-powered documentation assistant
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleContextPanel}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
              aria-label={
                isContextPanelOpen
                  ? "Close context panel"
                  : "Open context panel"
              }
            >
              {isContextPanelOpen ? (
                <PanelLeftClose className="w-5 h-5" />
              ) : (
                <PanelLeftOpen className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={() => setIsExportDialogOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
              aria-label="Export conversation"
              disabled={chatMessages.length === 0}
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              onClick={clearChat}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
              aria-label="Clear conversation"
              disabled={messages.length === 0}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div className="max-w-md">
                <h2 className="text-2xl font-semibold mb-4 text-gray-200">
                  Welcome to MDN Developer Chat
                </h2>
                <p className="text-gray-400 mb-6">
                  Ask me anything about web development, JavaScript, CSS, HTML,
                  or any other topics covered in MDN documentation.
                </p>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <button
                    onClick={() =>
                      setInput(
                        "What is the difference between let and var in JavaScript?"
                      )
                    }
                    className="p-3 text-left rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-200"
                  >
                    What is the difference between let and var in JavaScript?
                  </button>
                  <button
                    onClick={() =>
                      setInput("How do CSS Grid and Flexbox differ?")
                    }
                    className="p-3 text-left rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-200"
                  >
                    How do CSS Grid and Flexbox differ?
                  </button>
                  <button
                    onClick={() =>
                      setInput("What are Web Components and how do I use them?")
                    }
                    className="p-3 text-left rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-200"
                  >
                    What are Web Components and how do I use them?
                  </button>
                </div>
              </div>
            </div>
          ) : (
            chatMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}

          {status === "submitted" && <ChatMessageLoading />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-800 p-4 bg-[#1a1a2e]">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me about web development, JavaScript, CSS, HTML..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none min-h-[50px] max-h-32"
                rows={1}
                disabled={status !== "ready"}
              />
              <button
                type="submit"
                disabled={!input.trim() || status !== "ready"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </form>

          <div className="mt-2 text-xs text-gray-500 text-center">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>

      {/* Context Panel */}
      {isContextPanelOpen && (
        <ContextPanel
          sources={chatMessages
            .filter((m) => m.type === "ai" && m.sources)
            .flatMap((m) => m.sources || [])}
        />
      )}

      {/* Export Dialog */}
      {isExportDialogOpen && (
        <ExportDialog
          messages={chatMessages}
          onClose={() => setIsExportDialogOpen(false)}
        />
      )}
    </div>
  );
}
