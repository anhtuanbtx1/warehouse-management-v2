"use client"

import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
  isDark: boolean
  onToggle: () => void
}

export function ThemeToggle({ className, isDark, onToggle }: ThemeToggleProps) {
  return (
    <div
      className={cn(
        "theme-toggle-container cursor-pointer transition-all duration-300",
        isDark 
          ? "dark-theme-toggle" 
          : "light-theme-toggle",
        className
      )}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '64px',
        height: '32px',
        padding: '4px',
        borderRadius: '9999px',
        backgroundColor: isDark ? '#09090b' : '#ffffff',
        border: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`,
        flexShrink: 0
      }}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onToggle()
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '9999px',
            transition: 'transform 300ms ease, background-color 300ms ease',
            transform: isDark ? 'translateX(0)' : 'translateX(32px)',
            backgroundColor: isDark ? '#27272a' : '#e5e7eb',
            position: 'absolute',
            left: 0,
            zIndex: 2
          }}
        >
          {isDark ? (
            <Moon 
              size={16}
              color="#ffffff"
              strokeWidth={1.5}
            />
          ) : (
            <Sun 
              size={16}
              color="#374151"
              strokeWidth={1.5}
            />
          )}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '9999px',
            transition: 'transform 300ms ease',
            transform: isDark ? 'translateX(0)' : 'translateX(-32px)',
            backgroundColor: 'transparent',
            position: 'absolute',
            right: 0,
            zIndex: 1
          }}
        >
          {isDark ? (
            <Sun 
              size={16}
              color="#6b7280"
              strokeWidth={1.5}
            />
          ) : (
            <Moon 
              size={16}
              color="#000000"
              strokeWidth={1.5}
            />
          )}
        </div>
      </div>
    </div>
  )
}
