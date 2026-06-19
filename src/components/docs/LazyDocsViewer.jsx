import { lazy, Suspense } from "react";
import { cn } from "@/lib/utils";

const LexicalDocsViewer = lazy(() => import("@/components/docs/LexicalDocsViewer").then((mod) => ({
  default: mod.LexicalDocsViewer,
})));

export default function LazyDocsViewer(props) {
  return (
    <Suspense fallback={(
      <div className={cn("text-[13px] text-muted-foreground animate-pulse", props.className)}>
        Loading documentation…
      </div>
    )}
    >
      <LexicalDocsViewer {...props} />
    </Suspense>
  );
}
