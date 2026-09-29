import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { extractText, getSupportedExtension } from "./extract-text";
import { stripPii } from "./pii-strip";

const SEED_HIRES_DIR = path.join(process.cwd(), "seed", "hires");
const FIXTURES_DIR = path.join(process.cwd(), "src", "lib", "parsing", "__fixtures__");

describe("getSupportedExtension", () => {
  it("recognizes pdf, docx, txt case-insensitively", () => {
    expect(getSupportedExtension("resume.PDF")).toBe("pdf");
    expect(getSupportedExtension("cv_01.docx")).toBe("docx");
    expect(getSupportedExtension("notes.txt")).toBe("txt");
  });

  it("returns null for unsupported extensions", () => {
    expect(getSupportedExtension("resume.pages")).toBeNull();
    expect(getSupportedExtension("no-extension")).toBeNull();
  });
});

describe("extractText — real seed .docx files", () => {
  it("extracts non-empty, legible text from a real historical-hire CV", async () => {
    const filePath = path.join(SEED_HIRES_DIR, "cv_01_rohan_desai.docx");
    const buffer = fs.readFileSync(filePath);
    const { text, extension } = await extractText(buffer, "cv_01_rohan_desai.docx");

    expect(extension).toBe("docx");
    expect(text.length).toBeGreaterThan(200);
    expect(text).toContain("Rohan Desai");
  });

  it("PII-stripping the real extracted text removes the contact line but keeps the evidence", async () => {
    const filePath = path.join(SEED_HIRES_DIR, "cv_01_rohan_desai.docx");
    const buffer = fs.readFileSync(filePath);
    const { text } = await extractText(buffer, "cv_01_rohan_desai.docx");
    const stripped = stripPii(text);

    expect(stripped).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    expect(stripped).toContain("Rohan Desai");
    expect(stripped.toLowerCase()).toContain("bill of lading");
  });

  it("throws a clear error for an unsupported file type", async () => {
    await expect(extractText(Buffer.from("hi"), "resume.pages")).rejects.toThrow(
      /unsupported/i,
    );
  });
});

describe("extractText — .txt", () => {
  it("reads plain text as-is", async () => {
    const buffer = fs.readFileSync(path.join(FIXTURES_DIR, "sample.txt"));
    const { text, extension } = await extractText(buffer, "sample.txt");
    expect(extension).toBe("txt");
    expect(text).toContain("Test Candidate");
    expect(text).toContain("test.candidate@example.com");
  });
});

describe("extractText — .pdf", () => {
  it("extracts text from a real PDF via unpdf", async () => {
    const buffer = fs.readFileSync(path.join(FIXTURES_DIR, "sample.pdf"));
    const { text, extension } = await extractText(buffer, "sample.pdf");
    expect(extension).toBe("pdf");
    expect(text).toContain("Test Candidate");
    expect(text).toContain("+91 98765 43210");
  });

  // Regression test for a real production failure: pdf-parse (the previous
  // PDF library) wraps the standard pdfjs-dist build, which unconditionally
  // constructs `DOMMatrix` for certain embedded-font glyph paths — a
  // browser-only global that doesn't exist in Node/Vercel, so it crashed
  // with "ReferenceError: DOMMatrix is not defined" on real resume PDFs
  // with subsetted fonts (common from Word/Google Docs exports), while
  // passing on simpler test PDFs using system fonts. This fixture embeds a
  // real subsetted TrueType font (via pdf-lib + fontkit) to reproduce that
  // exact shape and confirm unpdf's serverless PDF.js build handles it.
  it("extracts text from a PDF with a real embedded/subsetted font (regression: DOMMatrix crash)", async () => {
    const buffer = fs.readFileSync(path.join(FIXTURES_DIR, "embedded-font.pdf"));
    const { text, extension } = await extractText(buffer, "embedded-font.pdf");
    expect(extension).toBe("pdf");
    expect(text).toContain("Rohan Mehta");
    expect(text).toContain("Senior Product Manager");
  });
});
