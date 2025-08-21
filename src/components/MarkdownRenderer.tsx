"use client";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  showCopyButton?: boolean;
}

export default function MarkdownRenderer({
  content,
  className = "",
  showCopyButton = true,
}: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: (
            props: React.HTMLAttributes<HTMLElement> & {
              children: React.ReactNode;
            }
          ) => {
            const { className, children, ...otherProps } = props;
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match;
            return !isInline ? (
              <div className="relative">
                <pre className={className}>
                  <code {...otherProps}>{children}</code>
                </pre>
                {showCopyButton && (
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(String(children))
                    }
                    className="absolute top-2 right-2 p-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white text-xs"
                    title="Copy code"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <code className={className} {...otherProps}>
                {children}
              </code>
            );
          },
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
