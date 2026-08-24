"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Props for the Tiptap-powered article content editor.
 *
 * This component is completely decoupled from any article domain model.
 * It renders a rich-text editor driven by Tiptap and exposes a controlled
 * HTML value through `onChange`.
 */
export type ArticleEditorProps = {
  /** Current editor HTML content. */
  value: string;
  /** Called whenever the editor content changes. Receives the new HTML. */
  onChange: (html: string) => void;
  /** Placeholder text shown when the editor is empty. */
  placeholder?: string;
  /** Whether the editor is editable. Defaults to true. */
  editable?: boolean;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PLACEHOLDER = "Start writing your article...";

// ---------------------------------------------------------------------------
// EditorToolbar (internal)
// ---------------------------------------------------------------------------

/**
 * Internal toolbar component rendered above the Tiptap editor.
 *
 * Each button queries the editor state via `editor.can()` to determine
 * whether the corresponding command is active and available.
 *
 * Buttons:
 *   Bold, Italic, Strike, H1, H2, Bullet List, Ordered List, Blockquote,
 *   Undo, Redo
 */
const EditorToolbar = memo(function EditorToolbar({
  editor,
}: {
  editor: Editor | null;
}) {
  /**
   * Dispatch a command on the editor and prevent default event bubbling.
   */
  const execute = useCallback(
    (fn: (e: Editor) => void) => {
      return (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!editor) return;
        fn(editor);
      };
    },
    [editor]
  );

  /**
   * Check whether a command is currently active in the editor.
   */
  const isActive = useCallback(
    (fn: (e: Editor) => boolean) => {
      return editor ? fn(editor) : false;
    },
    [editor]
  );

  // Button configuration — each entry defines the icon, aria-label,
  // activation check, and command handler.
  const buttons: {
    icon: string;
    ariaLabel: string;
    active: (e: Editor) => boolean;
    disabled: (e: Editor) => boolean;
    command: (e: Editor) => void;
  }[] = [
    {
      icon: "B",
      ariaLabel: "Bold",
      active: (e) => e.isActive("bold"),
      disabled: (e) => !e.can().toggleBold(),
      command: (e) => e.commands.toggleBold(),
    },
    {
      icon: "I",
      ariaLabel: "Italic",
      active: (e) => e.isActive("italic"),
      disabled: (e) => !e.can().toggleItalic(),
      command: (e) => e.commands.toggleItalic(),
    },
    {
      icon: "S",
      ariaLabel: "Strikethrough",
      active: (e) => e.isActive("strike"),
      disabled: (e) => !e.can().toggleStrike(),
      command: (e) => e.commands.toggleStrike(),
    },
    {
      icon: "H1",
      ariaLabel: "Heading 1",
      active: (e) => e.isActive("heading", { level: 1 }),
      disabled: (e) => !(e.can() as any).chain().focus().toggleHeading({ level: 1 }).run(),
      command: (e) => (e.chain() as any).focus().toggleHeading({ level: 1 }).run(),
    },
    {
      icon: "H2",
      ariaLabel: "Heading 2",
      active: (e) => e.isActive("heading", { level: 2 }),
      disabled: (e) => !(e.can() as any).chain().focus().toggleHeading({ level: 2 }).run(),
      command: (e) => (e.chain() as any).focus().toggleHeading({ level: 2 }).run(),
    },
    {
      icon: "•",
      ariaLabel: "Bullet list",
      active: (e) => e.isActive("bulletList"),
      disabled: (e) => !(e.can() as any).chain().focus().toggleBulletList().run(),
      command: (e) => (e.chain() as any).focus().toggleBulletList().run(),
    },
    {
      icon: "1.",
      ariaLabel: "Ordered list",
      active: (e) => e.isActive("orderedList"),
      disabled: (e) => !(e.can() as any).chain().focus().toggleOrderedList().run(),
      command: (e) => (e.chain() as any).focus().toggleOrderedList().run(),
    },
    {
      icon: "❝",
      ariaLabel: "Blockquote",
      active: (e) => e.isActive("blockquote"),
      disabled: (e) => !(e.can() as any).chain().focus().toggleBlockquote().run(),
      command: (e) => (e.chain() as any).focus().toggleBlockquote().run(),
    },
    {
      icon: "↶",
      ariaLabel: "Undo",
      active: () => false,
      disabled: (e) => !e.can().undo(),
      command: (e) => e.commands.undo(),
    },
    {
      icon: "↷",
      ariaLabel: "Redo",
      active: () => false,
      disabled: (e) => !e.can().redo(),
      command: (e) => e.commands.redo(),
    },
  ];

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-neutral-300 bg-neutral-50 p-2">
      {buttons.map((btn) => {
        const active = btn.active(editor);
        const disabled = btn.disabled(editor);

        return (
          <button
            key={btn.ariaLabel}
            type="button"
            onClick={execute(btn.command)}
            disabled={disabled}
            aria-label={btn.ariaLabel}
            aria-pressed={active}
            className={`rounded-md px-2.5 py-1.5 text-sm font-bold transition
              ${
                active
                  ? "bg-blue-100 text-blue-700"
                  : "text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800"
              }
              ${
                disabled
                  ? "cursor-not-allowed opacity-40"
                  : "cursor-pointer"
              }`}
          >
            {btn.icon}
          </button>
        );
      })}
    </div>
  );
});

// ---------------------------------------------------------------------------
// ArticleEditor
// ---------------------------------------------------------------------------

/**
 * Tiptap-powered rich-text editor for article content.
 *
 * A controlled component that renders a full editor with toolbar (bold,
 * italic, strikethrough, headings, lists, blockquote, undo/redo) and
 * synchronizes with the parent via HTML value changes.
 *
 * Features:
 * - Controlled: `value` prop drives editor content; `onChange` fires on every change
 * - External value updates are applied without triggering onChange loops
 * - Toolbar buttons highlight when active and disable when the command is unavailable
 * - Accessible: every button has type="button" and aria-label
 * - Tailwind-styled to match the admin panel design language
 */
export function ArticleEditor({
  value,
  onChange,
  placeholder = DEFAULT_PLACEHOLDER,
  editable = true,
}: ArticleEditorProps) {
  const prevValueRef = useRef<string>(value);

  /**
   * Initialize the Tiptap editor instance.
   *
   * The editor is recreated only when `value` or `editable` changes.
   * Content synchronization is handled via useEffect to avoid infinite
   * render loops between `onUpdate` and external value changes.
   */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ] as any,
    editable,
    content: value,
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();

      // Only call onChange when the content actually changed to avoid
      // unnecessary parent re-renders.
      if (html !== prevValueRef.current) {
        prevValueRef.current = html;
        onChange(html);
      }
    },
  });

  /**
   * Sync editor content when the `value` prop changes externally.
   *
   * Uses `editor.commands.setContent()` which does NOT trigger onUpdate,
   * preventing infinite render loops.
   */
  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getHTML();

    // Only update if the external value differs from what the editor holds.
    if (currentContent !== value) {
      editor.commands.setContent(value);
      prevValueRef.current = value;
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="flex min-h-[450px] items-center justify-center rounded-lg border border-neutral-300 bg-neutral-50">
        <p className="text-sm text-neutral-500">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-300 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
      <EditorToolbar editor={editor} />

      <div className="editor-wrapper bg-white">
        <EditorContent
          editor={editor}
          className="min-h-[450px] px-6 py-6 prose prose-neutral max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 prose-img:rounded-lg"
        />
      </div>
    </div>
  );
}
