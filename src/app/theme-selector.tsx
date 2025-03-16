"use client"

import { themes, type Theme } from "@/lib/themes"
import { useTheme } from "@/lib/use-theme"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <Select value={theme} onValueChange={(value: Theme) => setTheme(value)}>
      <SelectTrigger className="w-[150px]">
        <SelectValue placeholder="Select theme" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(themes).map(([key, value]) => (
          <SelectItem key={key} value={key}>
            {value.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

