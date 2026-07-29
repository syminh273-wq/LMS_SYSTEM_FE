import { type Editor } from '@tiptap/react'
import { Button } from '@shared/components/ui/button';
import { 
  Bold, Italic, Underline, Strikethrough, Code, 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Table, 
  Image as ImageIcon, Undo, Redo 
} from 'lucide-react'
import React from 'react'

type Props = {
  editor: Editor
  content: string
}

interface ToolbarButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  isActive?: boolean
  disabled?: boolean
  tooltip: string
  children: React.ReactNode
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, isActive = false, disabled = false, tooltip, children }) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={isActive ? 'default' : 'ghost'}
      size="icon"
      className="relative group"
    >
      <div className="w-5 h-5">{children}</div>
      <span
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs
        font-medium text-background bg-foreground rounded opacity-0 group-hover:opacity-100
        transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10"
      >
        {tooltip}
      </span>
    </Button>
  )
}

const ToolbarDivider = () => <div className="w-px h-6 bg-border mx-1" />

const CEditorMenuBar = ({ editor }: Props) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  if (!editor) {
    return null
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target?.result as string
        editor
          .chain()
          .focus()
          .insertContent([
            {
              type: 'image',
              attrs: { src: url },
            },
            {
              type: 'paragraph',
            },
          ])
          .run()
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div
      className="px-3 py-2 rounded-tl-lg rounded-tr-lg flex items-center gap-1 w-full
      border border-border bg-card shadow-sm flex-wrap"
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
          isActive={editor.isActive('bold')}
          tooltip="Bold (Ctrl+B)"
        >
          <Bold className="w-5 h-5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
          isActive={editor.isActive('italic')}
          tooltip="Italic (Ctrl+I)"
        >
          <Italic className="w-5 h-5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run() }}
          isActive={editor.isActive('underline')}
          tooltip="Underline (Ctrl+U)"
        >
          <Underline className="w-5 h-5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run() }}
          isActive={editor.isActive('strike')}
          tooltip="Strikethrough"
        >
          <Strikethrough className="w-5 h-5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleCode().run() }}
          isActive={editor.isActive('code')}
          tooltip="Inline Code"
        >
          <Code className="w-5 h-5" />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run() }}
          isActive={editor.isActive('heading', { level: 1 })}
          tooltip="Heading 1"
        >
          <Heading1 className="w-5 h-5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }}
          isActive={editor.isActive('heading', { level: 2 })}
          tooltip="Heading 2"
        >
          <Heading2 className="w-5 h-5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run() }}
          isActive={editor.isActive('heading', { level: 3 })}
          tooltip="Heading 3"
        >
          <Heading3 className="w-5 h-5" />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
          isActive={editor.isActive('bulletList')}
          tooltip="Bullet List"
        >
          <List className="w-5 h-5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}
          isActive={editor.isActive('orderedList')}
          tooltip="Numbered List"
        >
          <ListOrdered className="w-5 h-5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run() }}
          isActive={editor.isActive('blockquote')}
          tooltip="Quote"
        >
          <Quote className="w-5 h-5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={(e) => { e.preventDefault(); editor.chain().focus().insertTable().run() }}
          tooltip="Insert Table"
        >
          <Table className="w-5 h-5" />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={(e) => { e.preventDefault(); fileInputRef.current?.click() }}
          tooltip="Insert Image"
        >
          <ImageIcon className="w-5 h-5" />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={(e) => { e.preventDefault(); editor.chain().focus().undo().run() }}
          disabled={!editor.can().undo()}
          tooltip="Undo (Ctrl+Z)"
        >
          <Undo className="w-5 h-5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={(e) => { e.preventDefault(); editor.chain().focus().redo().run() }}
          disabled={!editor.can().redo()}
          tooltip="Redo (Ctrl+Y)"
        >
          <Redo className="w-5 h-5" />
        </ToolbarButton>
      </div>
    </div>
  )
}

export default CEditorMenuBar
