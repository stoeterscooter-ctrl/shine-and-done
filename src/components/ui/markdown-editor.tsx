import React, { useMemo } from "react";

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
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
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
