import * as React from 'react'

import { cn } from '../../lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot='input'
        className={cn(
          'h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors outline-none [color-scheme:light]',
          'placeholder:text-gray-400',
          'focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50',
          'aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20',
          'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
          'dark:bg-zinc-900 dark:text-gray-100 dark:border-zinc-700 dark:placeholder:text-zinc-500 dark:[color-scheme:dark]',
          'dark:focus-visible:border-indigo-400 dark:focus-visible:ring-indigo-400/20',
          'dark:disabled:bg-zinc-800',
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }