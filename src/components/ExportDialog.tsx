"use client";

import { useState } from "react";
import { X, Download, FileText, Hash, Copy, Check } from "lucide-react";
import { clsx } from "clsx";
import { Message } from "./ChatMessage";

interface ExportDialogProps {
  messages: Message[];
  onClose: () => void;
}

type ExportFormat = "markdown" | "plaintext";

export function ExportDialog({ messages, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [copied, setCopied] = useState(false);

  const formatMessages = (format: ExportFormat): string => {
    const timestamp = new Date().toISOString().split("T")[0];

    if (format === "markdown") {
      let content = `# MDN Developer Chat Export\n\n`;
      content += `**Exported:** ${timestamp}\n\n`;
      content += `---\n\n`;

      messages.forEach((message, index) => {
        const role = message.type === "user" ? "User" : "AI Assistant";
        const time = message.timestamp.toLocaleTimeString();

        content += `## ${role} (${time})\n\n`;
        content += `${message.content}\n\n`;

        if (message.sources && message.sources.length > 0) {
          content += `### Sources\n\n`;
          message.sources.forEach((source, sourceIndex) => {
            content += `${sourceIndex + 1}. [${source.title}](${source.url})\n`;
            content += `   ${source.snippet}\n\n`;
          });
        }

        if (index < messages.length - 1) {
          content += `---\n\n`;
        }
      });

      return content;
    } else {
      let content = `MDN Developer Chat Export\n`;
      content += `Exported: ${timestamp}\n`;
      content += `${"=".repeat(50)}\n\n`;

      messages.forEach((message, index) => {
        const role = message.type === "user" ? "User" : "AI Assistant";
        const time = message.timestamp.toLocaleTimeString();

        content += `${role} (${time})\n`;
        content += `${"-".repeat(20)}\n`;
        content += `${message.content}\n\n`;

        if (message.sources && message.sources.length > 0) {
          content += `Sources:\n`;
          message.sources.forEach((source, sourceIndex) => {
            content += `${sourceIndex + 1}. ${source.title}\n`;
            content += `   ${source.snippet}\n`;
            content += `   ${source.url}\n\n`;
          });
        }

        if (index < messages.length - 1) {
          content += `${"=".repeat(50)}\n\n`;
        }
      });

      return content;
    }
  };

  const handleCopy = async () => {
    const content = formatMessages(format);
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = formatMessages(format);
    const filename = `mdn-chat-export-${
      new Date().toISOString().split("T")[0]
    }.${format === "markdown" ? "md" : "txt"}`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const previewContent = formatMessages(format);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Export Conversation
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Download or copy your chat history
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selection */}
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-sm font-medium text-white mb-3">Export Format</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setFormat("markdown")}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                format === "markdown"
                  ? "bg-purple-600 border-purple-500 text-white"
                  : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
              )}
            >
              <Hash className="w-4 h-4" />
              Markdown
            </button>
            <button
              onClick={() => setFormat("plaintext")}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                format === "plaintext"
                  ? "bg-purple-600 border-purple-500 text-white"
                  : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
              )}
            >
              <FileText className="w-4 h-4" />
              Plain Text
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-6 pb-0">
            <h3 className="text-sm font-medium text-white mb-3">Preview</h3>
          </div>
          <div className="flex-1 mx-6 mb-6 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <pre className="p-4 overflow-auto h-full text-sm text-gray-300 font-mono whitespace-pre-wrap">
              {previewContent}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {messages.length} message{messages.length !== 1 ? "s" : ""} to
            export
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
