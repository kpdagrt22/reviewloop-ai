"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { createTestimonialAction, createSocialPostAction } from "../actions";

export function TestimonialComposer({
  reviewId,
  defaultQuote,
  defaultName,
  defaultServiceType,
  defaultSocialPost,
}: {
  reviewId: string;
  defaultQuote: string;
  defaultName: string;
  defaultServiceType: string;
  defaultSocialPost: string;
}) {
  const [quote, setQuote] = useState(defaultQuote);
  const [displayName, setDisplayName] = useState(defaultName);
  const [serviceType, setServiceType] = useState(defaultServiceType);
  const [post, setPost] = useState(defaultSocialPost);
  const [platform, setPlatform] = useState("facebook");

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Confirm you have the customer&apos;s permission to publish their words and name.
        Republishing a review as marketing may require their consent.
      </div>
      <div className="grid gap-6 md:grid-cols-2">
      {/* Testimonial */}
      <div>
        <h3 className="font-semibold text-gray-900">Testimonial card</h3>
        <p className="mb-3 text-sm text-gray-500">Edit, then save it to your testimonial library.</p>
        <textarea
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          rows={4}
          className="input"
          placeholder="Customer quote…"
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input"
            placeholder="Display name"
          />
          <input
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="input"
            placeholder="Service type"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <CopyButton text={quote} label="Copy quote" />
          <form action={createTestimonialAction}>
            <input type="hidden" name="reviewId" value={reviewId} />
            <input type="hidden" name="quote" value={quote} />
            <input type="hidden" name="displayName" value={displayName} />
            <input type="hidden" name="serviceType" value={serviceType} />
            <Button type="submit">Save testimonial</Button>
          </form>
        </div>
      </div>

      {/* Social post */}
      <div>
        <h3 className="font-semibold text-gray-900">Social post</h3>
        <p className="mb-3 text-sm text-gray-500">Text-only draft. Post it yourself when ready.</p>
        <textarea
          value={post}
          onChange={(e) => setPost(e.target.value)}
          rows={6}
          className="input"
          placeholder="Social post draft…"
        />
        <div className="mt-2">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="input"
          >
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
          </select>
        </div>
        <div className="mt-3 flex gap-2">
          <CopyButton text={post} label="Copy post" />
          <form action={createSocialPostAction}>
            <input type="hidden" name="reviewId" value={reviewId} />
            <input type="hidden" name="platform" value={platform} />
            <input type="hidden" name="postText" value={post} />
            <Button type="submit">Save social post</Button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
