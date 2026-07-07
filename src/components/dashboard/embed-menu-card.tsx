"use client";

import { useMemo, useState } from "react";
import { Check, Code2, Copy } from "lucide-react";
import { buildMenuEmbedSnippet } from "@/lib/menu-embed-snippet";
import { Button } from "@/components/ui/button";

interface EmbedMenuCardProps {
  slug: string;
  restaurantName: string;
}

export function EmbedMenuCard({ slug, restaurantName }: EmbedMenuCardProps) {
  const [copied, setCopied] = useState(false);
  const snippet = useMemo(
    () => buildMenuEmbedSnippet(slug, restaurantName),
    [slug, restaurantName]
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.getElementById("menu-embed-snippet") as HTMLInputElement | null;
      input?.select();
      document.execCommand("copy");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="air-card air-card-pad">
      <div className="mb-4 flex items-center gap-3">
        <Code2 className="h-5 w-5 text-muted-foreground" />
        <h2 className="air-section-title">Embed on Your Website</h2>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Paste this iframe into your website builder or HTML to show your live menu on any page.
      </p>

      <label htmlFor="menu-embed-snippet" className="air-label">
        Embed code
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="menu-embed-snippet"
          readOnly
          value={snippet}
          className="air-input min-w-0 flex-1 font-mono text-xs"
          onFocus={(event) => event.currentTarget.select()}
        />
        <Button type="button" onClick={() => void handleCopy()} className="shrink-0 gap-2">
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Code
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
