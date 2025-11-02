"use client"

import type * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root 
      data-slot="tabs" 
      className={cn("flex flex-col gap-3 w-full", className)} 
      {...props} 
    />
  )
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-14 items-center justify-start gap-1 w-full overflow-x-auto px-4",
        "scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent scrollbar-thumb-rounded-full",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, children, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "group relative inline-flex items-center justify-center whitespace-nowrap px-3 py-2 text-sm font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "text-muted-foreground hover:text-foreground/80",
        className
      )}
      {...props}
    >
      <span className="relative flex items-center justify-center">
        <span className={cn(
          "absolute -left-1 flex h-2 w-2 items-center justify-center opacity-0 transition-opacity",
          "group-data-[state=active]:opacity-100"
        )}>
          <span className="absolute h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="px-3 py-1.5 rounded-full group-data-[state=active]:bg-primary/10">
          {children}
        </span>
      </span>
    </TabsPrimitive.Trigger>
  )
}

function TabsContent({ 
  className, 
  ...props 
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content 
      data-slot="tabs-content" 
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )} 
      {...props} 
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
