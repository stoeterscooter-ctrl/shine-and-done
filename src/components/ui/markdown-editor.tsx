import React, { useEffect, useRef } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";
import "@blocknote/mantine/style.css";

import { cn } from "@/lib/utils";

interface LiveMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// BlockNote provides native markdown shortcuts (e.g. typing "## " creates a heading)
// so we intentionally avoid any custom markdown parsing/caret handling here.
export function LiveMarkdownEditor({ value, onChange, className }: LiveMarkdownEditorProps) {
  const { resolvedTheme } = useTheme();
  const editor = useCreateBlockNote();

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    if (!value) return;

    (async () => {
      try {
        const blocks = await editor.tryParseMarkdownToBlocks(value);
        editor.replaceBlocks(editor.document, blocks);
      } catch (e) {
        console.error("Failed to parse initial markdown:", e);
      }
    })();
  }, [editor, value]);

  useEffect(() => {
    const unsubscribe = editor.onChange(async () => {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      onChangeRef.current(markdown);
    });

    return () => {
      unsubscribe();
    };
  }, [editor]);

  return (
    <div className={cn("h-full overflow-hidden rounded-lg border border-border bg-background", className)}>
      <BlockNoteView editor={editor} theme={resolvedTheme === "dark" ? "dark" : "light"} />
    </div>
  );
}
