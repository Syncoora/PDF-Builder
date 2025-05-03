"use client";

import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Download,
  Save,
  FileText,
  Eye,
  FileTextIcon as FileText2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SaveDialog } from "@/components/save-dialog";
import { DocumentsDialog } from "@/components/documents-dialog";
import {
  getSavedDocuments,
  saveDocument,
  updateDocument,
  deleteDocument,
} from "@/lib/storage";
import { createPDF } from "./pdf-document";
import { downloadWordDoc } from "./word-document";
import type { SavedDocument } from "@/lib/types";
import type { EditorRef } from "./editor";
import {
  initMondayClient,
  getContextData,
  getMondayClient,
} from "@/lib/monday-sdk";

// First, add the Dialog import at the top with the other imports
import { Dialog, DialogContent } from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus, FolderOpen, Sun, Moon } from "lucide-react";
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
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
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

  // Add this state for the loading popup
  const [loadingState, setLoadingState] = useState<{
    isLoading: boolean;
    type: "pdf" | "word" | "rtf" | null;
    progress: string;
  }>({
    isLoading: false,
    type: null,
    progress: "",
  });

  // Initialize Monday SDK and get context
  useEffect(() => {
    const initialize = async () => {
      try {
        await initMondayClient();

        // Set up listener for Monday.com theme
        const monday = getMondayClient();
        monday.listen("context", (res: any) => {
          if (res?.data?.theme) {
            const defaultMode = ["dark", "black"].includes(res.data.theme)
              ? "dark"
              : "light";
            setTheme(defaultMode);
            console.log(
              `Setting theme to ${defaultMode} based on Monday.com theme: ${res.data.theme}`
            );
          }
        });

        // Get initial context to set theme immediately
        monday.get("context").then((res: any) => {
          if (res?.data?.theme) {
            const defaultMode = ["dark", "black"].includes(res.data.theme)
              ? "dark"
              : "light";
            setTheme(defaultMode);
            console.log(
              `Initial theme set to ${defaultMode} based on Monday.com theme: ${res.data.theme}`
            );
          }
        });

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
  }, [toast, setTheme]);

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
    // Show loading popup
    setLoadingState({
      isLoading: true,
      type: "pdf",
      progress: "Preparing document...",
    });

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

      // Update progress
      setLoadingState((prev) => ({ ...prev, progress: "Generating PDF..." }));

      // Generate the PDF
      const blob = await createPDF({
        content: processedContent,
        theme: pdfTheme,
        meta: metaToUse,
        templateData: sampleData,
      });

      // Update progress
      setLoadingState((prev) => ({ ...prev, progress: "Downloading file..." }));

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
      // Hide loading popup
      setLoadingState({
        isLoading: false,
        type: null,
        progress: "",
      });
    }
  };

  // Handle downloading as Word document
  const handleDownloadWord = async (doc?: SavedDocument) => {
    let contentToDownload: string;
    let titleToUse = currentDocument?.title || "document";

    if (doc && currentDocument?.id !== doc.id) {
      // If downloading a different document, use that document's content
      contentToDownload = doc.content;
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
        description:
          "Please add some content before generating a Word document.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingWord(true);
    // Show loading popup
    setLoadingState({
      isLoading: true,
      type: "word",
      progress: "Preparing document...",
    });

    try {
      // Update progress
      setLoadingState((prev) => ({
        ...prev,
        progress: "Generating Word document...",
      }));

      // Download the Word document
      await downloadWordDoc(
        contentToDownload,
        `${titleToUse}-${new Date().toISOString().slice(0, 10)}`,
        sampleData
      );

      // Update progress
      setLoadingState((prev) => ({ ...prev, progress: "Downloading file..." }));

      toast({
        title: "Success",
        description: "Word document generated successfully",
      });
    } catch (error: any) {
      console.error("Error generating Word document:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to generate Word document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingWord(false);
      // Hide loading popup
      setLoadingState({
        isLoading: false,
        type: null,
        progress: "",
      });
    }
  };

  // Add this to the ExportMenu component's handleExportRtf function
  const handleExportRtf = async () => {
    try {
      //setIsExporting("rtf")
      // Show loading popup
      setLoadingState({
        isLoading: true,
        type: "rtf",
        progress: "Generating RTF document...",
      });

      //const rtfContent = createRtfDoc({ content, templateData })

      // Update progress
      setLoadingState((prev) => ({ ...prev, progress: "Downloading file..." }));

      //const blob = new Blob([rtfContent], { type: "text/rtf" })
      //FileSaver.saveAs(blob, `${filename}.rtf`)
    } catch (error) {
      console.error("Error exporting RTF:", error);
    } finally {
      //setIsExporting(null)
      // Hide loading popup
      setLoadingState({
        isLoading: false,
        type: null,
        progress: "",
      });
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
          <h1 className="text-2xl font-bold">Docsy</h1>
          {currentDocument && (
            <span className="text-sm text-muted-foreground">
              Editing:{" "}
              <span className="font-medium">{currentDocument.title}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Document stats */}
          <span className="text-sm text-muted-foreground mr-2">
            Words: {meta.wordCount} | Characters: {meta.charCount}
          </span>

          {/* Save Button - Now as a standalone button */}
          <Button variant="outline" onClick={handleSaveChanges}>
            <Save className="h-4 w-4 mr-2" />
            {currentDocument ? "Save" : "Save As"}
          </Button>

          {/* Preview Button - Now as a standalone button */}
          <Button variant="outline" onClick={togglePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>

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

          {/* Export Group - Now for PDF and Word downloads */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => handleDownloadPDF()}
                disabled={isGeneratingPDF || !content.trim()}
              >
                <FileText className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? "Generating PDF..." : "Download as PDF"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDownloadWord()}
                disabled={isGeneratingWord || !content.trim()}
              >
                <FileText2 className="h-4 w-4 mr-2" />
                {isGeneratingWord ? "Generating Word..." : "Download as Word"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dark/Light Mode Toggle */}
          <Button
            variant="outline"
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
            onDownloadWord={handleDownloadWord}
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
                sampleData={sampleData}
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

      {/* Loading Dialog */}
      <Dialog open={loadingState.isLoading} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" showClose={false}>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {loadingState.type === "pdf"
                ? "Generating PDF"
                : loadingState.type === "word"
                ? "Generating Word Document"
                : loadingState.type === "rtf"
                ? "Generating RTF Document"
                : null}
            </h3>
            <p className="text-muted-foreground text-center">
              {loadingState.progress}
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Please wait, this may take a moment...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
