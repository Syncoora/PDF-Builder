"use client";

import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Info, Save, FileText } from "lucide-react";
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
import { initMondayClient, getContextData } from "@/lib/monday-sdk";

// First, add the Dialog import at the top with the other imports
import { Dialog, DialogContent } from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Check,
  Plus,
  FolderOpen,
  FileOutput,
  Eye,
  Palette,
  Paintbrush,
  Sun,
  Moon,
} from "lucide-react";
import { themes, type Theme } from "@/lib/themes";
import { useTheme } from "@/lib/use-theme";

// Use React.lazy instead of next/dynamic
const Editor = lazy(() => import("./editor"));

// Example of dynamic data
// const sampleData = {
//   name: "test name",
//   quantity: 3,
//   price: 10,
//   orderId: "ORD-123",
//   date: "2024-02-21",
//   customerEmail: "test@example.com",
// };

export default function TextEditorPage({ sampleData }) {
  const [content, setContent] = useState("");
  const [meta, setMeta] = useState({ wordCount: 0, charCount: 0 });
  const [pdfTheme, setPdfTheme] = useState("default");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [currentDocument, setCurrentDocument] = useState<SavedDocument | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  const editorRef = useRef<EditorRef>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Initialize Monday SDK and get context
  useEffect(() => {
    const initialize = async () => {
      try {
        await initMondayClient();
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing Monday SDK:", error);
        toast({
          title: "Error",
          description: "Failed to initialize Monday SDK",
          variant: "destructive",
        });
        setIsInitialized(true); // Set to true anyway to allow the app to function
      }
    };

    initialize();
  }, [toast]);

  // Load saved documents after initialization
  useEffect(() => {
    if (isInitialized) {
      loadDocuments();

      // Display context information for debugging
      const context = getContextData();
      console.log("Monday Context:", context);

      if (context.isOnItem && context.boardId) {
        console.log(`Using storage key: DOCSY_BOARD_${context.boardId}`);
      } else {
        console.log("Using storage key: DOCSY_OBJECT");
      }
    }
  }, [isInitialized]);

  // Load saved documents
  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await getSavedDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast({
        title: "Error",
        description: "Failed to load saved documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (title: string) => {
    try {
      // Get the latest content directly from the editor
      const currentContent = editorRef.current?.getContent() || content;

      if (currentDocument) {
        // Update existing document
        const updatedDoc = await updateDocument(currentDocument.id, {
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
        const savedDoc = await saveDocument({
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

  const handleLoad = (doc: SavedDocument) => {
    setContent(doc.content);
    setMeta(doc.meta);
    setCurrentDocument(doc);
    toast({
      title: "Document Loaded",
      description: `Now editing: ${doc.title}`,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
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

  const handleSaveChanges = async () => {
    if (currentDocument) {
      try {
        // Get the latest content directly from the editor
        const currentContent = editorRef.current?.getContent() || content;

        const updatedDoc = await updateDocument(currentDocument.id, {
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

  const togglePreview = () => {
    setPreviewDialogOpen(!previewDialogOpen);
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Initializing Monday SDK...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we connect to Monday.com
          </p>
        </div>
      </div>
    );
  }

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
          {Object.keys(sampleData).length > 0 && (
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
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Document stats */}
          <span className="text-sm text-muted-foreground mr-2">
            Words: {meta.wordCount} | Characters: {meta.charCount}
          </span>

          {/* Document Management Group */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Document
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleNewDocument}>
                <Plus className="h-4 w-4 mr-2" />
                New Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSaveChanges}>
                <Save className="h-4 w-4 mr-2" />
                {currentDocument ? "Save Changes" : "Save"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  document.getElementById("documents-dialog-trigger")?.click()
                }
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Saved Documents
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hidden trigger for documents dialog */}
          <Button
            id="documents-dialog-trigger"
            className="hidden"
            onClick={() =>
              document.getElementById("documents-dialog-real-trigger")?.click()
            }
          />

          {/* Export/Preview Group */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileOutput className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={togglePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="h-4 w-4 mr-2" />
                  PDF Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setPdfTheme("default")}>
                    {pdfTheme === "default" && (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Default
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPdfTheme("modern")}>
                    {pdfTheme === "modern" && (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Modern
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPdfTheme("minimal")}>
                    {pdfTheme === "minimal" && (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Minimal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPdfTheme("professional")}>
                    {pdfTheme === "professional" && (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Professional
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem
                onClick={() => handleDownloadPDF()}
                disabled={isGeneratingPDF || !content.trim()}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? "Generating..." : "Download PDF"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Appearance Group */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Paintbrush className="h-4 w-4 mr-2" />
                Appearance
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="h-4 w-4 mr-2" />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {Object.entries(themes).map(([key, value]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setTheme(key as Theme)}
                    >
                      {theme === key && <Check className="h-4 w-4 mr-2" />}
                      {value.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? (
                  <>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4 mr-2" />
                    Light Mode
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
            isLoading={isLoading}
            trigger={
              <Button id="documents-dialog-real-trigger" className="hidden" />
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="p-4">
          {isLoading ? (
            <div className="min-h-[400px] flex items-center justify-center">
              Loading documents...
            </div>
          ) : (
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
          )}
        </Card>
      </div>

      {/* Add the preview dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <div
            ref={previewRef}
            className={`prose max-w-none dark:prose-invert pdf-preview theme-${pdfTheme}`}
          >
            <div
              className="table-container"
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
