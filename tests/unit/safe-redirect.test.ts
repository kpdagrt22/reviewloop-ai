import { describe, it, expect } from "vitest";
import { safeNextPath } from "@/lib/utils/safe-redirect";

describe("safeNextPath (open-redirect guard)", () => {
  it("allows normal same-origin paths", () => {
    expect(safeNextPath("/app")).toBe("/app");
    expect(safeNextPath("/app/reviews/123")).toBe("/app/reviews/123");
    expect(safeNextPath("/app?tab=x")).toBe("/app?tab=x");
  });

  it("rejects protocol-relative and backslash off-site values", () => {
    expect(safeNextPath("//evil.com")).toBe("/app");
    expect(safeNextPath("/\\evil.com")).toBe("/app");
    expect(safeNextPath("https://evil.com")).toBe("/app");
    expect(safeNextPath("javascript:alert(1)")).toBe("/app");
  });

  it("rejects non-string and empty input", () => {
    expect(safeNextPath(null)).toBe("/app");
    expect(safeNextPath(undefined)).toBe("/app");
    expect(safeNextPath("")).toBe("/app");
    expect(safeNextPath(42)).toBe("/app");
  });

  it("honors a custom fallback", () => {
    expect(safeNextPath("//evil.com", "/")).toBe("/");
  });
});
