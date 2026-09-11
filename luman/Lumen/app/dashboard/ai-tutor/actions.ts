"use server";

import { PDFParse } from "pdf-parse";
import officeParser from "officeparser";
import { YoutubeTranscript } from "youtube-transcript";
import { cookies } from "next/headers";
import { saveTutorSessionAPI } from "@/utils/api";
import {
  generateCurriculumFromLLM,
  VALID_SOURCE_TYPES,
  type SourceType,
  type TutorCurriculum,
} from "@/utils/ai/tutor-generator";

export interface ExtractionResult {
  success: boolean;
  text?: string;
  error?: string;
}

export interface GenerateCurriculumResult {
  success: boolean;
  session?: {
    id: string;
    curriculum: TutorCurriculum;
  };
  error?: string;
}

async function readUploadedFile(formData: FormData): Promise<Buffer> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("NO FILE UPLOADED");
  }

  if (file.size === 0) {
    throw new Error("UPLOADED FILE IS EMPTY");
  }

  return Buffer.from(await file.arrayBuffer());
}

export async function extractFromPDF(
  formData: FormData
): Promise<ExtractionResult> {
  let parser: PDFParse | undefined;

  try {
    const buffer = await readUploadedFile(formData);
    // Set worker path for server-side PDF parsing
    PDFParse.setWorker(require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs"));
    parser = new PDFParse({ data: buffer });

    const result = await parser.getText();
    const text = result.text.trim();

    if (!text) {
      return { success: false, error: "NO TEXT COULD BE EXTRACTED FROM PDF" };
    }

    return { success: true, text };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "FAILED TO PARSE PDF",
    };
  } finally {
    await parser?.destroy();
  }
}

export async function extractFromPPTX(
  formData: FormData
): Promise<ExtractionResult> {
  try {
    const buffer = await readUploadedFile(formData);
    const ast = await officeParser.parseOffice(buffer, { fileType: "pptx" });
    const text = ast.toText().trim();

    if (!text) {
      return { success: false, error: "NO TEXT COULD BE EXTRACTED FROM PPTX" };
    }

    return { success: true, text };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "FAILED TO PARSE PPTX",
    };
  }
}

export async function extractFromYouTube(
  url: string
): Promise<ExtractionResult> {
  try {
    if (!url || !url.trim()) {
      return { success: false, error: "YOUTUBE URL REQUIRED" };
    }

    const segments = await YoutubeTranscript.fetchTranscript(url.trim());
    const text = segments
      .map((segment) => segment.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (!text) {
      return { success: false, error: "NO TRANSCRIPT AVAILABLE FOR THIS VIDEO" };
    }

    return { success: true, text };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "FAILED TO FETCH YOUTUBE TRANSCRIPT",
    };
  }
}

export async function extractFromText(text: string): Promise<ExtractionResult> {
  try {
    if (!text || !text.trim()) {
      return { success: false, error: "TEXT INPUT CANNOT BE EMPTY" };
    }

    // eslint-disable-next-line no-control-regex
    const sanitized = text
      .replace(/\x00/g, "")
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, "")
      .trim();

    if (!sanitized) {
      return { success: false, error: "TEXT INPUT CANNOT BE EMPTY" };
    }

    return { success: true, text: sanitized };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "FAILED TO PROCESS TEXT",
    };
  }
}

export async function generateTutorCurriculum(
  sourceText: string,
  sourceType: string,
  customTopic?: string
): Promise<GenerateCurriculumResult> {
  try {
    if (!sourceText || !sourceText.trim()) {
      return { success: false, error: "SOURCE TEXT CANNOT BE EMPTY" };
    }

    if (!VALID_SOURCE_TYPES.includes(sourceType as SourceType)) {
      return { success: false, error: "INVALID SOURCE TYPE" };
    }

    const cookieStore = await cookies();
    const userCookie = cookieStore.get("lumen_user")?.value;
    let userId: string | undefined;
    if (userCookie) {
      try {
        const parsed = JSON.parse(userCookie);
        userId = parsed.id || parsed._id;
      } catch {}
    }

    const curriculum = await generateCurriculumFromLLM(
      sourceText,
      sourceType as SourceType,
      customTopic
    );

    const savedSession = await saveTutorSessionAPI({
      userId,
      title: curriculum.title,
      sourceType,
      sourceContent: sourceText,
      curriculum,
    });

    return { success: true, session: { id: savedSession.id, curriculum } };
  } catch (error) {
    console.error("Failed to generate tutor curriculum:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "FAILED TO GENERATE CURRICULUM",
    };
  }
}
