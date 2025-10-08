"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, ExternalLink, User, Bot } from "lucide-react";
import { clsx } from "clsx";
import remarkGfm from "remark-gfm";
import { CitationTooltip } from "./CitationTooltip";
import { ChatMessageLoading } from "./ChatMessageLoading";

export interface ChatSource {
  id: string;
  title: string;
  content: string;
  url: string;
}

export interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date | null;
  sources?: ChatSource[];
}

interface ChatMessageProps {
  message: Message;
}

interface CodeBlockProps {
  children: string;
  className?: string;
  inline?: boolean;
}

function CodeBlock({ children, className, inline }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "text";

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code className="bg-gray-800 text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between bg-gray-900 px-4 py-2 rounded-t-lg border-b border-gray-700">
        <span className="text-sm text-gray-400 font-mono">{language}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-2 py-1 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          background: "#1e1e2e",
        }}
        wrapLongLines={true}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

function processCitations(
  content: string,
  sources?: ChatSource[]
): React.ReactNode[] {
  console.log("sources", sources);
  if (!sources || sources.length === 0) {
    return [content];
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Find citation patterns like [1], [2], etc.
  const citationRegex = /\[(\d+)\]/g;
  let match;

  while ((match = citationRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const citationNumber = parseInt(match[1]);
    const source = sources.find((s) => s.id === citationNumber.toString());

    // Add text before citation
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    // Add citation component
    if (source) {
      parts.push(
        <CitationTooltip
          key={`citation-${citationNumber}-${match.index}`}
          source={source}
          citationNumber={citationNumber}
        />
      );
    } else {
      parts.push(fullMatch);
    }

    lastIndex = match.index + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.type === "user";

  return message.content ? (
    <div
      className={clsx("flex gap-4", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div
        className={clsx(
          "max-w-4xl rounded-lg p-4",
          isUser
            ? "bg-blue-600 text-white ml-auto"
            : "bg-gray-800 text-gray-100"
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <div className="prose prose-invert prose-purple max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                code: ({ className, children, ...props }: any) => {
                  const content = String(children).replace(/\n$/, "");
                  const inline = !String(children).includes("\n");

                  return (
                    <CodeBlock inline={inline} className={className} {...props}>
                      {content}
                    </CodeBlock>
                  );
                },
                p: ({ children }) => {
                  // Process citations for regular paragraphs
                  const processedChildren = React.Children.map(
                    children,
                    (child) => {
                      if (typeof child === "string") {
                        return processCitations(child, message.sources);
                      }
                      return child;
                    }
                  );

                  return <p className="mb-4 last:mb-0">{processedChildren}</p>;
                },
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold mb-3 text-white">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold mb-2 text-white">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-4 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-4 space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-gray-200">{children}</li>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
                  >
                    {children}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-300 my-4">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border border-gray-700 rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-900">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-700 px-4 py-2 text-left text-white font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-700 px-4 py-2 text-gray-200">
                    {children}
                  </td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">
              Sources:
            </h4>
            <div className="grid gap-2">
              {message.sources.map((source, index) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 bg-gray-900 rounded border border-gray-700 hover:border-purple-500 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded font-mono">
                          {index + 1}
                        </span>
                        <h5 className="font-medium text-sm text-white truncate group-hover:text-purple-300">
                          {source.title}
                        </h5>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {source.content.substring(0, 100)}...
                      </p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-purple-400 flex-shrink-0 mt-0.5" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        {message.timestamp && (
          <div className="mt-3 text-xs opacity-70">
            {message.timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  ) : (
    <ChatMessageLoading />
  );
}
