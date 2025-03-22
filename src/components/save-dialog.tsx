"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SaveIcon } from "lucide-react"

interface SaveDialogProps {
  onSave: (title: string) => void
  trigger?: React.ReactNode
  initialTitle?: string
}

export function SaveDialog({ onSave, trigger, initialTitle = "" }: SaveDialogProps) {
  const [title, setTitle] = useState(initialTitle)
  const [open, setOpen] = useState(false)

  // Update title when initialTitle changes
  useEffect(() => {
    setTitle(initialTitle)
  }, [initialTitle])

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim())
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon">
            <SaveIcon className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialTitle ? "Update Document" : "Save Document"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
            />
          </div>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {initialTitle ? "Update" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

