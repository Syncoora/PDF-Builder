"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SaveIcon } from "lucide-react"

interface SaveDialogProps {
  onSave: (title: string) => void
  trigger?: React.ReactNode
}

export function SaveDialog({ onSave, trigger }: SaveDialogProps) {
  const [title, setTitle] = useState("")
  const [open, setOpen] = useState(false)

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim())
      setTitle("")
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
          <DialogTitle>Save Document</DialogTitle>
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
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

