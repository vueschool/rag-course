"use client";

import { ChatState, Citation } from "@/types/chat";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import CitationPanel from "./CitationPanel";
import { useState } from "react";

interface ChatContainerProps {
  chatState: ChatState;
  onSendMessage: (content: string) => void;
}

export default function ChatContainer({
  chatState,
  onSendMessage,
}: ChatContainerProps) {
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(
    null
  );

  return (
    <div className="flex w-full h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold">
                MDN Documentation Assistant
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get answers about web technologies with citations from MDN docs
              </p>
            </div>
            {selectedCitation && (
              <button
                onClick={() => setSelectedCitation(null)}
                className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                Close Source Panel
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 min-h-0">
          <MessageList
            messages={chatState.messages}
            isLoading={chatState.isLoading}
            error={chatState.error}
            onCitationClick={setSelectedCitation}
          />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <ChatInput
            onSendMessage={onSendMessage}
            isLoading={chatState.isLoading}
          />
        </div>
      </div>

      {/* Citation Panel */}
      {selectedCitation && (
        <div className="w-80 border-l border-gray-200 dark:border-gray-700">
          <CitationPanel citation={selectedCitation} />
        </div>
      )}
    </div>
  );
}
