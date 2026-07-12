"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { getStageData, type NotesData, type FlowStageProgress } from "@/lib/flows/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { AudioBook01Icon } from "@hugeicons/core-free-icons";
import { NotesShimmer } from "@/components/ui/shimmer";
import { InlineExplainer } from "./inline-explainer";

const noteComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 mt-6 text-2xl font-semibold tracking-tight text-foreground">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-4 mt-6 text-xl font-semibold tracking-tight text-foreground border-b border-border/40 pb-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-4 text-sm font-medium italic text-foreground/80">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="mb-3 leading-7 text-foreground">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="mb-4 ml-6 list-disc space-y-1.5 text-foreground">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 ml-6 list-decimal space-y-1.5 text-foreground">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mb-4 border-l-4 border-primary/50 bg-muted/30 py-1 pl-4 pr-3 italic text-foreground">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = Boolean(className);
    return isBlock ? (
      <code className={`text-sm font-mono text-foreground ${className ?? ""}`}>{children}</code>
    ) : (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">{children}</code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm leading-6">{children}</pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-2 hover:no-underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
};

type NotesStageProps = {
  subsectionIndex: number;
  subsections: { name: string; id: string }[];
  progress: FlowStageProgress[];
  sessionId: number;
  subject: string;
  topic: string;
  onAdvance: () => void;
  onRetry: () => void;
  loading: boolean;
};

export function NotesStage({
  subsectionIndex,
  subsections,
  progress,
  sessionId,
  subject,
  topic,
  onAdvance,
  onRetry,
  loading,
}: NotesStageProps) {
  const subsection = subsections[subsectionIndex];
  const notesProgress = progress.find(
    (p) => p.stage === "notes" && p.subsectionIndex === subsectionIndex
  );
  const notesData = notesProgress ? getStageData<NotesData>(notesProgress) : null;
  const content = notesData?.content ?? null;
  const [error, setError] = useState<string | null>(null);
  const [autoLoading, setAutoLoading] = useState(false);
  const autoTriggered = useRef(false);

  useEffect(() => {
    if (!content && !loading && !autoTriggered.current) {
      autoTriggered.current = true;
      setAutoLoading(true);
      fetch(`/api/flows/${sessionId}/generate-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to generate notes");
          window.location.reload();
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : "Failed to generate notes");
          setAutoLoading(false);
        });
    }
  }, [content, loading, sessionId]);

  const handleGenerate = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/flows/${sessionId}/generate-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to generate notes");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate notes");
    }
  }, [sessionId]);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 space-y-4">
        <p className="text-destructive text-sm">{error}</p>
        <button
          onClick={handleGenerate}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          Notes &middot; Subsection {subsectionIndex + 1} of {subsections.length}
        </p>
        {content && (
          <button
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-all duration-150"
            title="Read aloud (coming soon)"
          >
            <HugeiconsIcon icon={AudioBook01Icon} size={14} />
            Listen
          </button>
        )}
      </div>

      <h3 className="font-serif text-xl font-medium">{subsection?.name ?? "Notes"}</h3>

      {loading || autoLoading ? (
        <NotesShimmer />
      ) : content ? (
        <InlineExplainer subject={subject} topic={topic}>
          <article className="max-w-none font-sans text-foreground">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={noteComponents}
            >
              {content}
            </ReactMarkdown>
          </article>
        </InlineExplainer>
      ) : (
        <div className="rounded-xl border p-6 text-center space-y-4">
          <p className="text-muted-foreground text-sm">
            Notes not yet generated for this subsection.
          </p>
          <button
            onClick={handleGenerate}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-colors"
          >
            Generate notes
          </button>
        </div>
      )}

      {content && (
        <div className="flex gap-3 pt-4">
          <button
            onClick={onAdvance}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-colors disabled:opacity-50"
          >
            Mark read &amp; continue
          </button>
        </div>
      )}
    </div>
  );
}
