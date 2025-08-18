"use client";

import { Message } from "@/types/chat";
import { Copy, User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import CitationInline from "./CitationInline";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex gap-3 max-w-4xl mx-auto ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
      )}

      <div className={`group relative max-w-3xl ${isUser ? "ml-12" : "mr-12"}`}>
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code: ({ inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <div className="relative">
                        <pre className={className} {...props}>
                          <code>{children}</code>
                        </pre>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(String(children))
                          }
                          className="absolute top-2 right-2 p-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white text-xs"
                          title="Copy code"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Display citations */}
              {message.citations && message.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
                    Sources:
                  </p>
                  <div className="space-y-1">
                    {message.citations.map((citation, index) => (
                      <CitationInline
                        key={citation.id}
                        citation={citation}
                        number={index + 1}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message actions */}
        <div
          className={`absolute -top-2 ${
            isUser ? "-left-8" : "-right-8"
          } opacity-0 group-hover:opacity-100 transition-opacity`}
        >
          <button
            onClick={handleCopy}
            className="p-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            title={copied ? "Copied!" : "Copy message"}
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>

        {/* Timestamp */}
        <div
          className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </div>
      )}
    </div>
  );
}
