"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { saveDraftAction, markPostedAction, regenerateReplyAction } from "../actions";

export function ReplyEditor({
  reviewId,
  draftId,
  initialText,
  posted,
}: {
  reviewId: string;
  draftId: string | null;
  initialText: string;
  posted: boolean;
}) {
  const [text, setText] = useState(initialText);

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="input"
        disabled={!draftId}
      />

      <div className="rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
        Review before posting. Do not include private customer information. ReviewLoop never
        posts replies for you.
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={text} label="Copy reply" />

        {draftId ? (
          <form action={saveDraftAction}>
            <input type="hidden" name="draftId" value={draftId} />
            <input type="hidden" name="draftText" value={text} />
            <Button type="submit" variant="outline">
              Save edits
            </Button>
          </form>
        ) : null}

        <form action={regenerateReplyAction}>
          <input type="hidden" name="reviewId" value={reviewId} />
          <Button type="submit" variant="ghost">
            Regenerate
          </Button>
        </form>

        {draftId && !posted ? (
          <form action={markPostedAction}>
            <input type="hidden" name="draftId" value={draftId} />
            <input type="hidden" name="reviewId" value={reviewId} />
            <Button type="submit">Mark as posted</Button>
          </form>
        ) : null}

        {posted ? (
          <span className="text-sm font-medium text-green-600">✓ Posted</span>
        ) : null}
      </div>
    </div>
  );
}
