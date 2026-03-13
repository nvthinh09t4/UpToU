/**
 * SEOHead — injects per-page document metadata using React 19's native tag
 * hoisting. No external library required; <title>, <meta>, and <link> rendered
 * anywhere in the tree are automatically moved to <head>.
 */

const SITE_NAME = 'UpToU';
const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://uptou.com';
const DEFAULT_DESCRIPTION =
  'UpToU — Read curated stories, interact with content, earn credits and level up across finance, health, technology and more.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

interface SEOHeadProps {
  /** Page-specific title. Rendered as "<title> | UpToU". Omit for the home page. */
  title?: string;
  description?: string;
  /** Absolute URL of the OG image. Falls back to the default site image. */
  image?: string | null;
  /** Canonical URL for this page. */
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string | null;
  author?: string | null;
  keywords?: string[];
  /** Set true on private/auth routes that should not be indexed. */
  noIndex?: boolean;
}

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  url,
  type = 'website',
  publishedTime,
  author,
  keywords,
  noIndex = false,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Read, React & Earn`;
  const desc = description || DEFAULT_DESCRIPTION;
  const ogImage = image || DEFAULT_OG_IMAGE;
  const canonical = url || SITE_URL;

  return (
    <>
      {/* ── Basic ─────────────────────────────────────────────────── */}
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonical} />

      {/* ── Open Graph ────────────────────────────────────────────── */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}

      {/* ── Twitter Card ──────────────────────────────────────────── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
    </>
  );
}

/** Renders a JSON-LD structured data block. Safe against XSS via JSON.stringify escaping. */
export function JsonLd({ data }: { data: object }) {
  // Escape closing script tags that could appear inside JSON strings
  const json = JSON.stringify(data).replace(/<\/script>/gi, '<\\/script>');
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
