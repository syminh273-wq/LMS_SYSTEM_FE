'use client'

import Blockquote from '@tiptap/extension-blockquote'
import Bold from '@tiptap/extension-bold'
import BulletList from '@tiptap/extension-bullet-list'
import Code from '@tiptap/extension-code'
import Document from '@tiptap/extension-document'
import Heading from '@tiptap/extension-heading'
import History from '@tiptap/extension-history'
import Italic from '@tiptap/extension-italic'
import ListItem from '@tiptap/extension-list-item'
import OrderedList from '@tiptap/extension-ordered-list'
import Paragraph from '@tiptap/extension-paragraph'
import Strike from '@tiptap/extension-strike'
import { TableKit } from '@tiptap/extension-table'
import Text from '@tiptap/extension-text'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import HardBreak from '@tiptap/extension-hard-break'
import { useEditor, EditorContent } from '@tiptap/react'
import React, { useEffect, useRef } from 'react'
import { Control, FieldPath, FieldValues } from 'react-hook-form'

import { FormField, FormItem, FormControl, FormMessage } from '@shared/components/ui/form'

import CMenuBar from './CMenuBar'
import { prepareContentForEditor, cleanupHtmlContent } from './utils/preprocessDriveImages'

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
      control={control as any}
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
    const initializedRef = useRef(false)
    const previousValueRef = useRef<string>('')

    const getInitialContent = (rawValue: string) => {
      return prepareContentForEditor(rawValue || '')
    }

    const editor = useEditor({
      extensions: [
        Document,
        Paragraph,
        Text,
        Bold,
        Italic,
        Strike,
        Code,
        Underline,
        Heading.configure({ levels: [1, 2, 3] }),
        Blockquote,
        BulletList,
        OrderedList,
        ListItem,
        History,
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
        HardBreak.extend({
          addKeyboardShortcuts() {
            return {
              'Mod-Enter': () => this.editor.commands.setHardBreak(),
              'Shift-Enter': () => this.editor.commands.setHardBreak(),
              'Ctrl-Space': () => this.editor.commands.setHardBreak(),
            }
          },
        }),
      ],
      content: getInitialContent(value || ''),
      editorProps: {
        attributes: {
          class: `border-border border-[1.5px] border-t-0 rounded-lg rounded-t-none p-3 focus:outline-none bg-card text-foreground min-h-[${minHeight}] prose dark:prose-invert max-w-none`,
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        // If content is just an empty paragraph, send empty string
        if (html === '<p></p>' || html === '') {
          onChange('')
        } else {
          onChange(html)
        }
      },
      editable: !isReadOnly,
    })

    useEffect(() => {
      if (!editor || value === undefined) return
      
      const currentEditorContent = editor.getHTML()
      const normalizedValue = value || ''
      const normalizedCurrent = currentEditorContent === '<p></p>' ? '' : currentEditorContent

      if (normalizedValue !== normalizedCurrent && normalizedValue !== previousValueRef.current) {
        editor.commands.setContent(normalizedValue)
      }
      previousValueRef.current = normalizedValue
    }, [value, editor])

    useEffect(() => {
      if (editor && !initializedRef.current) {
        initializedRef.current = true
        editor.commands.setContent(value || '')
        previousValueRef.current = value
      }
    }, [editor, value])

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
