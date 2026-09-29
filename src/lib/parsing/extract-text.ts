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
 * - .pdf via pdf-parse (dynamically imported — see next.config.ts's
 *   serverExternalPackages and the note below on why this must never be a
 *   static top-level import)
 * - .txt read as-is
 *
 * Must only be called from server-side code (Node runtime, never edge) —
 * both mammoth and pdf-parse touch Node APIs / the filesystem internally.
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
  // Dynamic import so this never gets pulled into a client bundle and so
  // pdf-parse's module-load side effects only run when actually needed.
  // pdf-parse v2 is class-based (no default-function export like v1).
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return { text: result.text, extension };
  } finally {
    await parser.destroy();
  }
}
