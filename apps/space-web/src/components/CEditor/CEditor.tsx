import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { useEffect, useRef } from 'react';
import CMenuBar from './CMenuBar';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  readOnly?: boolean;
  className?: string;
};

export function CEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  minHeight = '160px',
  readOnly = false,
  className,
}: Props) {
  const previousValueRef = useRef(value);
  const initializedRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder,
        includeChildren: true,
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-2',
        },
      }),
    ] as any,
    content: value || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'border border-border border-t-0 rounded-b-lg p-3 focus:outline-none bg-card text-foreground prose prose-sm dark:prose-invert max-w-none break-words',
        style: `min-height: ${minHeight};`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
    editable: !readOnly,
  });

  useEffect(() => {
    if (!editor) return;
    if (initializedRef.current && previousValueRef.current === value) return;
    const current = editor.getHTML();
    const normalizedValue = value || '';
    const normalizedCurrent = current === '<p></p>' ? '' : current;
    if (normalizedValue !== normalizedCurrent) {
      editor.commands.setContent(normalizedValue, { emitUpdate: false });
    }
    previousValueRef.current = normalizedValue;
    initializedRef.current = true;
  }, [value, editor]);

  return (
    <div className={className}>
      <CMenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
