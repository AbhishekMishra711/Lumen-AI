import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

export const TutorCurriculumSchema = z.object({
  title: z.string(),
  difficulty: z.enum(["Novice", "Adept", "Master"]),
  summary: z.string().describe("High-level overview written in an engaging tone"),
  modules: z.array(
    z.object({
      module_number: z.number(),
      title: z.string(),
      mentor_dialogue: z
        .string()
        .describe("A 2-3 sentence conversational intro from the Knight Mentor"),
      detailed_explanation: z
        .string()
        .describe("Deep dive teaching of the concept with examples"),
      key_takeaways: z.array(z.string()),
      checkpoint_question: z.object({
        question: z.string(),
        options: z.array(z.string()).length(4),
        correct_index: z.number().min(0).max(3),
        explanation: z.string(),
      }),
    })
  ),
});

export type TutorCurriculum = z.infer<typeof TutorCurriculumSchema>;

// Must match the DB CHECK constraint on tutor_sessions.source_type (see db/migrations/004_*.sql)
export const VALID_SOURCE_TYPES = ["pdf", "youtube", "text", "pptx"] as const;
export type SourceType = (typeof VALID_SOURCE_TYPES)[number];

// Anthropic's structured-output JSON Schema dialect doesn't enforce enum/length/range
// keywords as hard constraints (they get surfaced to the model as description hints
// instead). The client-side .parse() step still validates the raw model output against
// the full TutorCurriculumSchema and throws on violation, so correctness is guaranteed -
// but we restate the constraints in the prompt itself to reduce how often that happens.
const MAX_SOURCE_CHARS = 60_000;

function buildPrompt(sourceText: string, sourceType: SourceType, customTopic?: string) {
  const truncated = sourceText.length > MAX_SOURCE_CHARS;
  const content = truncated ? sourceText.slice(0, MAX_SOURCE_CHARS) : sourceText;

  const system = `You are the Knight Mentor, an AI tutor inside a gamified study app called Lumen.
Given source material extracted from a user's ${sourceType.toUpperCase()} upload, generate a structured study curriculum.

Rules:
- "difficulty" must be exactly one of: "Novice", "Adept", "Master" (no other values).
- Each module's "checkpoint_question.options" must contain EXACTLY 4 strings.
- "checkpoint_question.correct_index" must be the 0-based index into "options" of the correct answer (an integer from 0 to 3 inclusive).
- "mentor_dialogue" should sound like an encouraging, slightly theatrical fantasy mentor speaking directly to the student.
- "detailed_explanation" should actually teach the concept with concrete examples, not just restate the summary.
- Break the material into a sensible number of modules (typically 3-6) based on how much distinct content is present.
- Base the curriculum only on the provided source material.`;

  const focus = customTopic?.trim()
    ? `Focus the curriculum specifically on this topic within the source material: "${customTopic.trim()}". Ignore unrelated parts of the source.`
    : "Cover the source material comprehensively.";

  const truncationNotice = truncated
    ? "\n\n[NOTE: The source material below was truncated for length. Base the curriculum on what is available.]"
    : "";

  const user = `${focus}${truncationNotice}\n\n--- SOURCE MATERIAL ---\n${content}`;

  return { system, user };
}

export async function generateCurriculumFromLLM(
  sourceText: string,
  sourceType: SourceType,
  customTopic?: string
): Promise<TutorCurriculum> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY IS NOT CONFIGURED");
  }

  const anthropic = new Anthropic({ apiKey });
  const { system, user } = buildPrompt(sourceText, sourceType, customTopic);

  const message = await anthropic.messages.parse({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
    max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS) || 8192,
    system,
    messages: [{ role: "user", content: user }],
    output_config: {
      format: zodOutputFormat(TutorCurriculumSchema),
    },
  });

  if (!message.parsed_output) {
    throw new Error(
      `MODEL DID NOT RETURN A CURRICULUM (stop_reason: ${message.stop_reason ?? "unknown"})`
    );
  }

  return message.parsed_output;
}
