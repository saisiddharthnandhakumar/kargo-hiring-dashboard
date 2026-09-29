import { describe, expect, it } from "vitest";
import { stripPii } from "./pii-strip";

describe("stripPii", () => {
  it("redacts email addresses", () => {
    const out = stripPii("Contact: rohan.desai.dev@gmail.com for more info.");
    expect(out).not.toContain("rohan.desai.dev@gmail.com");
    expect(out).toContain("[redacted-email]");
  });

  it("redacts an Indian-format mobile number with a country code", () => {
    const out = stripPii("Phone: +91 98204 37810");
    expect(out).not.toContain("98204 37810");
    expect(out).toContain("[redacted-phone]");
  });

  it("redacts a parenthesized-area-code phone number", () => {
    const out = stripPii("Call (022) 4567 8901 anytime");
    expect(out).not.toContain("4567 8901");
    expect(out).toContain("[redacted-phone]");
  });

  it("redacts an address label line", () => {
    const out = stripPii("Address: 42 Marine Drive, Mumbai, Maharashtra 400002");
    expect(out).toContain("[redacted-address]");
    expect(out).not.toContain("Marine Drive");
  });

  it("redacts a standalone 6-digit PIN code", () => {
    const out = stripPii("Mumbai, Maharashtra 400002, India");
    expect(out).not.toContain("400002");
    expect(out).toContain("[redacted-pin]");
  });

  it("does NOT redact the candidate's name or plain metrics", () => {
    const out = stripPii(
      "Rohan Desai\nReduced P1 incidents by 40% in 6 months. Served 40+ freight forwarder clients.",
    );
    expect(out).toContain("Rohan Desai");
    expect(out).toContain("40% in 6 months");
    expect(out).toContain("40+ freight forwarder clients");
  });

  it("does not mangle a plain multi-digit metric with no phone-like separators", () => {
    const out = stripPii("Platform now serves 500000 monthly active users.");
    expect(out).toContain("500000 monthly active users");
  });
});
