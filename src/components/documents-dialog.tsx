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
import {
  FileIcon,
  Trash2Icon,
  Download,
  Edit,
  FileTextIcon as FileText2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentsDialogProps {
  documents: SavedDocument[];
  onLoad: (doc: SavedDocument) => void;
  onDelete: (id: string) => void;
  onDownload: (doc: SavedDocument) => void;
  onDownloadWord?: (doc: SavedDocument) => void;
  currentDocumentId?: string;
  trigger?: React.ReactNode;
  isLoading?: boolean;
  onLoadingStateChange?: (state: {
    isLoading: boolean;
    type: "pdf" | "word" | "rtf" | null;
    progress: string;
  }) => void;
}

export function DocumentsDialog({
  documents,
  onLoad,
  onDelete,
  onDownload,
  onDownloadWord,
  currentDocumentId,
  trigger,
  isLoading = false,
  onLoadingStateChange,
}: DocumentsDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null);

  const handleLoad = (doc: SavedDocument) => {
    onLoad(doc);
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleteInProgress(id);
      await onDelete(id);
    } finally {
      setDeleteInProgress(null);
    }
  };

  const handleDownload = (doc: SavedDocument) => {
    onDownload(doc);
    // Close the dialog when download starts
    setOpen(false);
  };

  const handleDownloadWord = (doc: SavedDocument) => {
    if (onDownloadWord) {
      onDownloadWord(doc);
      // Close the dialog when download starts
      setOpen(false);
    }
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
          {isLoading ? (
            <div className="text-center py-8">Loading documents...</div>
          ) : documents.length === 0 ? (
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDownload(doc)}
                            >
                              <FileIcon className="h-4 w-4 mr-2" />
                              Download as PDF
                            </DropdownMenuItem>
                            {onDownloadWord && (
                              <DropdownMenuItem
                                onClick={() => handleDownloadWord(doc)}
                              >
                                <FileText2 className="h-4 w-4 mr-2" />
                                Download as Word
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(doc.id)}
                          disabled={deleteInProgress === doc.id}
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
