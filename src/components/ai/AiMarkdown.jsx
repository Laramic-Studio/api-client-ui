import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/** Render assistant markdown (headings, lists, tables, code, etc.) */
export default function AiMarkdown({ content, className }) {
  if (!content?.trim()) return null;

  return (
    <div
      className={cn(
        "ai-markdown text-[13px] leading-relaxed break-words",
        "[&_h1]:text-[15px] [&_h1]:font-semibold [&_h1]:mt-3 [&_h1]:mb-1.5 [&_h1:first-child]:mt-0",
        "[&_h2]:text-[14px] [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2:first-child]:mt-0",
        "[&_h3]:text-[13.5px] [&_h3]:font-semibold [&_h3]:mt-2.5 [&_h3]:mb-1 [&_h3:first-child]:mt-0",
        "[&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_ul]:my-1.5 [&_ul]:pl-4 [&_ul]:list-disc [&_ol]:my-1.5 [&_ol]:pl-4 [&_ol]:list-decimal",
        "[&_li]:my-0.5",
        "[&_strong]:font-semibold [&_em]:italic",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] [&_code]:font-mono",
        "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted/50 [&_pre]:p-2.5",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
        "[&_hr]:my-3 [&_hr]:border-border",
        "[&_a]:text-[hsl(var(--brand))] [&_a]:underline [&_a]:underline-offset-2",
        "[&_table]:my-2 [&_table]:w-full [&_table]:text-[12px] [&_table]:border-collapse",
        "[&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-medium",
        "[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_td]:align-top",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
