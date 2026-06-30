// Shared forum helpers usable from both client and server (no runtime directive).

/**
 * Count words in a rich-text (HTML) response. Strips tags and entities, then
 * counts whitespace-separated tokens. Used for the `forumMinWords` gate.
 */
export function countWords(html: string): number {
  const text = html
    .replace(/<[^>]*>/g, " ") // strip tags
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z]+;/gi, " ") // other named entities
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return 0;
  return text.split(" ").length;
}
