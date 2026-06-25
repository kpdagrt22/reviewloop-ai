import { describe, it, expect } from "vitest";
import {
  canTransition,
  assertTransition,
  timestampFieldFor,
} from "@/lib/reviews/request-status";

describe("review request status transitions", () => {
  it("allows the forward path draft → sent → clicked → completed", () => {
    expect(canTransition("draft", "sent")).toBe(true);
    expect(canTransition("sent", "clicked")).toBe(true);
    expect(canTransition("clicked", "completed")).toBe(true);
  });

  it("allows skipping clicked (sent → completed)", () => {
    expect(canTransition("sent", "completed")).toBe(true);
  });

  it("allows cancelling from open states", () => {
    expect(canTransition("draft", "cancelled")).toBe(true);
    expect(canTransition("sent", "cancelled")).toBe(true);
  });

  it("forbids backward transitions", () => {
    expect(canTransition("sent", "draft")).toBe(false);
    expect(canTransition("completed", "draft")).toBe(false);
    expect(canTransition("clicked", "sent")).toBe(false);
  });

  it("forbids leaving terminal states", () => {
    expect(canTransition("completed", "sent")).toBe(false);
    expect(canTransition("cancelled", "sent")).toBe(false);
  });

  it("forbids no-op transitions", () => {
    expect(canTransition("sent", "sent")).toBe(false);
  });

  it("assertTransition throws on illegal moves", () => {
    expect(() => assertTransition("completed", "draft")).toThrow();
    expect(() => assertTransition("sent", "completed")).not.toThrow();
  });

  it("maps statuses to their timestamp column", () => {
    expect(timestampFieldFor("sent")).toBe("sent_at");
    expect(timestampFieldFor("clicked")).toBe("clicked_at");
    expect(timestampFieldFor("completed")).toBe("completed_at");
    expect(timestampFieldFor("draft")).toBeNull();
  });
});
