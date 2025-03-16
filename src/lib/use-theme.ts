"use client"

import { useEffect, useState } from "react"
import { themes, type Theme } from "./themes"

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    const root = document.documentElement
    const colors = themes[theme].colors

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })
  }, [theme])

  return { theme, setTheme }
}

