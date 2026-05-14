"use client"

import { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type ProtectedPageShellProps = {
  title: string
  description?: string
  children: ReactNode
  actions?: ReactNode
  message?: string
  error?: string
  maxWidthClassName?: string
}

export function ProtectedPageShell({
  title,
  description,
  children,
  actions,
  message,
  error,
  maxWidthClassName = "max-w-7xl",
}: ProtectedPageShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-8 py-4">
        <div className={`mx-auto flex ${maxWidthClassName} items-center justify-between gap-4`}>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && <p className="text-sm text-gray-500">{description}</p>}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      </header>

      <main className={`mx-auto ${maxWidthClassName} space-y-6 px-8 py-6`}>
        {message && <StatusBanner tone="success">{message}</StatusBanner>}
        {error && <StatusBanner tone="error">{error}</StatusBanner>}
        {children}
      </main>
    </div>
  )
}

function StatusBanner({
  tone,
  children,
}: {
  tone: "success" | "error"
  children: ReactNode
}) {
  const className =
    tone === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-red-200 bg-red-50 text-red-700"

  return <div className={`rounded-md border p-3 text-sm ${className}`}>{children}</div>
}

export function PageActionButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return <Button {...props}>{children}</Button>
}
