"use client";

import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Info, Save } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { ThemeSelector } from "./theme-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SaveDialog } from "@/components/save-dialog";
import { DocumentsDialog } from "@/components/documents-dialog";
import {
  getSavedDocuments,
  saveDocument,
  updateDocument,
  deleteDocument,
} from "@/lib/storage";
import { createPDF } from "./pdf-document";
import type { SavedDocument } from "@/lib/types";
import type { EditorRef } from "./editor";

// Use React.lazy instead of next/dynamic
const Editor = lazy(() => import("./editor"));

// Example of dynamic data
const sampleData = {
  name: "test name",
  quantity: 3,
  price: 10,
  orderId: "ORD-123",
  date: "2024-02-21",
  customerEmail: "test@example.com",
};

export default function TextEditorPage() {
  const [content, setContent] = useState("");
  const [meta, setMeta] = useState({ wordCount: 0, charCount: 0 });
  const [pdfTheme, setPdfTheme] = useState("default");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [currentDocument, setCurrentDocument] = useState<SavedDocument | null>(
    null
  );
  const { toast } = useToast();
  const editorRef = useRef<EditorRef>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Add a new state variable to track preview visibility
  const [previewVisible, setPreviewVisible] = useState(false);

  // Load saved documents on mount
  useEffect(() => {
    setDocuments(getSavedDocuments());
  }, []);

  const handleSave = (title: string) => {
    try {
      // Get the latest content directly from the editor
      const currentContent = editorRef.current?.getContent() || content;

      if (currentDocument) {
        // Update existing document
        const updatedDoc = updateDocument(currentDocument.id, {
          title,
          content: currentContent,
          meta,
        });
        setCurrentDocument(updatedDoc);
        setDocuments(
          documents.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc))
        );
        toast({
          title: "Success",
          description: "Document updated successfully",
        });
      } else {
        // Create new document
        const savedDoc = saveDocument({
          title,
          content: currentContent,
          meta,
        });
        setCurrentDocument(savedDoc);
        setDocuments([...documents, savedDoc]);
        toast({
          title: "Success",
          description: "Document saved successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive",
      });
    }
  };

  // Update the handleLoad function to ensure content is properly set
  const handleLoad = (doc: SavedDocument) => {
    // Make sure to set the content state with the document's content
    setContent(doc.content);
    setMeta(doc.meta);
    setCurrentDocument(doc);
    toast({
      title: "Document Loaded",
      description: `Now editing: ${doc.title}`,
    });
  };

  const handleDelete = (id: string) => {
    try {
      deleteDocument(id);
      setDocuments(documents.filter((doc) => doc.id !== id));

      // If the deleted document is the current one, clear the current document
      if (currentDocument && currentDocument.id === id) {
        setCurrentDocument(null);
      }

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleSaveChanges = () => {
    if (currentDocument) {
      try {
        // Get the latest content directly from the editor
        const currentContent = editorRef.current?.getContent() || content;

        const updatedDoc = updateDocument(currentDocument.id, {
          content: currentContent,
          meta,
        });
        setCurrentDocument(updatedDoc);
        setDocuments(
          documents.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc))
        );
        toast({
          title: "Success",
          description: "Changes saved successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save changes",
          variant: "destructive",
        });
      }
    } else {
      // If no current document, show the save dialog
      document.getElementById("save-dialog-trigger")?.click();
    }
  };

  const handleNewDocument = () => {
    setContent("");
    setMeta({ wordCount: 0, charCount: 0 });
    setCurrentDocument(null);
    toast({
      title: "New Document",
      description: "Started a new document",
    });
  };

  // Update the handleDownloadPDF function to ensure tables are properly captured
  const handleDownloadPDF = async (doc?: SavedDocument) => {
    let contentToDownload: string;
    let metaToUse = meta;
    let titleToUse = currentDocument?.title || "document";

    if (doc && currentDocument?.id !== doc.id) {
      // If downloading a different document, use that document's content
      contentToDownload = doc.content;
      metaToUse = doc.meta;
      titleToUse = doc.title;
    } else {
      // For the current document, get content directly from the editor
      contentToDownload = editorRef.current?.getContent() || content;

      // Make sure we're using the latest content
      if (editorRef.current) {
        const currentContent = editorRef.current.getContent();
        setContent(currentContent);
      }
    }

    if (!contentToDownload.trim()) {
      toast({
        title: "No content",
        description: "Please add some content before generating a PDF.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // Process variables in content
      const processedContent = contentToDownload.replace(
        /\${(\w+)}/g,
        (match, key) => {
          const value = sampleData[key];
          return value != null ? String(value) : match;
        }
      );

      // Update the preview element with the latest content to ensure tables are rendered
      if (previewRef.current) {
        const tableContainer =
          previewRef.current.querySelector(".table-container");
        if (tableContainer) {
          tableContainer.innerHTML = processedContent;
        }

        // Give a small delay to ensure the DOM is updated
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Generate the PDF
      const blob = await createPDF({
        content: processedContent,
        theme: pdfTheme,
        meta: metaToUse,
        templateData: sampleData,
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${titleToUse}-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      toast({
        title: "Success",
        description: "PDF generated successfully",
      });
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Process the HTML content for preview
  const processedContent = content.replace(/\${(\w+)}/g, (match, key) => {
    const value = sampleData[key];
    return value != null ? String(value) : match;
  });

  useEffect(() => {
    const previewElement = document.querySelector(".pdf-preview");
    if (previewElement) {
      // Remove all theme classes
      previewElement.classList.remove(
        "theme-default",
        "theme-modern",
        "theme-minimal",
        "theme-professional"
      );
      // Add the selected theme class
      previewElement.classList.add(`theme-${pdfTheme}`);
    }
  }, [pdfTheme]);

  // Add a toggle function for the preview
  const togglePreview = () => {
    setPreviewVisible(!previewVisible);
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Text Editor</h1>
          {currentDocument && (
            <span className="text-sm text-muted-foreground">
              Editing:{" "}
              <span className="font-medium">{currentDocument.title}</span>
            </span>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Info className="h-4 w-4" />
                <span className="sr-only">View available variables</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h3 className="font-semibold">Available Variables</h3>
                <div className="space-y-2">
                  {Object.entries(sampleData).map(([key, value]) => (
                    <div key={key} className="text-sm grid gap-1">
                      <code className="px-2 py-1 bg-muted rounded-md">
                        ${"{" + key + "}"}
                      </code>
                      <span className="text-xs text-muted-foreground">
                        Current value: {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Words: {meta.wordCount} | Characters: {meta.charCount}
            </span>
          </div>
          <Button variant="outline" onClick={handleNewDocument}>
            New Document
          </Button>
          <Button variant="outline" onClick={handleSaveChanges}>
            <Save className="h-4 w-4 mr-2" />
            {currentDocument ? "Save Changes" : "Save"}
          </Button>
          <SaveDialog
            onSave={handleSave}
            initialTitle={currentDocument?.title || ""}
            trigger={
              <Button
                id="save-dialog-trigger"
                variant="outline"
                className="hidden"
              >
                Save As
              </Button>
            }
          />
          <DocumentsDialog
            documents={documents}
            onLoad={handleLoad}
            onDelete={handleDelete}
            onDownload={handleDownloadPDF}
            currentDocumentId={currentDocument?.id}
          />
          <ThemeSelector />
          <Select value={pdfTheme} onValueChange={setPdfTheme}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="PDF Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => handleDownloadPDF()}
            disabled={isGeneratingPDF || !content.trim()}
          >
            <Download className="w-4 w-4 mr-2" />
            {isGeneratingPDF ? "Generating..." : "Download PDF"}
          </Button>
          {/* Add this button after the "Download PDF" button but before the theme toggle: */}
          <Button onClick={togglePreview} variant="outline">
            {previewVisible ? "Hide Preview" : "Show Preview"}
          </Button>
          <div className="border-l pl-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
      {/* Update the grid layout to be responsive to the preview visibility */}
      {/* Replace the existing grid div with this: */}
      <div
        className={
          previewVisible
            ? "grid lg:grid-cols-2 gap-4"
            : "grid grid-cols-1 gap-4"
        }
      >
        <Card className="p-4">
          <Suspense
            fallback={
              <div className="min-h-[400px] flex items-center justify-center">
                Loading editor...
              </div>
            }
          >
            <Editor
              ref={editorRef}
              content={content}
              onChange={setContent}
              onUpdateMeta={setMeta}
              variables={Object.keys(sampleData)}
            />
          </Suspense>
        </Card>

        {previewVisible && (
          <Card className="p-4 bg-white">
            <div
              ref={previewRef}
              className={`prose max-w-none dark:prose-invert min-h-[400px] pdf-preview theme-${pdfTheme}`}
            >
              <div
                className="table-container"
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
