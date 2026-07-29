"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"

type MessageProps = React.HTMLAttributes<HTMLDivElement> & {
  from?: "user" | "assistant" | "system"
  align?: "left" | "right"
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, from = "user", align, ...props }, ref) => {
    const side =
      align ?? (from === "user" ? "right" : from === "assistant" ? "left" : "left")
    return (
      <div
        ref={ref}
        data-from={from}
        data-align={side}
        className={cn(
          "group flex w-full gap-2",
          side === "right" ? "justify-end" : "justify-start",
          className
        )}
        {...props}
      />
    )
  }
)
Message.displayName = "Message"

const MessageAvatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground self-end",
      className
    )}
    {...props}
  />
))
MessageAvatar.displayName = "MessageAvatar"

const MessageContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex min-w-0 max-w-[78%] flex-col gap-1",
      className
    )}
    {...props}
  />
))
MessageContent.displayName = "MessageContent"

type BubbleProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "primary" | "muted" | "card"
  size?: "sm" | "md"
}

const Bubble = React.forwardRef<HTMLDivElement, BubbleProps>(
  ({ className, variant = "muted", size = "md", ...props }, ref) => {
    const variantClass: Record<NonNullable<BubbleProps["variant"]>, string> = {
      primary: "bg-primary text-primary-foreground shadow-sm",
      muted: "bg-muted text-foreground border border-border/60",
      card: "bg-card text-foreground border border-border shadow-sm",
    }
    const sizeClass: Record<NonNullable<BubbleProps["size"]>, string> = {
      sm: "px-3 py-1.5 text-[13px] rounded-2xl",
      md: "px-4 py-2.5 text-sm rounded-2xl",
    }
    return (
      <div
        ref={ref}
        data-variant={variant}
        className={cn(
          "break-words whitespace-pre-wrap leading-relaxed",
          variantClass[variant],
          sizeClass[size],
          className
        )}
        {...props}
      />
    )
  }
)
Bubble.displayName = "Bubble"

const BubbleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1.5", className)} {...props} />
))
BubbleContent.displayName = "BubbleContent"

const BubbleMeta = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mt-0.5 flex items-center gap-1 px-1 text-[10px] text-muted-foreground font-medium",
      className
    )}
    {...props}
  />
))
BubbleMeta.displayName = "BubbleMeta"

const TypingIndicator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-1 px-1 text-muted-foreground", className)}
    {...props}
  >
    <span className="flex gap-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
    </span>
  </div>
))
TypingIndicator.displayName = "TypingIndicator"

function MessageAvatarFallback({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const initials = (name || "?").trim().slice(0, 2).toUpperCase()
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

function MessageAvatarImage({
  src,
  alt,
  fallback,
  className,
}: {
  src?: string
  alt: string
  fallback: string
  className?: string
}) {
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      {src ? <AvatarImage src={src} alt={alt} /> : null}
      <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
        {(fallback || "?").trim().slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

export {
  Message,
  MessageAvatar,
  MessageAvatarFallback,
  MessageAvatarImage,
  MessageContent,
  Bubble,
  BubbleContent,
  BubbleMeta,
  TypingIndicator,
}
