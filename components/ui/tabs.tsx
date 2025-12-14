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
        "sticky top-0 z-50 w-full inline-flex h-16 items-center justify-start gap-1 px-6",
        "bg-background/80 backdrop-blur-sm border-b border-border",
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
        "group relative inline-flex items-center justify-center whitespace-nowrap px-4 py-3 text-sm font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        "data-[state=active]:text-foreground data-[state=active]:bg-muted",
        "rounded-lg transition-colors duration-200",
        className
      )}
      {...props}
    >
      <span className="relative flex items-center justify-center gap-2">
        <span className={cn(
          "flex items-center justify-center opacity-0 w-0 transition-all duration-200 overflow-hidden",
          "group-data-[state=active]:opacity-100 group-data-[state=active]:w-2"
        )}>
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        </span>
        <span>
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
