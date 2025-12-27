import React, { useMemo, useRef } from "react";
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Strikethrough } from "lucide-react";

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
        className="flex-1 w-full p-4 text-sm font-mono bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-gray-800 placeholder:text-gray-400"
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
      className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
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
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-gray-900 mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 mt-4 mb-3">$1</h1>')
    
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
    .replace(/__(.+?)__/g, '<strong class="font-semibold">$1</strong>')
    .replace(/_(.+?)_/g, '<em class="italic">$1</em>')
    
    // Strikethrough
    .replace(/~~(.+?)~~/g, '<del class="line-through text-gray-500">$1</del>')
    
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono text-pink-600">$1</code>')
    
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">$1</blockquote>')
    
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-700">$1</li>')
    .replace(/^\* (.+)$/gm, '<li class="ml-4 list-disc text-gray-700">$1</li>')
    
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-700">$1</li>')
    
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-t border-gray-200 my-4" />')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener">$1</a>')
    
    // Line breaks
    .replace(/\n\n/g, '</p><p class="text-gray-700 my-2">')
    .replace(/\n/g, '<br />');
  
  // Wrap in paragraph if not starting with a block element
  if (!html.startsWith('<h') && !html.startsWith('<blockquote') && !html.startsWith('<li') && !html.startsWith('<hr')) {
    html = `<p class="text-gray-700 my-2">${html}</p>`;
  }
  
  // Wrap consecutive list items in ul/ol
  html = html.replace(/(<li class="ml-4 list-disc[^>]*>.*?<\/li>)+/g, '<ul class="my-2">$&</ul>');
  html = html.replace(/(<li class="ml-4 list-decimal[^>]*>.*?<\/li>)+/g, '<ol class="my-2">$&</ol>');
  
  return html;
}

interface LiveMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function LiveMarkdownEditor({ value, onChange, className = "" }: LiveMarkdownEditorProps) {
  const [mode, setMode] = React.useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (prefix: string, suffix: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = 
      value.substring(0, start) + 
      prefix + textToInsert + suffix + 
      value.substring(end);
    
    onChange(newText);
    
    // Set cursor position after update
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText 
        ? start + prefix.length + textToInsert.length + suffix.length
        : start + prefix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    
    const newText = 
      value.substring(0, lineStart) + 
      prefix + 
      value.substring(lineStart);
    
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/50">
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
        <div className="w-px h-4 bg-gray-200 mx-1" />
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
        <div className="w-px h-4 bg-gray-200 mx-1" />
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
        <div className="w-px h-4 bg-gray-200 mx-1" />
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

      {/* Mode toggle */}
      <div className="flex gap-1 p-2 border-b border-gray-100">
        <button
          onClick={() => setMode("write")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            mode === "write" 
              ? "bg-gray-900 text-white" 
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Write
        </button>
        <button
          onClick={() => setMode("preview")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            mode === "preview" 
              ? "bg-gray-900 text-white" 
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Preview
        </button>
      </div>
      
      {/* Editor/Preview */}
      <div className="flex-1 overflow-auto">
        {mode === "write" ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your notes in markdown..."
            className="w-full h-full p-4 text-sm font-mono bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-gray-800 placeholder:text-gray-400"
            spellCheck={false}
          />
        ) : (
          <div className="p-4">
            <MarkdownPreview content={value} />
          </div>
        )}
      </div>
    </div>
  );
}
