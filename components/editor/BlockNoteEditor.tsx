"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";


import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function BlockNoteEditor({
  value,
  onChange,
}: Props) {
  const editor = useCreateBlockNote({
    initialContent: value
      ? [
          {
            type: "paragraph",
            content: value,
          },
        ]
      : undefined,
  });

return (
  <BlockNoteView
    editor={editor}
    theme="light"
    onChange={() => {
      onChange(JSON.stringify(editor.document));
    }}
  />
);
}