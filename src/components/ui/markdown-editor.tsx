import React, { useMemo, useRef, useCallback, useEffect, useState } from "react";
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Strikethrough, Settings, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./dropdown-menu";
import { Switch } from "./switch";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MarkdownEditor({ value, onChange, className = "" }: MarkdownEditorProps) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your notes in markdown..."
        className="flex-1 w-full p-4 text-sm font-mono bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground"
        spellCheck={false}
      />
    </div>
  );
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
}

function ToolbarButton({ icon, onClick, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
    >
      {icon}
    </button>
  );
}

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className = "" }: MarkdownPreviewProps) {
  const html = useMemo(() => parseMarkdown(content), [content]);
  
  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function parseMarkdown(text: string): string {
  if (!text) return "";
  
  let html = text
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-foreground mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-foreground mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-foreground mt-4 mb-3">$1</h1>')
    
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
    .replace(/__(.+?)__/g, '<strong class="font-semibold">$1</strong>')
    .replace(/_(.+?)_/g, '<em class="italic">$1</em>')
    
    // Strikethrough
    .replace(/~~(.+?)~~/g, '<del class="line-through text-muted-foreground">$1</del>')
    
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-muted rounded text-sm font-mono text-primary">$1</code>')
    
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-border pl-4 italic text-muted-foreground my-2">$1</blockquote>')
    
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-foreground">$1</li>')
    .replace(/^\* (.+)$/gm, '<li class="ml-4 list-disc text-foreground">$1</li>')
    
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-foreground">$1</li>')
    
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-t border-border my-4" />')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener">$1</a>')
    
    // Line breaks
    .replace(/\n\n/g, '</p><p class="text-foreground my-2">')
    .replace(/\n/g, '<br />');
  
  // Wrap in paragraph if not starting with a block element
  if (!html.startsWith('<h') && !html.startsWith('<blockquote') && !html.startsWith('<li') && !html.startsWith('<hr')) {
    html = `<p class="text-foreground my-2">${html}</p>`;
  }
  
  // Wrap consecutive list items in ul/ol
  html = html.replace(/(<li class="ml-4 list-disc[^>]*>.*?<\/li>)+/g, '<ul class="my-2">$&</ul>');
  html = html.replace(/(<li class="ml-4 list-decimal[^>]*>.*?<\/li>)+/g, '<ol class="my-2">$&</ol>');
  
  return html;
}

// Line-by-line markdown rendering for live editing
interface MarkdownLine {
  raw: string;
  type: "h1" | "h2" | "h3" | "ul" | "ol" | "quote" | "hr" | "paragraph";
  content: string;
}

function parseLineType(line: string): MarkdownLine {
  if (line.startsWith("# ")) return { raw: line, type: "h1", content: line.slice(2) };
  if (line.startsWith("## ")) return { raw: line, type: "h2", content: line.slice(3) };
  if (line.startsWith("### ")) return { raw: line, type: "h3", content: line.slice(4) };
  if (line.startsWith("- ") || line.startsWith("* ")) return { raw: line, type: "ul", content: line.slice(2) };
  if (/^\d+\. /.test(line)) return { raw: line, type: "ol", content: line.replace(/^\d+\. /, "") };
  if (line.startsWith("> ")) return { raw: line, type: "quote", content: line.slice(2) };
  if (line === "---") return { raw: line, type: "hr", content: "" };
  return { raw: line, type: "paragraph", content: line };
}

function renderInlineMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del class="line-through opacity-60">$1</del>')
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-muted rounded text-sm font-mono">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline" target="_blank">$1</a>');
}

interface LiveMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function LiveMarkdownEditor({ value, onChange, className = "" }: LiveMarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const isComposing = useRef(false);
  const lastCaretPosition = useRef<number>(0);

  // Sync dark mode with document
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
  };

  const getCaretPosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !editorRef.current) return 0;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    // Count actual text position
    let position = 0;
    const treeWalker = document.createTreeWalker(
      editorRef.current,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      null
    );
    
    let node: Node | null;
    while ((node = treeWalker.nextNode())) {
      if (node === range.endContainer) {
        position += range.endOffset;
        break;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        position += node.textContent?.length || 0;
      } else if (node.nodeName === 'DIV' && node !== editorRef.current) {
        position += 1; // newline
      }
    }
    
    return position;
  }, []);

  const setCaretPosition = useCallback((position: number) => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection) return;
    
    let currentPos = 0;
    const treeWalker = document.createTreeWalker(
      editorRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node: Text | null;
    while ((node = treeWalker.nextNode() as Text | null)) {
      const nodeLength = node.textContent?.length || 0;
      if (currentPos + nodeLength >= position) {
        const range = document.createRange();
        range.setStart(node, Math.min(position - currentPos, nodeLength));
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
      currentPos += nodeLength;
    }
    
    // Fallback: set to end
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  const extractTextFromEditor = useCallback((): string => {
    if (!editorRef.current) return "";
    
    let text = "";
    const children = editorRef.current.childNodes;
    
    children.forEach((child, index) => {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent || "";
      } else if (child.nodeName === "DIV" || child.nodeName === "P") {
        if (index > 0) text += "\n";
        text += (child as HTMLElement).innerText || "";
      } else if (child.nodeName === "BR") {
        text += "\n";
      } else {
        text += (child as HTMLElement).innerText || child.textContent || "";
      }
    });
    
    return text;
  }, []);

  const handleInput = useCallback(() => {
    if (isComposing.current) return;
    
    lastCaretPosition.current = getCaretPosition();
    const newText = extractTextFromEditor();
    onChange(newText);
  }, [onChange, getCaretPosition, extractTextFromEditor]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.execCommand("insertLineBreak");
      handleInput();
    }
  }, [handleInput]);

  // Render markdown as HTML for display
  const renderContent = useMemo(() => {
    const lines = value.split("\n");
    return lines.map((line, i) => {
      const parsed = parseLineType(line);
      const content = renderInlineMarkdown(parsed.content);
      
      switch (parsed.type) {
        case "h1":
          return `<div class="text-2xl font-bold my-2" data-line="${i}">${content || '<br>'}</div>`;
        case "h2":
          return `<div class="text-xl font-bold my-2" data-line="${i}">${content || '<br>'}</div>`;
        case "h3":
          return `<div class="text-lg font-semibold my-1" data-line="${i}">${content || '<br>'}</div>`;
        case "ul":
          return `<div class="flex items-start gap-2 my-0.5" data-line="${i}"><span class="text-muted-foreground">•</span><span>${content || '<br>'}</span></div>`;
        case "ol":
          return `<div class="flex items-start gap-2 my-0.5" data-line="${i}"><span class="text-muted-foreground">${line.match(/^\d+/)?.[0] || '1'}.</span><span>${content || '<br>'}</span></div>`;
        case "quote":
          return `<div class="border-l-4 border-primary/30 pl-3 italic text-muted-foreground my-1" data-line="${i}">${content || '<br>'}</div>`;
        case "hr":
          return `<hr class="border-t border-border my-4" data-line="${i}" />`;
        default:
          return `<div data-line="${i}">${content || '<br>'}</div>`;
      }
    }).join("");
  }, [value]);

  // Sync editor content when value changes externally
  useEffect(() => {
    if (!editorRef.current) return;
    
    const currentText = extractTextFromEditor();
    if (currentText !== value) {
      editorRef.current.innerHTML = renderContent;
      setCaretPosition(lastCaretPosition.current);
    }
  }, [value, renderContent, extractTextFromEditor, setCaretPosition]);

  const insertFormatting = (prefix: string, suffix: string = "", placeholder: string = "") => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;
    
    const text = selection.toString() || placeholder;
    document.execCommand("insertText", false, prefix + text + suffix);
    handleInput();
  };

  const insertLinePrefix = (prefix: string) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !editorRef.current) return;
    
    const range = selection.getRangeAt(0);
    let node = range.startContainer;
    
    // Find the line div
    while (node && node.parentNode !== editorRef.current) {
      node = node.parentNode as Node;
    }
    
    if (node && node.nodeType === Node.ELEMENT_NODE) {
      const lineDiv = node as HTMLElement;
      const currentText = lineDiv.innerText;
      const caretPos = range.startOffset;
      
      // Get the raw text and add prefix
      const lines = value.split("\n");
      const lineIndex = parseInt(lineDiv.getAttribute("data-line") || "0");
      if (lines[lineIndex] !== undefined) {
        lines[lineIndex] = prefix + lines[lineIndex];
        onChange(lines.join("\n"));
        
        setTimeout(() => {
          setCaretPosition(lastCaretPosition.current + prefix.length);
        }, 0);
      }
    }
  };
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            icon={<Bold size={16} />}
            onClick={() => insertFormatting("**", "**", "bold")}
            title="Bold (Ctrl+B)"
          />
          <ToolbarButton
            icon={<Italic size={16} />}
            onClick={() => insertFormatting("*", "*", "italic")}
            title="Italic (Ctrl+I)"
          />
          <ToolbarButton
            icon={<Strikethrough size={16} />}
            onClick={() => insertFormatting("~~", "~~", "strikethrough")}
            title="Strikethrough"
          />
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton
            icon={<Heading1 size={16} />}
            onClick={() => insertLinePrefix("# ")}
            title="Heading 1"
          />
          <ToolbarButton
            icon={<Heading2 size={16} />}
            onClick={() => insertLinePrefix("## ")}
            title="Heading 2"
          />
          <ToolbarButton
            icon={<Heading3 size={16} />}
            onClick={() => insertLinePrefix("### ")}
            title="Heading 3"
          />
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton
            icon={<List size={16} />}
            onClick={() => insertLinePrefix("- ")}
            title="Bullet List"
          />
          <ToolbarButton
            icon={<ListOrdered size={16} />}
            onClick={() => insertLinePrefix("1. ")}
            title="Numbered List"
          />
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton
            icon={<Quote size={16} />}
            onClick={() => insertLinePrefix("> ")}
            title="Blockquote"
          />
          <ToolbarButton
            icon={<Code size={16} />}
            onClick={() => insertFormatting("`", "`", "code")}
            title="Inline Code"
          />
        </div>

        {/* Settings Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <Settings size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="flex items-center justify-between cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              <div className="flex items-center gap-2">
                {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
                <span>Dark Mode</span>
              </div>
              <Switch 
                checked={isDarkMode} 
                onCheckedChange={toggleDarkMode}
                className="scale-75"
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Live Editor */}
      <div 
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => { isComposing.current = false; handleInput(); }}
        className="flex-1 overflow-auto p-4 text-sm focus:outline-none text-foreground [&_strong]:font-bold [&_em]:italic"
        style={{ minHeight: "200px" }}
        dangerouslySetInnerHTML={{ __html: renderContent }}
      />
    </div>
  );
}
