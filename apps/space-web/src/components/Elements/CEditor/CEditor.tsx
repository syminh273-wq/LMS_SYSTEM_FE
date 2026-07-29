import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TableKit } from '@tiptap/extension-table'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import React, { useEffect, useRef } from 'react'
import { Control, FieldPath, FieldValues } from 'react-hook-form'

import { FormField, FormItem, FormControl, FormMessage } from '@shared/components/ui/form'

import CMenuBar from './CMenuBar'
import { prepareContentForEditor } from './utils/preprocessDriveImages'

interface CEditorProps<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> {
  control: Control<TFieldValues, any, any>
  name: TName
  minHeight?: string
  readOnly?: boolean
  placeholder?: string
}

const CEditor = <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({
  control,
  name,
  minHeight = '200px',
  readOnly = false,
  placeholder = 'Nhập nội dung...',
}: CEditorProps<TFieldValues, TName>) => {
  return (
    <FormField
      control={control as Control<any>}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className="w-full">
          <FormControl>
            <CEditorContent
              {...field}
              minHeight={minHeight}
              isReadOnly={readOnly}
              hasError={!!fieldState.error}
              placeholder={placeholder}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

const CEditorContent = React.forwardRef<HTMLDivElement, any & { minHeight?: string; isReadOnly?: boolean; hasError?: boolean; placeholder?: string }>(
  ({ onChange, value, minHeight = '200px', isReadOnly = false, hasError = false, placeholder, ...props }, ref) => {
    const previousValueRef = useRef<string>('')

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          codeBlock: false,
        }),
        Underline,
        TableKit,
        Image.configure({
          allowBase64: true,
          HTMLAttributes: {
            class: 'rounded-lg max-w-full h-auto my-2',
          },
        }),
        Placeholder.configure({
          placeholder: placeholder || 'Nhập nội dung...',
          includeChildren: true,
        }),
      ],
      content: prepareContentForEditor(value || ''),
      editorProps: {
        attributes: {
          class: `border-border border-[1.5px] border-t-0 rounded-lg rounded-t-none p-3 focus:outline-none bg-card text-foreground min-h-[${minHeight}] prose dark:prose-invert max-w-none`,
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        if (html === '<p></p>' || html === '') {
          onChange('')
        } else {
          onChange(html)
        }
      },
      editable: !isReadOnly,
    })

    useEffect(() => {
      if (!editor) return

      const normalizedValue = value || ''
      if (previousValueRef.current === normalizedValue) return

      const currentEditorContent = editor.getHTML()
      const normalizedCurrent = currentEditorContent === '<p></p>' ? '' : currentEditorContent

      if (normalizedValue !== normalizedCurrent) {
        editor.commands.setContent(normalizedValue, { emitUpdate: false })
      }
      previousValueRef.current = normalizedValue
    }, [value, editor])

    return (
      <div className={`w-full rounded-lg ${hasError ? 'border-[1.5px] border-rose-500' : ''}`} ref={ref}>
        <CMenuBar editor={editor as any} content={value} />
        <EditorContent editor={editor} {...props} />
      </div>
    )
  }
)

CEditorContent.displayName = 'CEditorContent'

export default CEditor
