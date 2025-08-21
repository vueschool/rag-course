"use client";

import { Citation } from "@/types/chat";
import { ExternalLink, Book, Copy } from "lucide-react";
import { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

// Utility function to convert heading text to URL hash format
function headingToHash(heading: string): string {
  return heading.toLowerCase().replace(/\s+/g, "_");
}

interface CitationPanelProps {
  citation: Citation;
}

export default function CitationPanel({ citation }: CitationPanelProps) {
  const [copied, setCopied] = useState(false);

  // Create URL with hash if nearestHeading exists
  const getFullUrl = () => {
    if (citation.nearestHeading) {
      return `${citation.url}#${headingToHash(citation.nearestHeading)}`;
    }
    return citation.url;
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(getFullUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Book className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            Source Details
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Reference from MDN documentation
        </p>
      </div>

      {/* Citation Details */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          {/* Title */}
          <div className="mb-3">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-lg leading-tight">
              {citation.title}
            </h3>
            {citation.nearestHeading && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 font-medium">
                § {citation.nearestHeading}
              </p>
            )}
            {citation.section && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Section: {citation.section}
              </p>
            )}
          </div>

          {/* Content Preview */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content Preview:
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 border-l-2 border-blue-200 dark:border-blue-800">
              <MarkdownRenderer
                content={citation.excerpt}
                className="text-sm text-gray-700 dark:text-gray-300"
                showCopyButton={false}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <a
              href={getFullUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-2 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View on MDN
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title="Copy URL"
            >
              <Copy className="w-4 h-4" />
              {copied ? "Copied!" : "Copy URL"}
            </button>
          </div>
        </div>
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
