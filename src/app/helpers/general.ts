import slug from "slug";

/**
 * Convert heading text to URL slug format for MDN fragment identifiers
 */
export function headingToSlug(headingText: string | null): string {
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
export function generateMDNUrl(
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
