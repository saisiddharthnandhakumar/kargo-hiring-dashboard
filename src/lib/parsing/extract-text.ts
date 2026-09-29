export type SupportedCvExtension = "pdf" | "docx" | "txt";

export interface ExtractedText {
  text: string;
  extension: SupportedCvExtension;
}

export function getSupportedExtension(fileName: string): SupportedCvExtension | null {
  const ext = fileName.trim().toLowerCase().split(".").pop();
  if (ext === "pdf" || ext === "docx" || ext === "txt") return ext;
  return null;
}

/**
 * Extracts raw text from a CV file buffer. Dispatches by extension:
 * - .docx via mammoth
 * - .pdf via unpdf (dynamically imported)
 * - .txt read as-is
 *
 * Must only be called from server-side code (Node runtime, never edge) —
 * mammoth touches Node APIs internally.
 *
 * PDF extraction deliberately uses `unpdf`, not `pdf-parse`: `pdf-parse` v2
 * wraps the standard pdfjs-dist build, which unconditionally constructs
 * `DOMMatrix` instances for some embedded-font glyph paths (seen on real
 * resume PDFs with subsetted fonts, e.g. exported from Word/Google Docs) —
 * that global doesn't exist in Node or Vercel's serverless runtime, so it
 * crashes with `ReferenceError: DOMMatrix is not defined` on exactly the
 * PDFs most likely to show up here. `unpdf` ships a serverless-targeted
 * PDF.js build with those browser-only references stripped, specifically
 * for this class of environment.
 */
export async function extractText(buffer: Buffer, fileName: string): Promise<ExtractedText> {
  const extension = getSupportedExtension(fileName);
  if (!extension) {
    throw new Error(
      `Unsupported CV file type for "${fileName}". Supported formats: PDF, DOCX, TXT.`,
    );
  }

  if (extension === "txt") {
    return { text: buffer.toString("utf-8"), extension };
  }

  if (extension === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value, extension };
  }

  // extension === "pdf"
  // Dynamic import so this never gets pulled into a client bundle.
  const { extractText: extractPdfText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractPdfText(pdf, { mergePages: true });
  return { text, extension };
}
