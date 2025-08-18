"use client";

import { Citation } from "@/types/chat";
import { ExternalLink } from "lucide-react";

interface CitationInlineProps {
  citation: Citation;
  number: number;
}

export default function CitationInline({
  citation,
  number,
}: CitationInlineProps) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="flex-shrink-0 w-4 h-4 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-[10px] font-medium">
        {number}
      </span>
      <div className="flex-1">
        <a
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:underline font-medium flex items-center gap-1"
        >
          {citation.title}
          <ExternalLink className="w-3 h-3" />
        </a>
        {citation.section && (
          <div className="text-gray-500 dark:text-gray-400 text-[11px]">
            Section: {citation.section}
          </div>
        )}
        <div className="text-gray-600 dark:text-gray-300 mt-1 text-[11px] line-clamp-2">
          {citation.excerpt}
        </div>
      </div>
    </div>
  );
}
