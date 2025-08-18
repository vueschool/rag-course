"use client";

import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 max-w-4xl mx-auto justify-start">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
        <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>

      <div className="mr-12">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 max-w-fit">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          AI is thinking...
        </div>
      </div>
    </div>
  );
}
