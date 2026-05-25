import sanitizeHtml from "sanitize-html";

import { cn } from "@/lib/utils";

export interface RichTextViewProps {
  html: string | null | undefined;
  className?: string;
  emptyText?: string;
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "s",
    "a",
    "ul",
    "ol",
    "li",
    "h2",
    "h3",
    "blockquote",
    "code",
    "pre",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  allowedSchemes: ["http", "https", "mailto"],
};

export function RichTextView({ html, className, emptyText }: RichTextViewProps) {
  if (!html || html.trim() === "" || html === "<p></p>") {
    if (!emptyText) return null;
    return (
      <p className={cn("text-sm italic text-muted-foreground", className)}>
        {emptyText}
      </p>
    );
  }
  const clean = sanitizeHtml(html, SANITIZE_OPTIONS);
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-sm prose-headings:font-semibold prose-a:text-brand-teal-700",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
