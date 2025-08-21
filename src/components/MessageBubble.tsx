"use client";

import { Message, Citation } from "@/types/chat";
import { Copy, User, Bot } from "lucide-react";
import { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

interface MessageBubbleProps {
  message: Message;
  onCitationClick?: (citation: Citation) => void;
}

export default function MessageBubble({
  message,
  onCitationClick,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  // Don't render empty messages (they should show TypingIndicator instead)
  if (
    !message.content.trim() &&
    (!message.citations || message.citations.length === 0)
  ) {
    return null;
  }

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
            <div>
              <MarkdownRenderer content={message.content} />

              {/* Display citations */}
              {message.citations && message.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
                    Sources:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {message.citations.map((citation, index) => (
                      <button
                        key={citation.id}
                        onClick={() => onCitationClick?.(citation)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        <span className="w-4 h-4 bg-blue-600 dark:bg-blue-400 text-white dark:text-gray-900 rounded-full flex items-center justify-center text-[10px] font-medium">
                          {index + 1}
                        </span>
                        <span className="flex flex-col items-start">
                          <span className="font-medium">{citation.title}</span>
                          {citation.nearestHeading && (
                            <span className="text-[10px] opacity-75 italic">
                              § {citation.nearestHeading}
                            </span>
                          )}
                        </span>
                      </button>
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
