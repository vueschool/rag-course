"use client";

import { useState, useRef, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import { ChatSource } from "./ChatMessage";

interface CitationTooltipProps {
  source: ChatSource;
  citationNumber: number;
}

export function CitationTooltip({
  source,
  citationNumber,
}: CitationTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = triggerRect.bottom + 8;
      let left = triggerRect.left;

      // Adjust horizontal position if tooltip would overflow
      if (left + tooltipRect.width > viewportWidth - 16) {
        left = viewportWidth - tooltipRect.width - 16;
      }
      if (left < 16) {
        left = 16;
      }

      // Adjust vertical position if tooltip would overflow
      if (top + tooltipRect.height > viewportHeight - 16) {
        top = triggerRect.top - tooltipRect.height - 8;
      }

      setPosition({ top, left });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isVisible]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsVisible(!isVisible);
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsVisible(!isVisible);
    } else if (e.key === "Escape") {
      setIsVisible(false);
    }
  };

  return (
    <>
      <span
        ref={triggerRef}
        className={clsx(
          "inline-flex items-center justify-center w-5 h-5 text-xs font-mono font-semibold rounded cursor-pointer transition-all",
          "bg-purple-600 text-white hover:bg-purple-500",
          "focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-800",
          isVisible && "bg-purple-500"
        )}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Citation ${citationNumber}: ${source.title}`}
        aria-expanded={isVisible}
      >
        {citationNumber}
      </span>

      {isVisible && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setIsVisible(false)}
          />

          <div
            ref={tooltipRef}
            className={clsx(
              "fixed z-50 w-80 p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-xl",
              "animate-in fade-in-0 zoom-in-95 duration-200"
            )}
            style={{
              top: position.top,
              left: position.left,
            }}
            role="tooltip"
            aria-live="polite"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-white text-sm leading-tight">
                  {source.title}
                </h4>
                <span className="text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                  {citationNumber}
                </span>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed">
                {source.snippet}
              </p>

              <div className="pt-2 border-t border-gray-700">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>View on MDN</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Arrow */}
            <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 border-l border-t border-gray-700 rotate-45" />
          </div>
        </>
      )}
    </>
  );
}

