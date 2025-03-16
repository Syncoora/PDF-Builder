"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Info } from "lucide-react";
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
import { getSavedDocuments, saveDocument, deleteDocument } from "@/lib/storage";
import { createPDF } from "./pdf-document";
import type { SavedDocument } from "@/lib/types";

import Editor from "./editor";

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
  const { toast } = useToast();

  // Load saved documents on mount
  useEffect(() => {
    setDocuments(getSavedDocuments());
  }, []);

  const handleSave = (title: string) => {
    try {
      const savedDoc = saveDocument({
        title,
        content,
        meta,
      });
      setDocuments([...documents, savedDoc]);
      toast({
        title: "Success",
        description: "Document saved successfully",
      });
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
  };

  const handleDelete = (id: string) => {
    try {
      deleteDocument(id);
      setDocuments(documents.filter((doc) => doc.id !== id));
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

  const handleDownloadPDF = async (doc?: SavedDocument) => {
    const contentToDownload = doc?.content || content;

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

      // Generate PDF blob
      const blob = await createPDF({
        content: processedContent,
        theme: pdfTheme,
        meta: doc?.meta || meta,
        templateData: sampleData,
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doc?.title || "document"}-${new Date()
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

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Text Editor</h1>
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
          <DocumentsDialog
            documents={documents}
            onLoad={handleLoad}
            onDelete={handleDelete}
            onDownload={handleDownloadPDF}
          />
          <SaveDialog onSave={handleSave} />
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
          <div className="border-l pl-4"></div>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <Editor
            content={content}
            onChange={setContent}
            onUpdateMeta={setMeta}
            variables={Object.keys(sampleData)}
          />
        </Card>
        <Card className="p-4">
          <div className="prose max-w-none dark:prose-invert min-h-[400px]">
            <div dangerouslySetInnerHTML={{ __html: processedContent }} />
          </div>
        </Card>
      </div>
    </div>
  );
}
