"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Compact markdown for chat bubbles (headings, bold, lists, code, no huge spacing)
const chatMdComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="mb-1 mt-2 text-base font-semibold">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="mb-1 mt-2 text-sm font-semibold">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="mb-1 mt-1.5 text-sm font-semibold">{children}</h3>,
  h4: ({ children }: { children?: React.ReactNode }) => <h4 className="mb-1 mt-1 text-sm font-semibold">{children}</h4>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-1.5 leading-6 text-sm last:mb-0">{children}</p>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="mb-2 ml-4 list-disc space-y-0.5 text-sm">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5 text-sm">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="leading-5">{children}</li>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-primary/50 pl-3 italic text-sm">{children}</blockquote>
  ),
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
    const isBlock = Boolean(className);
    return isBlock ? (
      <code className={`block overflow-x-auto rounded bg-muted/80 p-2 text-xs ${className ?? ""}`}>{children}</code>
    ) : (
      <code className="rounded bg-muted/80 px-1 py-0.5 font-mono text-xs">{children}</code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="mb-2 overflow-x-auto rounded bg-muted/80 p-2 text-xs">{children}</pre>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} className="underline underline-offset-2" target="_blank" rel="noopener noreferrer">{children}</a>
  ),
};

function ChatMessageContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={chatMdComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

type Message = { role: "user" | "assistant"; content: string };
type ChatSession = { id: number; title: string; updatedAt: string };

export default function ChatPage() {
  const { status } = useSession();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadSessions() {
    try {
      const res = await fetch("/api/chat/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } finally {
      setSessionsLoading(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated") loadSessions();
  }, [status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadSession(sessionId: number) {
    const res = await fetch(`/api/chat/sessions/${sessionId}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
    setCurrentSessionId(data.id);
  }

  function startNewChat() {
    setCurrentSessionId(null);
    setMessages([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || loading) return;
    const userMessage = message.trim();
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    let sessionId = currentSessionId;
    try {
      if (sessionId == null) {
        const createRes = await fetch("/api/chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: userMessage.slice(0, 50) }),
        });
        if (!createRes.ok) throw new Error("Failed to create session");
        const created = await createRes.json();
        sessionId = created.id;
        setCurrentSessionId(sessionId);
        setSessions((prev) => [{ id: created.id, title: created.title, updatedAt: new Date().toISOString() }, ...prev]);
        await fetch(`/api/chat/sessions/${sessionId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "user", content: userMessage }),
        });
      } else {
        await fetch(`/api/chat/sessions/${sessionId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "user", content: userMessage }),
        });
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errMsg = data.error ?? res.statusText;
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `**Error:** ${errMsg}` },
        ]);
        if (sessionId != null) {
          await fetch(`/api/chat/sessions/${sessionId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: "assistant", content: `Error: ${errMsg}` }),
          });
        }
        return;
      }
      const reader = res.body;
      if (!reader) {
        setMessages((prev) => [...prev, { role: "assistant", content: "**Error:** No response from server." }]);
        if (sessionId != null) {
          await fetch(`/api/chat/sessions/${sessionId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: "assistant", content: "No response from server." }),
          });
        }
        return;
      }
      const decoder = new TextDecoder();
      let full = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      const streamReader = reader.getReader();
      try {
        while (true) {
          const { done, value } = await streamReader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          full += text;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last.role === "assistant") next[next.length - 1] = { ...last, content: full };
            return next;
          });
        }
      } finally {
        streamReader.releaseLock();
      }
      const isStreamError = full.startsWith("[Error:") || full.includes("\n[Error:");
      if (sessionId != null && !isStreamError) {
        await fetch(`/api/chat/sessions/${sessionId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "assistant", content: full }),
        });
        loadSessions();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
      if (sessionId != null) {
        await fetch(`/api/chat/sessions/${sessionId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "assistant", content: "Something went wrong. Please try again." }),
        }).catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return <div className="p-4">Loading...</div>;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="font-serif text-2xl font-medium">Xe AI</h1>
        <Button variant="outline" size="sm" onClick={startNewChat}>
          New chat
        </Button>
        {!sessionsLoading && sessions.length > 0 && (
          <span className="text-muted-foreground text-sm">
            Previous:{" "}
            {sessions.slice(0, 5).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => loadSession(s.id)}
                className={`ml-1 underline hover:no-underline ${currentSessionId === s.id ? "font-medium text-foreground" : ""}`}
              >
                {s.title.slice(0, 30)}{s.title.length > 30 ? "…" : ""}
              </button>
            ))}
            {sessions.length > 5 && (
              <span className="text-muted-foreground ml-1">(+{sessions.length - 5} more)</span>
            )}
          </span>
        )}
      </div>
      <p className="text-muted-foreground mb-2 text-sm">
        Ask for notes, explanations, or &quot;Generate 5 WAEC questions on...&quot;
      </p>
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-card">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Type a question or request. Example: &quot;Explain photosynthesis for SS2&quot; or &quot;Generate 5 WAEC questions on motion&quot;
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 ${
                m.role === "user" ? "bg-primary text-primary-foreground ml-8" : "bg-muted mr-8"
              }`}
            >
              {m.role === "user" ? (
                <div className="whitespace-pre-wrap text-sm">{m.content}</div>
              ) : (
                <ChatMessageContent content={m.content} />
              )}
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="bg-muted mr-8 rounded-lg p-3 text-sm">Thinking...</div>
          )}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask Xe anything..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !message.trim()}>
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
