"use client";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface TemplateData {
  [key: string]: string | number;
}

interface PDFDocumentProps {
  content: string;
  theme?: string;
  meta?: {
    wordCount: number;
    charCount: number;
  };
  templateData?: TemplateData;
}

// Update the createPDF function to ensure table styles match the editor
export async function createPDF(props: PDFDocumentProps): Promise<Blob> {
  try {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.width = "794px";
    container.style.padding = "40px";
    container.style.backgroundColor = "white";
    container.style.color = "black";
    container.style.fontFamily = "Roboto, Arial, sans-serif";
    container.style.fontSize = "12px";
    container.style.lineHeight = "1.5";

    const style = document.createElement("style");
    style.textContent = `
      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        margin: 0.5em 0;
      }
      table, th, td {
        border: 2px solid #ddd;
      }
      th, td {
        padding: 8px;
        text-align: left;
        vertical-align: top;
        word-break: break-word;
      }
      th {
        background-color: #f1f3f5;
        font-weight: bold;
      }
      /* Ensure empty paragraphs have height */
      p:empty {
        min-height: 1em;
        line-height: 1.5;
        margin: 0.5em 0;
      }
      /* Preserve whitespace */
      p {
        white-space: pre-wrap;
      }
      /* Ensure line breaks are visible */
      br {
        display: block;
        content: "";
        margin-top: 1em;
      }
    `;

    container.appendChild(style);

    // Process variables in content
    const processedContent = props.content.replace(/\${(\w+)}/g, (_, key) => {
      return props.templateData?.[key]?.toString() || "";
    });

    // Ensure empty paragraphs are preserved
    const preservedContent = processedContent
      .replace(/<p>\s*<\/p>/g, '<p class="empty-paragraph">&nbsp;</p>')
      .replace(/<div>\s*<\/div>/g, '<div class="empty-div">&nbsp;</div>')
      .replace(/<br>/g, '<br class="preserved-break">');

    container.innerHTML += preservedContent;

    // Important: Add to document immediately to ensure DOM elements exist for html2canvas
    document.body.appendChild(container);

    // Allow brief time for browser to process DOM changes
    await new Promise((resolve) => setTimeout(resolve, 100));

    const pdf = new jsPDF("p", "mm", "a4");
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();

    let currentPage = 1;
    let offsetY = 10;

    // Configure html2canvas to avoid iframe issues
    const canvasOptions = {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      allowTaint: true,
      ignoreElements: (element: Element) => element.tagName === "IFRAME",
    };

    const elements = Array.from(container.children) as HTMLElement[];

    for (const element of elements) {
      if (element.tagName === "TABLE") {
        const tableClone = element.cloneNode(true) as HTMLElement;
        container.appendChild(tableClone);

        const rows = Array.from(tableClone.querySelectorAll("tr"));
        const header = tableClone.querySelector("thead")?.outerHTML || "";
        let chunkTable = document.createElement("table");
        chunkTable.innerHTML = header;
        container.appendChild(chunkTable);

        for (const row of rows) {
          chunkTable.appendChild(row.cloneNode(true));

          // Apply the canvas options to avoid iframe issues
          const canvas = await html2canvas(chunkTable, canvasOptions);
          const imgHeight = (canvas.height * (pageWidth - 20)) / canvas.width;

          if (offsetY + imgHeight > pageHeight - 20) {
            chunkTable.removeChild(chunkTable.lastChild!);

            // Apply the canvas options to avoid iframe issues
            const finalCanvas = await html2canvas(chunkTable, canvasOptions);
            const finalImgHeight =
              (finalCanvas.height * (pageWidth - 20)) / finalCanvas.width;

            pdf.addImage(
              finalCanvas,
              "PNG",
              10,
              offsetY,
              pageWidth - 20,
              finalImgHeight
            );
            pdf.setFontSize(10);
            pdf.text(`${currentPage}`, pageWidth / 2, pageHeight - 10, {
              align: "center",
            });
            pdf.addPage();
            currentPage++;
            offsetY = 10;

            chunkTable = document.createElement("table");
            chunkTable.innerHTML = header;
            chunkTable.appendChild(row.cloneNode(true));
            container.appendChild(chunkTable);
          }
        }

        // Apply the canvas options to avoid iframe issues
        const finalCanvas = await html2canvas(chunkTable, canvasOptions);
        const finalImgHeight =
          (finalCanvas.height * (pageWidth - 20)) / finalCanvas.width;

        pdf.addImage(
          finalCanvas,
          "PNG",
          10,
          offsetY,
          pageWidth - 20,
          finalImgHeight
        );
        offsetY += finalImgHeight;

        container.removeChild(tableClone);
        container.removeChild(chunkTable);
      } else if (element.offsetHeight > 0 && element.offsetWidth > 0) {
        // Apply the canvas options to avoid iframe issues
        const canvas = await html2canvas(element, canvasOptions);
        const imgHeight = (canvas.height * (pageWidth - 20)) / canvas.width;

        if (offsetY + imgHeight > pageHeight - 20) {
          pdf.setFontSize(10);
          pdf.text(`${currentPage}`, pageWidth / 2, pageHeight - 10, {
            align: "center",
          });
          pdf.addPage();
          currentPage++;
          offsetY = 10;
        }

        pdf.addImage(canvas, "PNG", 10, offsetY, pageWidth - 20, imgHeight);
        offsetY += imgHeight;
      }
    }

    pdf.setFontSize(10);
    pdf.text(`${currentPage}`, pageWidth / 2, pageHeight - 10, {
      align: "center",
    });

    document.body.removeChild(container);

    return pdf.output("blob");
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error("Failed to generate PDF: " + error.message);
  }
}

// This component is just a placeholder for the PDF document
export function PDFDocument({
  content,
  theme = "default",
  meta,
  templateData,
}: PDFDocumentProps) {
  return null;
}

export async function downloadPdf(
  content: string,
  filename: string,
  templateData?: TemplateData
): Promise<void> {
  try {
    const blob = await createPDF({ content, templateData });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw error;
  }
}
