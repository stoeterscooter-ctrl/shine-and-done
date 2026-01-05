import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, GripVertical, Plus, ChevronRight, ChevronDown, FileText, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { LiveMarkdownEditor } from "./markdown-editor";

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  children?: TodoItem[];
  expanded?: boolean;
  notes?: string;
  dueDate?: string;
}

const formatDate = () => {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getDefaultNotes = (title: string) => {
  return `## ${title}\n\n**Due:** ${formatDate()}\n\n---\n\nAdd your notes here...\n\n- [ ] Subtask 1\n- [ ] Subtask 2`;
};

const initialItems: TodoItem[] = [
  { id: "1", text: "Review Calendar PR (React/TS)", done: false, children: [], expanded: true, notes: "" },
  { 
    id: "2", 
    text: "Implement authentication in the email provider", 
    done: false, 
    expanded: true,
    notes: "",
    children: [
      { id: "2-1", text: "Set up OAuth providers", done: true, children: [], notes: "" },
      { id: "2-2", text: "Add session management", done: false, children: [], notes: "" },
    ]
  },
  { id: "3", text: "Refactor components in the Tauri/React 19 app", done: false, children: [], expanded: true, notes: "" },
  { id: "4", text: "Test image downloads in Novon", done: false, children: [], expanded: true, notes: "" },
  { 
    id: "5", 
    text: "Organize CSS and layouts", 
    done: true, 
    expanded: true,
    notes: "",
    children: [
      { id: "5-1", text: "Clean up unused styles", done: true, children: [], notes: "" },
    ]
  },
  { id: "6", text: "Draft the apps roadmap", done: false, children: [], expanded: true, notes: "" },
];

const CONFETTI_COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ef4444", "#06b6d4"];

function DeleteZone({ isOver }: { isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: "delete-zone" });
  
  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed transition-all duration-300 ${
        isOver
          ? "border-red-400 bg-red-50 text-red-600 scale-105"
          : "border-gray-300 bg-gray-50 text-gray-400"
      }`}
    >
      <Trash2 size={18} />
      <span className="text-sm font-medium">Drop here to delete</span>
    </div>
  );
}

interface SortableItemProps {
  item: TodoItem;
  depth?: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onToggleExpand: (id: string) => void;
  onOpenDetails: (id: string) => void;
  selectedId?: string | null;
  isDragging?: boolean;
}

function SortableItem({ 
  item, 
  depth = 0, 
  onToggle, 
  onDelete, 
  onAddChild,
  onToggleExpand,
  onOpenDetails,
  selectedId,
  isDragging 
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasChildren = item.children && item.children.length > 0;
  const isSelected = selectedId === item.id;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 ${
          isSelected ? "bg-yellow-100 ring-1 ring-yellow-300" : item.done ? "bg-slate-100" : "hover:bg-slate-50"
        } ${isSortableDragging ? "opacity-50 scale-95" : ""} ${isDragging ? "shadow-lg" : ""}`}
        style={{ marginLeft: depth * 24 }}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical size={14} />
        </button>

        {/* Expand/collapse for items with children */}
        {hasChildren ? (
          <button
            onClick={() => onToggleExpand(item.id)}
            className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {item.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Checkbox */}
        <label className="relative inline-flex items-center justify-center w-5 h-5">
          <input
            type="checkbox"
            checked={item.done}
            onChange={() => onToggle(item.id)}
            className="peer appearance-none absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <span
            className={`flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-200 ease-out transform ${
              item.done
                ? "bg-gray-900 border-gray-900 scale-95"
                : "border-gray-300 bg-white scale-100"
            }`}
          >
            <svg
              className={`w-3 h-3 text-white transition-opacity duration-200 ${
                item.done ? "opacity-100" : "opacity-0"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 12 9"
            >
              <path d="M1 4.2L4 7L11 1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </label>

        {/* Text */}
        <span
          onClick={() => onOpenDetails(item.id)}
          className={`flex-1 text-sm transition-all duration-200 cursor-pointer hover:text-gray-700 ${
            item.done ? "text-gray-500 line-through" : "text-gray-900"
          }`}
        >
          {item.text}
        </span>

        {/* Details button */}
        <button
          onClick={() => onOpenDetails(item.id)}
          className={`p-1 transition-all ${
            isSelected ? "text-yellow-600" : "text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100"
          }`}
          title="View details"
        >
          <FileText size={14} />
        </button>

        {/* Add subtask button */}
        <button
          onClick={() => onAddChild(item.id)}
          className="p-1 text-gray-400 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all"
          title="Add subtask"
        >
          <Plus size={14} />
        </button>

        {/* Delete button */}
        <button
          onClick={() => onDelete(item.id)}
          className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
          title="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Render children if expanded */}
      {hasChildren && item.expanded && (
        <SortableContext items={item.children!.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {item.children!.map((child) => (
            <SortableItem
              key={child.id}
              item={child}
              depth={depth + 1}
              onToggle={onToggle}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onToggleExpand={onToggleExpand}
              onOpenDetails={onOpenDetails}
              selectedId={selectedId}
            />
          ))}
        </SortableContext>
      )}
    </div>
  );
}

export function TodoCard() {
  const [items, setItems] = useState<TodoItem[]>(initialItems);
  const [dateInfo, setDateInfo] = useState({ date: "", time: "" });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isOverDelete, setIsOverDelete] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const date = now.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const time = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setDateInfo({ date, time });
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Flatten items for drag context
  const flattenItems = (items: TodoItem[]): string[] => {
    return items.reduce<string[]>((acc, item) => {
      acc.push(item.id);
      if (item.children && item.expanded) {
        acc.push(...flattenItems(item.children));
      }
      return acc;
    }, []);
  };

  const findItemById = (items: TodoItem[], id: string): TodoItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const deleteItemById = (items: TodoItem[], id: string): TodoItem[] => {
    return items.reduce<TodoItem[]>((acc, item) => {
      if (item.id === id) return acc;
      acc.push({
        ...item,
        children: item.children ? deleteItemById(item.children, id) : [],
      });
      return acc;
    }, []);
  };

  const toggleItemById = (items: TodoItem[], id: string): TodoItem[] => {
    return items.map((item) => {
      if (item.id === id) {
        return { ...item, done: !item.done };
      }
      if (item.children) {
        return { ...item, children: toggleItemById(item.children, id) };
      }
      return item;
    });
  };

  const toggleExpandById = (items: TodoItem[], id: string): TodoItem[] => {
    return items.map((item) => {
      if (item.id === id) {
        return { ...item, expanded: !item.expanded };
      }
      if (item.children) {
        return { ...item, children: toggleExpandById(item.children, id) };
      }
      return item;
    });
  };

  const addChildById = (items: TodoItem[], parentId: string): TodoItem[] => {
    return items.map((item) => {
      if (item.id === parentId) {
        const newChild: TodoItem = {
          id: `${parentId}-${Date.now()}`,
          text: "New subtask",
          done: false,
          children: [],
          expanded: true,
        };
        return { 
          ...item, 
          expanded: true,
          children: [...(item.children || []), newChild] 
        };
      }
      if (item.children) {
        return { ...item, children: addChildById(item.children, parentId) };
      }
      return item;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: any) => {
    setIsOverDelete(event.over?.id === "delete-zone");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over?.id === "delete-zone") {
      setItems(deleteItemById(items, active.id as string));
    } else if (over && active.id !== over.id) {
      // Simple reorder at root level for now
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        setItems(arrayMove(items, oldIndex, newIndex));
      }
    }
    
    setActiveId(null);
    setIsOverDelete(false);
  };

  const handleToggle = (id: string) => {
    setItems(toggleItemById(items, id));
  };

  const handleDelete = (id: string) => {
    setItems(deleteItemById(items, id));
  };

  const handleAddChild = (parentId: string) => {
    setItems(addChildById(items, parentId));
  };

  const handleToggleExpand = (id: string) => {
    setItems(toggleExpandById(items, id));
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: TodoItem = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      done: false,
      children: [],
      expanded: true,
    };
    setItems([...items, newTask]);
    setNewTaskText("");
  };

  const updateItemNotes = (items: TodoItem[], id: string, notes: string): TodoItem[] => {
    return items.map((item) => {
      if (item.id === id) {
        return { ...item, notes };
      }
      if (item.children) {
        return { ...item, children: updateItemNotes(item.children, id, notes) };
      }
      return item;
    });
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setItems(updateItemNotes(items, id, notes));
  };

  const selectedItem = selectedId ? findItemById(items, selectedId) : null;

  const resetList = () => setItems(initialItems);

  const countAllItems = (items: TodoItem[]): { total: number; done: number } => {
    return items.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.done) acc.done += 1;
        if (item.children) {
          const childCounts = countAllItems(item.children);
          acc.total += childCounts.total;
          acc.done += childCounts.done;
        }
        return acc;
      },
      { total: 0, done: 0 }
    );
  };

  const counts = countAllItems(items);
  const allDone = counts.total > 0 && counts.done === counts.total;

  const [celebrating, setCelebrating] = useState(false);
  const wasAllDoneRef = useRef(false);

  useEffect(() => {
    if (allDone && !wasAllDoneRef.current) {
      setCelebrating(true);
      wasAllDoneRef.current = true;
      const t = setTimeout(() => setCelebrating(false), 4000);
      return () => clearTimeout(t);
    }
    if (!allDone) {
      wasAllDoneRef.current = false;
      setCelebrating(false);
    }
  }, [allDone]);

  const activeItem = activeId ? findItemById(items, activeId) : null;

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const Header = (
    <div
      className={`flex items-center justify-between px-4 py-3 ${
        allDone
          ? "bg-gradient-to-b from-emerald-400 to-emerald-300"
          : "bg-gradient-to-b from-yellow-300 to-yellow-200"
      }`}
    >
      <div className="flex items-center space-x-3">
        <span className="text-sm font-semibold text-gray-900">{dateInfo.date}</span>
        <span className="bg-black/10 text-gray-800 text-xs font-medium px-2 py-1 rounded-md">
          {dateInfo.time}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md bg-white/60 hover:bg-white/80 transition-colors text-gray-700"
            title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}

        {allDone ? (
          <>
            <span className="text-sm font-semibold text-gray-900">All done!</span>
            <button
              onClick={resetList}
              className="text-gray-900 font-semibold text-xs px-2 py-1 rounded-md bg-white/60 hover:bg-white/80 transition"
            >
              Reset
            </button>
          </>
        ) : (
          <span className="text-sm font-medium text-gray-700">
            {counts.done}/{counts.total}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex">
      {/* Main Todo Card */}
      <div
        className={`w-[420px] rounded-2xl shadow-lg border overflow-hidden bg-white transition-all duration-500 ${
          allDone ? "border-emerald-200 ring-2 ring-emerald-200 scale-[1.01]" : "border-slate-100"
        } ${selectedId ? "rounded-r-none border-r-0" : ""}`}
      >
        {Header}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          className={`relative p-5 ${
            allDone
              ? "bg-[radial-gradient(circle,rgba(16,185,129,0.08)_1px,transparent_1px)]"
              : "bg-[radial-gradient(circle,rgba(0,0,0,0.06)_1px,transparent_1px)]"
          } [background-size:10px_10px]`}
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {allDone ? "You crushed it today" : "Things to do today"}
          </h3>

          {!allDone && (
            <>
              {/* Add new task input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  placeholder="Add a new task..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent"
                />
                <button
                  onClick={handleAddTask}
                  className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              <SortableContext items={flattenItems(items)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onAddChild={handleAddChild}
                      onToggleExpand={handleToggleExpand}
                      onOpenDetails={(id) => setSelectedId(selectedId === id ? null : id)}
                      selectedId={selectedId}
                    />
                  ))}
                </ul>
              </SortableContext>

              {/* Delete zone */}
              {activeId && (
                <div className="mt-4">
                  <DeleteZone isOver={isOverDelete} />
                </div>
              )}
            </>
          )}

          {allDone && (
            <div className="relative">
              <p className="mt-1 text-sm text-gray-700 font-medium">Take a breather and celebrate!</p>
              {celebrating && <ConfettiOverlay />}
            </div>
          )}

          {!allDone && (
            <p className="mt-4 text-sm text-gray-500">
              Drag tasks to reorder • Hover for actions
            </p>
          )}
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="px-3 py-2 bg-white rounded-lg shadow-xl border border-gray-200 text-sm text-gray-900">
              {activeItem.text}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      </div>

      {/* Expandable Details Panel */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          selectedId ? "w-[380px] opacity-100" : "w-0 opacity-0"
        }`}
      >
        {selectedItem && (
          <div className="w-[380px] h-full bg-white border border-l-0 border-slate-100 rounded-r-2xl shadow-lg flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-tr-2xl">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">{selectedItem.text}</h4>
                <p className="text-xs text-gray-500">Task details</p>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Markdown Editor */}
            <div className="flex-1 min-h-[400px]">
              <LiveMarkdownEditor
                value={selectedItem.notes || getDefaultNotes(selectedItem.text)}
                onChange={(notes) => handleUpdateNotes(selectedItem.id, notes)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfettiOverlay() {
  const pieces = Array.from({ length: 36 });
  return (
    <>
      <style>
        {`
        @keyframes confetti-fall {
          0% { transform: translateY(-20vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(80vh) rotate(720deg); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .confetti-piece { animation: none !important; }
        }
      `}
      </style>
      <div className="pointer-events-none fixed inset-0">
        {pieces.map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 0.5;
          const duration = 2.5 + Math.random() * 1.2;
          const size = 6 + Math.random() * 6;
          const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
          return (
            <span
              key={i}
              className="confetti-piece absolute rounded-sm"
              style={{
                left: `${left}%`,
                top: "-10px",
                width: `${size}px`,
                height: `${size * 0.4}px`,
                backgroundColor: color,
                transform: "translateY(0)",
                animation: `confetti-fall ${duration}s ease-in forwards`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>
    </>
  );
}
