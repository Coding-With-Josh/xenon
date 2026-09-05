"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type InlineExplainerProps = {
  children: React.ReactNode;
  subject?: string;
  topic?: string;
};

/** Walk up from a text node to find the nearest block-level element */
function findBlockContainer(node: Node, root: Node): Node | null {
  let current: Node | null = node;
  while (current && current !== root) {
    const tag = current instanceof Element ? current.tagName : null;
    if (tag && ["P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "BLOCKQUOTE", "DIV", "TD", "TH", "PRE", "OL", "UL"].includes(tag)) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

/**
 * Turn a model's plain-text explanation into safe, readable HTML:
 * escape HTML, render **bold** as <strong>, and newlines as <br>.
 * Returns a string safe to assign to innerHTML (all user/markdown content
 * is HTML-escaped first, so no injection is possible).
 */
function formatExplanation(text: string): string {
  const escaped = text
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;");
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

export function InlineExplainer({ children, subject, topic }: InlineExplainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insertedElRef = useRef<HTMLElement | null>(null);
  const targetBlockRef = useRef<Node | null>(null);
  const loadingElRef = useRef<HTMLElement | null>(null);

  // Remove any DOM-inserted elements (loading + explanation)
  const cleanDom = useCallback(() => {
    if (insertedElRef.current) {
      insertedElRef.current.remove();
      insertedElRef.current = null;
    }
    if (loadingElRef.current) {
      loadingElRef.current.remove();
      loadingElRef.current = null;
    }
  }, []);

  useEffect(() => {
    function handleSelection() {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setSelectedText(null);
        setPosition(null);
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 2 || text.length > 500) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      // Remember which block the selection is in
      targetBlockRef.current = findBlockContainer(range.startContainer, containerRef.current!);

      setSelectedText(text);
      setPosition({
        top: rect.bottom - containerRect.top + 8,
        left: rect.left - containerRect.left + rect.width / 2,
      });
    }

    function handleClickOutside(e: MouseEvent) {
      if (insertedElRef.current?.contains(e.target as Node)) return;
      if (loadingElRef.current?.contains(e.target as Node)) return;
      if (containerRef.current?.contains(e.target as Node)) {
        // Still inside notes — only clear if clicking outside the explanation
        return;
      }
      cleanDom();
      setSelectedText(null);
      setPosition(null);
      setError(null);
    }

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("mousedown", handleClickOutside);
      cleanDom();
    };
  }, [cleanDom]);

  const insertAfterBlock = useCallback((html: string, className: string) => {
    const block = targetBlockRef.current;
    if (!block || !block.parentNode || !containerRef.current?.contains(block)) return null;

    const wrapper = document.createElement("div");
    wrapper.className = className;
    wrapper.innerHTML = html;
    block.parentNode.insertBefore(wrapper, block.nextSibling);
    return wrapper;
  }, []);

  const handleExplain = useCallback(async () => {
    if (!selectedText) return;
    cleanDom();
    setLoading(true);
    setError(null);

    // Insert loading indicator inline
    const loadingHtml = `<div class="flex items-center gap-2.5 px-4 py-3"><svg class="animate-spin h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4 31.4" stroke-linecap="round" class="opacity-20"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="opacity-80"/></svg><span class="text-sm text-muted-foreground font-medium">Explaining...</span></div>`;
    loadingElRef.current = insertAfterBlock(loadingHtml, "mt-3 rounded-xl border border-primary/10 bg-primary/[0.03] shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200");

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText, subject, topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to explain");

      // Remove loading, insert explanation
      if (loadingElRef.current) {
        loadingElRef.current.remove();
        loadingElRef.current = null;
      }
      setError(null);
      setPosition(null);
      setLoading(false);

      // Format the raw model text (escapes HTML, renders **bold**, newlines).
      const explanationHtml = formatExplanation(data.explanation);
      const html = `<div class="flex items-start gap-3 p-4"><div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10"><svg class="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/></svg></div><div class="flex-1 min-w-0"><div class="flex items-center justify-between gap-2"><p class="text-xs font-semibold text-foreground">AI Explainer</p><button data-explain-close class="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button></div><div class="mt-1.5 text-sm leading-relaxed text-muted-foreground">${explanationHtml}</div></div></div>`;
      insertedElRef.current = insertAfterBlock(html, "mt-3 rounded-xl border border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200");

      // Wire close button
      insertedElRef.current?.querySelector("[data-explain-close]")?.addEventListener("click", () => {
        cleanDom();
        setSelectedText(null);
        setPosition(null);
        setError(null);
        window.getSelection()?.removeAllRanges();
      });
    } catch (e) {
      if (loadingElRef.current) {
        loadingElRef.current.remove();
        loadingElRef.current = null;
      }
      setError(e instanceof Error ? e.message : "Failed to explain");
      setLoading(false);
    }
  }, [selectedText, subject, topic, insertAfterBlock, cleanDom]);

  useEffect(() => {
    if (!error) return;
    cleanDom();
    const errText = error.replace(/&/g, "\u0026amp;").replace(/</g, "\u0026lt;").replace(/>/g, "\u0026gt;");
    const html = `<div class="flex items-start gap-2.5 p-4"><div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10"><svg class="h-3 w-3 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg></div><div class="flex-1"><p class="text-sm text-destructive font-medium">${errText}</p><button data-explain-retry class="mt-1 text-xs text-primary font-semibold hover:underline">Try again</button></div></div>`;
    insertedElRef.current = insertAfterBlock(html, "mt-3 rounded-xl border border-destructive/20 bg-destructive/[0.03] shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200");
    insertedElRef.current?.querySelector("[data-explain-retry]")?.addEventListener("click", handleExplain);
  }, [error]);

  return (
    <div ref={containerRef} className="relative">
      {children}

      {/* Floating "Explain this" button */}
      {selectedText && position && !loading && !error && (
        <div
          className="absolute z-10"
          style={{
            top: position.top,
            left: position.left,
            transform: "translateX(-50%)",
          }}
        >
          <button
            onClick={handleExplain}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all animate-in fade-in zoom-in-0 active:scale-[0.97]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            Explain this
          </button>
        </div>
      )}
    </div>
  );
}