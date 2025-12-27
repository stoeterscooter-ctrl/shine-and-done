import React, { useState, useEffect } from 'react';
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import { Settings, Moon, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './dropdown-menu';
import { Switch } from './switch';
import { Button } from './button';

interface LiveMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function LiveMarkdownEditor({ value, onChange, className = "" }: LiveMarkdownEditorProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const editor = useCreateBlockNote();

  useEffect(() => {
    // Set initial content if provided
    if (value && editor) {
      const loadContent = async () => {
        try {
          const blocks = await editor.tryParseMarkdownToBlocks(value);
          editor.replaceBlocks(editor.document, blocks);
        } catch (e) {
          console.error('Failed to parse initial markdown:', e);
        }
      };
      loadContent();
    }
  }, []);

  useEffect(() => {
    if (!editor) return;

    const handleChange = async () => {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      onChange(markdown);
    };

    const unsubscribe = editor.onChange(handleChange);
    
    return () => {
      unsubscribe();
    };
  }, [editor, onChange]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`flex flex-col h-full rounded-lg overflow-hidden border ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-background border-border'} ${className}`}>
      {/* Settings Button */}
      <div className={`flex items-center justify-end px-3 py-2 border-b ${isDarkMode ? 'border-zinc-700' : 'border-border'}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className={isDarkMode ? 'text-zinc-300 hover:bg-zinc-800' : ''}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Editor Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="flex items-center justify-between cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              <div className="flex items-center gap-2">
                {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span>Dark Mode</span>
              </div>
              <Switch 
                checked={isDarkMode} 
                onCheckedChange={toggleDarkMode}
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* BlockNote Editor */}
      <div className="flex-1 overflow-auto">
        <BlockNoteView 
          editor={editor} 
          theme={isDarkMode ? "dark" : "light"}
        />
      </div>
    </div>
  );
}
