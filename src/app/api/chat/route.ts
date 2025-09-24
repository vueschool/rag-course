import { NextRequest, NextResponse } from "next/server";
import { performRAGQuery } from "../../../../scripts/rag-query";
import { SearchResult } from "../../../../scripts/semantic-search";
import slug from "slug";

/**
 * Convert heading text to URL slug format for MDN fragment identifiers
 */
function headingToSlug(headingText: string | null): string {
  if (!headingText) {
    return "";
  }

  // Use slug package with MDN-compatible options:
  // - Use underscores instead of hyphens (MDN style)
  // - Remove periods and other punctuation
  return slug(headingText, {
    replacement: "_", // replace spaces with underscores
    remove: /[.]/g, // remove periods
    lower: true,
  });
}

/**
 * Generate MDN URL from document slug and optional heading context
 */
function generateMDNUrl(
  slug: string | null,
  headingContext: string | null = null
): string {
  const baseUrl = slug
    ? `https://developer.mozilla.org/en-US/docs/${slug}`
    : "https://developer.mozilla.org/en-US/docs/";

  if (headingContext) {
    const headingSlug = headingToSlug(headingContext);
    if (headingSlug) {
      return `${baseUrl}#${headingSlug}`;
    }
  }

  return baseUrl;
}

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      limit = 5,
      threshold = 0.5,
      model = "gpt-4o-mini",
    } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.VOYAGE_API_KEY || !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing required API keys" },
        { status: 500 }
      );
    }

    console.log(`🔍 RAG Query: "${message}"`);

    // Perform RAG query
    const ragResponse = await performRAGQuery(message, {
      limit,
      similarityThreshold: threshold,
      model,
    });

    // Transform sources to match the frontend interface
    const transformedSources = (ragResponse.sources as SearchResult[]).map(
      (source, index) => ({
        id: String(index + 1),
        title: source.documentTitle,
        snippet: source.content.substring(0, 200) + "...",
        url: generateMDNUrl(source.documentSlug, source.headingContext),
        similarity: source.similarity,
        sourceFilePath: source.sourceFilePath,
        chunkId: source.chunkId,
      })
    );

    return NextResponse.json({
      content: ragResponse.answer,
      sources: transformedSources,
      tokensUsed: ragResponse.tokensUsed,
    });
  } catch (error) {
    console.error("RAG API error:", error);

    return NextResponse.json(
      {
        error: "Failed to process question",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
