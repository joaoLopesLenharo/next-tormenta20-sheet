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
    <div className="sticky top-0 z-50 w-full bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
      <TabsPrimitive.List
        data-slot="tabs-list"
        className={cn(
          "max-w-7xl mx-auto inline-flex h-16 items-center justify-start gap-1 w-full overflow-x-auto px-6",
          "scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent scrollbar-thumb-rounded-full",
          className
        )}
        {...props}
      />
    </div>
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
        "text-gray-300 hover:text-white hover:bg-gray-800/50",
        "data-[state=active]:text-white data-[state=active]:bg-gray-800/80",
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
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
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
