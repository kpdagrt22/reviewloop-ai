import { describe, it, expect } from "vitest";
import { parseCustomersCsv, truthy } from "@/lib/customers/csv";
import { renderTemplate, renderDefaultRequest } from "@/lib/messaging/templates";

describe("parseCustomersCsv", () => {
  it("parses a header + rows and skips nameless rows", () => {
    const csv = [
      "name,email,phone,service_date,service_type,consent_email,consent_sms",
      "Jane Doe,jane@x.com,,2026-06-01,Haircut,true,false",
      ",noname@x.com,,,,,",
      // RFC 4180: a comma inside a quoted field is part of the value, and ""
      // is an escaped quote.
      '"Smith, John ""JD""",jd@x.com,+1555,2026-06-02,Repair,yes,no',
    ].join("\n");
    const rows = parseCustomersCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe("Jane Doe");
    expect(rows[1].name).toBe('Smith, John "JD"');
    expect(rows[1].email).toBe("jd@x.com");
  });

  it("returns empty for header-only or blank input", () => {
    expect(parseCustomersCsv("")).toEqual([]);
    expect(parseCustomersCsv("name,email")).toEqual([]);
  });

  it("interprets consent flags via truthy()", () => {
    expect(truthy("true")).toBe(true);
    expect(truthy("YES")).toBe(true);
    expect(truthy("1")).toBe(true);
    expect(truthy("false")).toBe(false);
    expect(truthy("")).toBe(false);
    expect(truthy(undefined)).toBe(false);
  });
});

describe("message templates", () => {
  const ctx = {
    customerName: "Sam",
    businessName: "Acme Plumbing",
    reviewLink: "https://g.page/acme",
  };

  it("renders {{token}} placeholders", () => {
    expect(renderTemplate("Hi {{name}} from {{business}}: {{link}}", ctx)).toBe(
      "Hi Sam from Acme Plumbing: https://g.page/acme",
    );
  });

  it("also supports [Bracket] style placeholders", () => {
    expect(renderTemplate("Hi [Name], visit [Google Review Link]", ctx)).toBe(
      "Hi Sam, visit https://g.page/acme",
    );
  });

  it("default request includes business name and link, no pressure language", () => {
    const { body } = renderDefaultRequest(ctx);
    expect(body).toContain("Acme Plumbing");
    expect(body).toContain("https://g.page/acme");
    // Neutral ask — must not demand only positive reviews...
    expect(body.toLowerCase()).not.toContain("5 star");
    // ...and must not condition the ask on a positive experience.
    expect(body.toLowerCase()).not.toContain("if you were happy");
    expect(body.toLowerCase()).not.toContain("if you enjoyed");
  });

  it("default request includes opt-out language (consent compliance)", () => {
    const { body } = renderDefaultRequest(ctx);
    expect(body.toLowerCase()).toContain("stop");
  });
});
