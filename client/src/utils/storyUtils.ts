/** Returns a human-readable estimated read time string for the given word count. */
export function readTime(wordCount: number): string {
  return `${Math.max(1, Math.round(wordCount / 200))} min read`;
}
