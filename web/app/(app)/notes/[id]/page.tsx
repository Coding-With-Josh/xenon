import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { generatedContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const noteMarkdownComponents = {
  h1: ({ children }) => <h1 className="mb-4 mt-6 text-2xl font-semibold tracking-tight text-foreground">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-3 mt-5 text-xl font-semibold tracking-tight text-foreground">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-lg font-semibold text-foreground">{children}</h3>,
  h4: ({ children }) => <h4 className="mb-2 mt-3 text-base font-semibold text-foreground">{children}</h4>,
  p: ({ children }) => <p className="mb-3 leading-7 text-foreground">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  ul: ({ children }) => <ul className="mb-4 ml-6 list-disc space-y-1.5 text-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal space-y-1.5 text-foreground">{children}</ol>,
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
    <a href={href} className="text-primary underline underline-offset-2 hover:no-underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const { id } = await params;
  const noteId = parseInt(id, 10);
  if (Number.isNaN(noteId)) notFound();
  const [row] = await db
    .select()
    .from(generatedContent)
    .where(eq(generatedContent.id, noteId))
    .limit(1);
  if (!row || row.userId !== session.user.id || row.type !== "notes") notFound();
  const content = row.content as { markdown?: string } | string | null;
  let markdown = "";
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content) as { markdown?: string };
      markdown = parsed?.markdown ?? content;
    } catch {
      markdown = content;
    }
  } else if (content && typeof content === "object" && "markdown" in content) {
    markdown = String((content as { markdown?: unknown }).markdown ?? "");
  } else {
    markdown = String(content ?? "");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/notes" className="hover:underline">Notes</Link>
        <span>/</span>
        <span>{row.topic || row.subject}</span>
      </div>
      <article className="max-w-none font-sans text-foreground">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={noteMarkdownComponents}
        >
          {markdown}
        </ReactMarkdown>
      </article>
    </div>
  );
}
