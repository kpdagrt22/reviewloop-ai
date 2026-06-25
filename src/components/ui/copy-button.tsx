"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Copies the given text to the clipboard and shows a short confirmation. */
export function CopyButton({
  text,
  label = "Copy",
  ...props
}: { text: string; label?: string } & Omit<ButtonProps, "onClick" | "children">) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback for environments without async clipboard access.
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <Button variant="outline" onClick={handleCopy} {...props}>
      {copied ? "Copied!" : label}
    </Button>
  );
}
