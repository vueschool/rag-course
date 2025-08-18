"use client";

import { Citation } from "@/types/chat";
import { ExternalLink, Book, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useState } from "react";

interface CitationPanelProps {
  citations: Citation[];
}

export default function CitationPanel({ citations }: CitationPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyUrl = async (citation: Citation) => {
    await navigator.clipboard.writeText(citation.url);
    setCopiedId(citation.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Book className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            Sources
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({citations.length})
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          References from MDN documentation
        </p>
      </div>

      {/* Citations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {citations.map((citation, index) => (
          <div
            key={citation.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
          >
            {/* Citation Number and Title */}
            <div className="flex items-start gap-3 mb-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight">
                  {citation.title}
                </h3>
                {citation.section && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Section: {citation.section}
                  </p>
                )}
              </div>
            </div>

            {/* Excerpt */}
            <div className="mb-3">
              <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded p-2 border-l-2 border-blue-200 dark:border-blue-800">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0">{children}</p>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded text-xs">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {citation.excerpt}
                </ReactMarkdown>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:underline"
              >
                View on MDN
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => handleCopyUrl(citation)}
                className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                title="Copy URL"
              >
                <Copy className="w-3 h-3" />
                {copiedId === citation.id ? "Copied!" : "Copy URL"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          All sources are from{" "}
          <a
            href="https://developer.mozilla.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            MDN Web Docs
          </a>
        </p>
      </div>
    </div>
  );
}
