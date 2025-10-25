"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

interface AnimatedThemeTogglerProps
  extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = theme === "dark"

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current || !mounted) return

    const newTheme = theme === "dark" ? "light" : "dark"

    // Check if View Transitions are supported
    if (!document.startViewTransition) {
      // Fallback for browsers without View Transitions support
      setTheme(newTheme)
      return
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme)
      })
    }).ready

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }, [theme, setTheme, mounted, duration])

  if (!mounted) {
    return (
      <button
        ref={buttonRef}
        className={cn(className)}
        disabled
        {...props}
      >
        <Moon className="w-4 h-4" />
        <span className="sr-only">Toggle theme</span>
      </button>
    )
  }

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(className)}
      {...props}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}

