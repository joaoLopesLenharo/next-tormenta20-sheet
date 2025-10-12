"use client"

import type * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

function Progress({ className, value, style, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("relative h-3 w-full overflow-hidden rounded-full bg-secondary", className)}
      style={style}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 transition-all"
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          backgroundColor: style?.["--progress-color" as any] || "hsl(var(--primary))",
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
