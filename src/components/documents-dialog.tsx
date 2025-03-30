"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SavedDocument } from "@/lib/types";
import { FileIcon, Trash2Icon, Download, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DocumentsDialogProps {
  documents: SavedDocument[];
  onLoad: (doc: SavedDocument) => void;
  onDelete: (id: string) => void;
  onDownload: (doc: SavedDocument) => void;
  currentDocumentId?: string;
  trigger?: React.ReactNode;
}

export function DocumentsDialog({
  documents,
  onLoad,
  onDelete,
  onDownload,
  currentDocumentId,
  trigger,
}: DocumentsDialogProps) {
  const [open, setOpen] = useState(false);

  const handleLoad = (doc: SavedDocument) => {
    onLoad(doc);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <FileIcon className="h-4 w-4 mr-2" />
            Saved Documents
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Saved Documents</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {documents.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No saved documents
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Words</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow
                    key={doc.id}
                    className={
                      currentDocumentId === doc.id ? "bg-muted/50" : ""
                    }
                  >
                    <TableCell>
                      {doc.title}
                      {currentDocumentId === doc.id && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Current)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{doc.meta.wordCount}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(doc.updatedAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleLoad(doc)}
                          disabled={currentDocumentId === doc.id}
                          title={
                            currentDocumentId === doc.id
                              ? "Currently editing"
                              : "Edit document"
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onDelete(doc.id)}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
