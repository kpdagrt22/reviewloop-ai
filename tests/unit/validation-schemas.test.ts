import { describe, it, expect } from "vitest";
import { customerSchema, reviewSchema } from "@/lib/validation/schemas";

describe("customerSchema", () => {
  it("requires a name", () => {
    expect(customerSchema.safeParse({ name: "" }).success).toBe(false);
    expect(customerSchema.safeParse({ name: "Jane Doe" }).success).toBe(true);
  });

  it("defaults consent flags to false (opt-in, never assumed)", () => {
    const res = customerSchema.parse({ name: "Jane Doe" });
    expect(res.consentEmail).toBe(false);
    expect(res.consentSms).toBe(false);
  });

  it("accepts explicit consent and a valid email", () => {
    const res = customerSchema.safeParse({
      name: "Jane",
      email: "jane@example.com",
      consentEmail: true,
      consentSms: true,
    });
    expect(res.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(customerSchema.safeParse({ name: "Jane", email: "not-an-email" }).success).toBe(false);
  });
});

describe("reviewSchema", () => {
  const base = { platform: "Google", reviewText: "Good service overall" };

  it("requires a rating between 1 and 5", () => {
    expect(reviewSchema.safeParse({ ...base }).success).toBe(false); // missing rating
    expect(reviewSchema.safeParse({ ...base, rating: 0 }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...base, rating: 6 }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...base, rating: 5 }).success).toBe(true);
  });

  it("coerces a string rating from the form", () => {
    const res = reviewSchema.safeParse({ ...base, rating: "4" });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.rating).toBe(4);
  });

  it("requires platform and non-trivial review text", () => {
    expect(reviewSchema.safeParse({ platform: "", rating: 5, reviewText: "ok yes" }).success).toBe(false);
    expect(reviewSchema.safeParse({ platform: "Google", rating: 5, reviewText: "x" }).success).toBe(false);
  });

  it("accepts optional customer and review-request uuids", () => {
    const res = reviewSchema.safeParse({
      ...base,
      rating: 5,
      customerId: "11111111-1111-1111-1111-111111111111",
      reviewRequestId: "22222222-2222-2222-2222-222222222222",
    });
    expect(res.success).toBe(true);
  });
});
