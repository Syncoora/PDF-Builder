"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileDown, Loader2 } from "lucide-react";
import { downloadPdf } from "./pdf-document";
import { downloadWordDoc } from "./word-document";
import FileSaver from "file-saver";
import { createRtfDoc } from "./rtf-document";

interface ExportMenuProps {
  content: string;
  filename: string;
  templateData?: { [key: string]: string | number };
}

export function ExportMenu({
  content,
  filename,
  templateData,
}: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExportPdf = async () => {
    try {
      setIsExporting("pdf");
      await downloadPdf(content, filename, templateData);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportWord = async () => {
    try {
      setIsExporting("word");
      await downloadWordDoc(content, filename, templateData);
    } catch (error) {
      console.error("Error exporting Word:", error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportRtf = async () => {
    try {
      setIsExporting("rtf");
      const rtfContent = createRtfDoc({ content, templateData });
      const blob = new Blob([rtfContent], { type: "text/rtf" });
      FileSaver.saveAs(blob, `${filename}.rtf`);
    } catch (error) {
      console.error("Error exporting RTF:", error);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPdf} disabled={!!isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Download as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportWord} disabled={!!isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Download as Word (.rtf)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportRtf} disabled={!!isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Download as RTF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
