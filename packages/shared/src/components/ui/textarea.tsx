import * as React from 'react'

import { cn } from '../../lib/utils'

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      data-slot='textarea'
      className={cn(
        'flex field-sizing-content min-h-16 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors outline-none placeholder:text-gray-400 resize-y',
        'focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20',
        'dark:bg-zinc-900 dark:text-gray-100 dark:border-zinc-700 dark:placeholder:text-zinc-500',
        'dark:focus-visible:border-indigo-400 dark:focus-visible:ring-indigo-400/20',
        className
      )}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }
