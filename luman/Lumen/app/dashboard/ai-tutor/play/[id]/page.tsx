"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import heroImage from "@/Assets/hero.png";
import { getTutorSessionAPI } from "@/utils/api";
import { generateTutorCurriculum } from "@/app/dashboard/ai-tutor/actions";
import type { TutorCurriculum } from "@/utils/ai/tutor-generator";

type TutorModule = TutorCurriculum["modules"][number];
type AnswerState = "idle" | "correct" | "incorrect";

const TYPE_SPEED_MS = 25;

export default function AiTutorPlayPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const [curriculum, setCurriculum] = useState<TutorCurriculum | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [locked, setLocked] = useState(false);

  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  const [typedDialogue, setTypedDialogue] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load the tutor session (RLS scopes this to the logged-in user's own rows).
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const session = await getTutorSessionAPI(sessionId);
        if (cancelled) return;
        if (!session || !session.curriculum) {
          setLoadError("SESSION NOT FOUND");
        } else {
          setCurriculum(session.curriculum as TutorCurriculum);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setLoadError("SESSION NOT FOUND");
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const currentModule: TutorModule | undefined =
    curriculum?.modules[currentModuleIndex];

  // Reset battle state whenever the active module changes.
  useEffect(() => {
    setSelectedOption(null);
    setAnswerState("idle");
    setLocked(false);
    setRegenError(null);
  }, [currentModuleIndex]);

  // Typewriter effect for the mentor's dialogue.
  useEffect(() => {
    if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    if (!currentModule) return;

    const text = currentModule.mentor_dialogue;
    setTypedDialogue("");
    setTypingDone(text.length === 0);

    let i = 0;
    typeTimerRef.current = setInterval(() => {
      i += 1;
      setTypedDialogue(text.slice(0, i));
      if (i >= text.length) {
        if (typeTimerRef.current) clearInterval(typeTimerRef.current);
        setTypingDone(true);
      }
    }, TYPE_SPEED_MS);

    return () => {
      if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    };
  }, [currentModule]);

  const skipTyping = useCallback(() => {
    if (!currentModule || typingDone) return;
    if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    setTypedDialogue(currentModule.mentor_dialogue);
    setTypingDone(true);
  }, [currentModule, typingDone]);

  function handleSelectOption(index: number) {
    if (!currentModule || locked || answerState !== "idle" || regenLoading) {
      return;
    }
    setSelectedOption(index);
    if (index === currentModule.checkpoint_question.correct_index) {
      setAnswerState("correct");
    } else {
      setAnswerState("incorrect");
      setLocked(true);
    }
  }

  function handleNextModule() {
    if (!curriculum) return;
    if (currentModuleIndex < curriculum.modules.length - 1) {
      setCurrentModuleIndex((i) => i + 1);
    }
  }

  async function handleRequestSimplerExplanation() {
    if (!currentModule) return;
    setRegenLoading(true);
    setRegenError(null);

    const sourceText = [
      currentModule.title,
      currentModule.detailed_explanation,
      "Key takeaways:",
      ...currentModule.key_takeaways.map((t) => `- ${t}`),
    ].join("\n");

    const topic = `Re-explain "${currentModule.title}" in a much simpler, more basic way for a student who just answered a checkpoint question incorrectly. Use plainer vocabulary and more concrete examples than before, then ask one new checkpoint question testing the same core concept.`;

    const result = await generateTutorCurriculum(sourceText, "text", topic);
    setRegenLoading(false);

    if (!result.success || !result.session) {
      setRegenError(result.error ?? "FAILED TO GENERATE SIMPLER EXPLANATION");
      return;
    }

    const simplerModule = result.session.curriculum.modules[0];
    if (!simplerModule) {
      setRegenError("THE MENTOR RETURNED NO LESSON");
      return;
    }

    setCurriculum((prev) => {
      if (!prev) return prev;
      const modules = [...prev.modules];
      modules[currentModuleIndex] = {
        ...simplerModule,
        module_number: currentModule.module_number,
      };
      return { ...prev, modules };
    });

    setSelectedOption(null);
    setAnswerState("idle");
    setLocked(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-lumen-yellow flex items-center justify-center">
        <p className="font-press-start text-lumen-black animate-blink">
          LOADING CURRICULUM...
        </p>
      </div>
    );
  }

  if (loadError || !curriculum || !currentModule) {
    return (
      <div className="min-h-screen bg-lumen-yellow flex flex-col items-center justify-center gap-6 p-8">
        <p className="font-press-start text-lumen-black text-center">
          {loadError ?? "NO MODULES IN THIS CURRICULUM"}
        </p>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-lumen-black text-lumen-yellow border-4 border-lumen-black font-press-start text-xs shadow-brutalist hover:opacity-80 transition-all"
        >
          &larr; BACK TO DASHBOARD
        </Link>
      </div>
    );
  }

  const totalModules = curriculum.modules.length;
  const isLastModule = currentModuleIndex === totalModules - 1;

  return (
    <div className="min-h-screen bg-lumen-yellow">
      {/* Top bar */}
      <div className="border-b-4 border-lumen-black bg-lumen-yellow sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="font-press-start text-xs hover:opacity-70 transition-opacity"
        >
          &larr; DASHBOARD
        </Link>
        <h1 className="font-press-start text-xs md:text-sm text-center truncate max-w-[50%]">
          {curriculum.title}
        </h1>
        <span className="font-press-start text-xs">
          MODULE {currentModuleIndex + 1} / {totalModules}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* LEFT COLUMN: The Mentor */}
        <div className="border-r-0 md:border-r-4 border-b-4 md:border-b-0 border-lumen-black p-6 md:p-10 flex flex-col items-center bg-lumen-yellow">
          <div className="w-[220px] h-[252px] md:w-[280px] md:h-[321px] border-4 border-lumen-black shadow-brutalist overflow-hidden relative bg-white">
            <Image
              src={heroImage}
              alt="The Knight Mentor"
              fill
              className="pixelated object-cover"
              priority
            />
          </div>

          {/* Retro RPG dialogue box */}
          <button
            type="button"
            onClick={skipTyping}
            className="mt-8 w-full max-w-md bg-lumen-black border-4 border-white shadow-brutalist p-5 text-left cursor-pointer"
            aria-label="Mentor dialogue, click to skip typing animation"
          >
            <p className="font-press-start text-[10px] text-lumen-yellow mb-3">
              KNIGHT MENTOR
            </p>
            <p className="font-mono text-sm text-white leading-relaxed min-h-[4.5rem]">
              {typedDialogue}
              {!typingDone && (
                <span className="inline-block w-2 h-4 ml-1 bg-lumen-yellow animate-blink align-middle" />
              )}
            </p>
          </button>
        </div>

        {/* RIGHT COLUMN: The Codex & Battle */}
        <div className="p-6 md:p-10 flex flex-col gap-6">
          <div>
            <h2 className="font-press-start text-sm md:text-base mb-4">
              MODULE {currentModule.module_number}: {currentModule.title}
            </h2>
            <p className="font-mono text-sm leading-relaxed whitespace-pre-line">
              {currentModule.detailed_explanation}
            </p>
          </div>

          <div className="border-4 border-lumen-black bg-white p-4 shadow-brutalist">
            <h3 className="font-press-start text-xs mb-3">KEY TAKEAWAYS</h3>
            <ul className="flex flex-col gap-2">
              {currentModule.key_takeaways.map((takeaway, i) => (
                <li key={i} className="flex items-start gap-3 font-mono text-sm">
                  <span className="mt-1 w-3 h-3 bg-lumen-yellow border-2 border-lumen-black shrink-0" />
                  {takeaway}
                </li>
              ))}
            </ul>
          </div>

          {/* Checkpoint battle */}
          <div className="border-4 border-lumen-black bg-white p-5 shadow-brutalist flex flex-col gap-4">
            <h3 className="font-press-start text-xs">CHECKPOINT BATTLE</h3>
            <p className="font-mono text-sm">
              {currentModule.checkpoint_question.question}
            </p>

            <div className="grid grid-cols-1 gap-3">
              {currentModule.checkpoint_question.options.map((option, i) => {
                const isCorrectOption =
                  i === currentModule.checkpoint_question.correct_index;
                const isSelected = i === selectedOption;
                const answered = answerState !== "idle";

                let stateClasses =
                  "bg-white hover:bg-lumen-black hover:text-white";
                if (answered) {
                  if (isCorrectOption) {
                    stateClasses = "bg-[#39FF14]";
                  } else if (isSelected) {
                    stateClasses = "bg-[#FF4444] text-white";
                  } else {
                    stateClasses = "bg-white opacity-50";
                  }
                }

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={answered || regenLoading}
                    onClick={() => handleSelectOption(i)}
                    className={`appearance-none text-left font-mono text-sm border-4 border-lumen-black px-4 py-3 shadow-brutalist transition-all disabled:cursor-not-allowed ${stateClasses}`}
                  >
                    <span className="font-press-start text-[10px] mr-3">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {" "}
                    {option}
                  </button>
                );
              })}
            </div>

            {answerState === "correct" && (
              <div className="border-4 border-lumen-black bg-[#39FF14] p-4 flex flex-col gap-3">
                <p className="font-press-start text-sm text-center">
                  VICTORY!
                </p>
                <p className="font-mono text-sm">
                  {currentModule.checkpoint_question.explanation}
                </p>
                {isLastModule ? (
                  <p className="font-press-start text-xs text-center mt-2">
                    CURRICULUM COMPLETE
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextModule}
                    className="self-start px-5 py-3 bg-lumen-black text-lumen-yellow border-4 border-lumen-black font-press-start text-xs shadow-brutalist hover:opacity-80 transition-all"
                  >
                    NEXT MODULE &rarr;
                  </button>
                )}
              </div>
            )}

            {answerState === "incorrect" && (
              <div className="border-4 border-lumen-black bg-[#FF4444] p-4 flex flex-col gap-3">
                <p className="font-press-start text-sm text-center text-white">
                  DEFLECT!
                </p>
                <p className="font-mono text-sm text-white">
                  {currentModule.checkpoint_question.explanation}
                </p>

                {regenError && (
                  <p className="font-mono text-xs bg-lumen-black text-[#FF4444] p-2 border-2 border-white">
                    {regenError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleRequestSimplerExplanation}
                  disabled={regenLoading}
                  className="self-start px-5 py-3 bg-lumen-black text-white border-4 border-white font-press-start text-xs shadow-brutalist hover:opacity-80 transition-all disabled:opacity-50"
                >
                  {regenLoading ? (
                    <span className="animate-blink">
                      MENTOR IS PREPARING A SIMPLER LESSON...
                    </span>
                  ) : (
                    <>REQUEST EASIER TRAINING</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
