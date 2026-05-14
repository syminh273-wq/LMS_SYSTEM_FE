"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card"

type ResourceManagementSectionProps<TItem> = {
  title: string
  recordsLabel?: string
  items: TItem[]
  loading?: boolean
  emptyText: string
  loadingText: string
  form: ReactNode
  renderItem: (item: TItem) => ReactNode
}

export function ResourceManagementSection<TItem>({
  title,
  recordsLabel,
  items,
  loading,
  emptyText,
  loadingText,
  form,
  renderItem,
}: ResourceManagementSectionProps<TItem>) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <span className="text-sm font-medium text-muted-foreground">
          {recordsLabel ?? `${items.length} records`}
        </span>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="rounded-lg bg-muted/30 p-4 border border-border/50">
          {form}
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-center py-8 text-sm text-muted-foreground animate-pulse">
              {loadingText}
            </p>
          ) : items.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">
              {emptyText}
            </p>
          ) : (
            <div className="grid gap-3">
              {items.map(renderItem)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
