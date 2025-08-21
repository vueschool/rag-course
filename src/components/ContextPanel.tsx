"use client";

import { ExternalLink, BookOpen, Clock } from "lucide-react";
import { ChatSource } from "./ChatMessage";

interface ContextPanelProps {
  sources: ChatSource[];
}

export function ContextPanel({ sources }: ContextPanelProps) {
  const uniqueSources = sources.filter(
    (source, index, self) => index === self.findIndex((s) => s.id === source.id)
  );

  return (
    <div className="w-80 border-l border-gray-800 bg-[#1a1a2e] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Context Sources</h2>
        </div>
        <p className="text-sm text-gray-400">
          Retrieved MDN documentation relevant to the conversation
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {uniqueSources.length === 0 ? (
          <div className="p-4 text-center">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No sources retrieved yet. Start a conversation to see relevant MDN
              documentation.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {uniqueSources.map((source, index) => (
              <div
                key={source.id}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-purple-500 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded text-white text-xs font-mono flex items-center justify-center">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white text-sm mb-2 group-hover:text-purple-300 transition-colors">
                      {source.title}
                    </h3>

                    <p className="text-xs text-gray-400 leading-relaxed mb-3">
                      {source.snippet}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Retrieved recently</span>
                      </div>

                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        aria-label={`View ${source.title} on MDN`}
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 text-center">
          <p>All sources are from official MDN Web Docs</p>
          <a
            href="https://developer.mozilla.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 mt-1"
          >
            <span>Visit MDN</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

