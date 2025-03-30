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

// Update the createPDF function to prevent content breaking across pages
export async function createPDF(props: PDFDocumentProps): Promise<Blob> {
  try {
    // Create a temporary container to render the HTML content
    const container = document.createElement("div");
    container.className = `pdf-preview theme-${props.theme || "default"}`;
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.width = "794px"; // A4 width in pixels at 96 DPI
    container.style.padding = "40px";
    container.style.backgroundColor = "white";
    container.style.color = "black";
    container.style.fontFamily = "Roboto, Arial, sans-serif";
    container.style.fontSize = "12px";
    container.style.lineHeight = "1.5";

    // Process variables in content
    const processedContent = props.content.replace(
      /\${(\w+)}/g,
      (match, key) => {
        const value = props.templateData?.[key];
        return value != null ? String(value) : match;
      }
    );

    // Set the HTML content
    container.innerHTML = processedContent;

    // Add specific styles for tables and lists to ensure they render properly
    const style = document.createElement("style");
    style.textContent = `
      /* Table styles */
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 0.5em 0;
        page-break-inside: avoid; /* Prevent tables from breaking across pages */
      }
      
      table th,
      table td {
        border: 2px solid #dddddd;
        padding: 8px;
        text-align: left;
      }
      
      table th {
        background-color: #f1f3f5;
        font-weight: bold;
      }
      
      table tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      
      /* List styles - use custom markers instead of native ones */
      ul, ol {
        padding-left: 0;
        margin: 0.5em 0;
        list-style-type: none;
        page-break-inside: avoid; /* Prevent lists from breaking across pages */
      }
      
      li {
        position: relative;
        padding-left: 1.5em;
        margin-bottom: 0.2em;
      }
      
      /* Prevent paragraphs from breaking across pages */
      p {
        page-break-inside: avoid;
      }
      
      /* Prevent headings from breaking across pages and ensure they're not at the bottom of a page */
      h1, h2, h3, h4, h5, h6 {
        page-break-inside: avoid;
        page-break-after: avoid;
      }
      
      /* Theme-specific styles */
      .theme-modern table th {
        background-color: #e9ecef;
      }
      
      .theme-minimal table th {
        background-color: #f8f9fa;
      }
      
      .theme-professional table th {
        background-color: #e6f0ff;
      }
    `;
    container.appendChild(style);

    // Add the container to the document body
    document.body.appendChild(container);

    // Process any tables to ensure they're properly formatted
    const tables = container.querySelectorAll("table");
    tables.forEach((table) => {
      // Ensure table has proper width
      table.style.width = "100%";
      table.style.tableLayout = "fixed";

      // Add page-break-inside: avoid to prevent tables from breaking across pages
      table.style.pageBreakInside = "avoid";

      // Ensure cells have proper styling
      const cells = table.querySelectorAll("th, td");
      cells.forEach((cell) => {
        // cell.style.border = "2px solid #dddddd";
        // cell.style.padding = "8px";
      });

      // Ensure headers have proper styling
      const headers = table.querySelectorAll("th");
      headers.forEach((header) => {
        header.style.backgroundColor = "#f1f3f5";
        header.style.fontWeight = "bold";
      });
    });

    // Process paragraphs to prevent breaking across pages
    const paragraphs = container.querySelectorAll("p");
    paragraphs.forEach((paragraph) => {
      paragraph.style.pageBreakInside = "avoid";
    });

    // Process headings to prevent breaking across pages
    const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
    headings.forEach((heading) => {
      // heading.style.pageBreakInside = "avoid";
      // heading.style.pageBreakAfter = "avoid";
    });

    // Process lists to add explicit markers and prevent breaking across pages
    const processLists = (listType) => {
      const lists = container.querySelectorAll(listType);
      lists.forEach((list) => {
        // Remove any native list styling
        list.style.listStyleType = "none";
        list.style.paddingLeft = "0";

        // Prevent list from breaking across pages
        list.style.pageBreakInside = "avoid";

        // Process list items
        const items = list.querySelectorAll("li");
        items.forEach((item, index) => {
          // Remove any existing markers
          const existingMarkers = item.querySelectorAll(".list-marker");
          existingMarkers.forEach((marker) => marker.remove());

          // Create a new marker
          const markerSpan = document.createElement("span");
          markerSpan.className = "list-marker";
          markerSpan.style.position = "absolute";
          markerSpan.style.left = "0";
          markerSpan.style.display = "inline-block";
          markerSpan.style.width = "1.5em";
          markerSpan.style.textAlign = "center";

          // Set the marker content based on list type
          if (listType === "ul") {
            markerSpan.textContent = "•";
          } else if (listType === "ol") {
            markerSpan.textContent = `${index + 1}.`;
          }

          // Add the marker to the list item
          item.style.position = "relative";
          item.style.paddingLeft = "1.5em";

          // Insert at the beginning of the list item
          if (item.firstChild) {
            item.insertBefore(markerSpan, item.firstChild);
          } else {
            item.appendChild(markerSpan);
          }
        });
      });
    };

    // Process both unordered and ordered lists
    processLists("ul");
    processLists("ol");

    // Use html2canvas to capture the content
    const canvas = await html2canvas(container, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: "white",
      allowTaint: true,
    });

    // Remove the temporary container
    document.body.removeChild(container);

    // Create a new PDF document
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Calculate the PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add the canvas image to the PDF
    const imgData = canvas.toDataURL("image/png");

    // Handle pagination for longer content
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Metadata has been removed as requested

    // Return the PDF as a blob
    return pdf.output("blob");
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error("Failed to generate PDF");
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
