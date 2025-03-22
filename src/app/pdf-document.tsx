"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";
import { interpolateVariables } from "./utils";
import { useEffect, useState } from "react";

// Make sure Roboto font is loaded
const RobotoFontLoader = () => {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    if (!fontLoaded) {
      // Add Roboto font to the document if it doesn't exist
      if (!document.getElementById("roboto-font")) {
        const link = document.createElement("link");
        link.id = "roboto-font";
        link.rel = "stylesheet";
        link.href =
          "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap";
        document.head.appendChild(link);
        setFontLoaded(true);
      }
    }
  }, [fontLoaded]);

  return null;
};

// Update the Font registration to use the same font as the preview
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
      fontWeight: 300,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
      fontWeight: 500,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
  ],
});

const themes = {
  default: {
    fontSize: 12,
    padding: 30,
    fontColor: "#000000",
    backgroundColor: "#ffffff",
    tableHeaderBg: "#f1f3f5",
    tableBorderColor: "#dddddd",
  },
  modern: {
    fontSize: 11,
    padding: 40,
    fontColor: "#1a1a1a",
    backgroundColor: "#f8f9fa",
    tableHeaderBg: "#e9ecef",
    tableBorderColor: "#dee2e6",
  },
  minimal: {
    fontSize: 10,
    padding: 20,
    fontColor: "#2d2d2d",
    backgroundColor: "#ffffff",
    tableHeaderBg: "#f8f9fa",
    tableBorderColor: "#eaeaea",
  },
  professional: {
    fontSize: 12,
    padding: 35,
    fontColor: "#333333",
    backgroundColor: "#ffffff",
    tableHeaderBg: "#e6f0ff",
    tableBorderColor: "#c8d6e5",
  },
};

interface TemplateData {
  [key: string]: string | number;
}

interface PDFDocumentProps {
  content: string;
  theme?: keyof typeof themes;
  meta?: {
    wordCount: number;
    charCount: number;
  };
  templateData?: TemplateData;
}

// Helper function to extract tables from HTML content
function extractTables(html: string): {
  tables: any[];
  contentWithoutTables: string;
} {
  const tables: any[] = [];

  // Replace table tags with placeholders and collect table data
  const contentWithoutTables = html.replace(
    /<table[^>]*>([\s\S]*?)<\/table>/gi,
    (match, tableContent) => {
      // Extract rows
      const rows: any[] = [];
      const rowMatches = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);

      if (rowMatches) {
        rowMatches.forEach((rowMatch) => {
          const cells: any[] = [];
          // Extract cells (th or td)
          const cellMatches = rowMatch.match(
            /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi
          );

          if (cellMatches) {
            cellMatches.forEach((cellMatch) => {
              // Extract cell content without HTML tags
              const cellContent = cellMatch.replace(/<[^>]*>/g, "").trim();
              const isHeader = cellMatch.startsWith("<th");
              cells.push({ content: cellContent, isHeader });
            });
          }

          rows.push(cells);
        });
      }

      tables.push(rows);
      return `[TABLE_${tables.length - 1}]`; // Replace with placeholder
    }
  );

  return { tables, contentWithoutTables };
}

// Modify the processContent function to better capture text alignment
const processContent = (text: string) => {
  // Extract alignment information before removing HTML tags
  const alignmentMap: { [key: string]: string } = {};
  let counter = 0;

  // Replace paragraphs and headings with alignment placeholders
  const textWithPlaceholders = text
    // Handle style-based alignment
    .replace(
      /<(p|h[1-6]|div)[^>]*style="[^"]*text-align:\s*([^;"\s]+)[^"]*"[^>]*>(.*?)<\/\1>/gi,
      (match, tag, align, content) => {
        const id = `ALIGN_${counter++}`;
        alignmentMap[id] = align;
        return `${id}${content}${id}\n\n`;
      }
    )
    // Handle class-based alignment from TipTap (text-align-center, text-align-right, etc.)
    .replace(
      /<(p|h[1-6]|div)[^>]*class="[^"]*text-align-([^"\s]+)[^"]*"[^>]*>(.*?)<\/\1>/gi,
      (match, tag, align, content) => {
        const id = `ALIGN_${counter++}`;
        alignmentMap[id] = align;
        return `${id}${content}${id}\n\n`;
      }
    )
    // Handle HTML align attribute (older style)
    .replace(
      /<(p|h[1-6]|div)[^>]*align="([^"]+)"[^>]*>(.*?)<\/\1>/gi,
      (match, tag, align, content) => {
        const id = `ALIGN_${counter++}`;
        alignmentMap[id] = align;
        return `${id}${content}${id}\n\n`;
      }
    );

  // Process the content as before
  const processedText = textWithPlaceholders
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "$1\n\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n")
    .replace(/<[^>]*>/g, "") // Remove remaining HTML tags
    .replace(/&nbsp;/g, " ") // Replace &nbsp; with spaces
    .replace(/\n\s*\n\s*\n/g, "\n\n") // Normalize multiple line breaks
    .trim();

  // Return both the processed text and alignment information
  return { processedText, alignmentMap };
};

// Update the PDFDocument component to handle text alignment
export function PDFDocument({
  content,
  theme = "default",
  meta,
  templateData,
}: PDFDocumentProps) {
  const selectedTheme = themes[theme];

  // Extract tables and get content without tables
  const { tables, contentWithoutTables } = extractTables(content);

  // Process variables in content
  const contentWithVars = interpolateVariables(
    contentWithoutTables,
    templateData
  );

  // Process HTML to plain text and get alignment information
  const { processedText, alignmentMap } = processContent(contentWithVars);

  // Split content by table placeholders
  const contentParts = processedText.split(/\[TABLE_(\d+)\]/);

  const styles = StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: selectedTheme.backgroundColor,
      padding: selectedTheme.padding,
      fontFamily: "Roboto",
      fontSize: selectedTheme.fontSize,
      color: selectedTheme.fontColor,
    },
    section: {
      margin: 10,
      padding: 10,
      flexGrow: 1,
    },
    content: {
      marginBottom: 10,
      lineHeight: 1.5,
    },
    contentLeft: {
      marginBottom: 10,
      lineHeight: 1.5,
      textAlign: "left",
    },
    contentCenter: {
      marginBottom: 10,
      lineHeight: 1.5,
      textAlign: "center",
    },
    contentRight: {
      marginBottom: 10,
      lineHeight: 1.5,
      textAlign: "right",
    },
    metadata: {
      position: "absolute",
      bottom: 30,
      left: 30,
      right: 30,
      fontSize: 8,
      color: "#666666",
      borderTopWidth: 1,
      borderTopColor: "#e5e5e5",
      borderTopStyle: "solid",
      paddingTop: 10,
    },
    table: {
      display: "flex",
      width: "auto",
      borderStyle: "solid",
      borderWidth: 1,
      borderColor: selectedTheme.tableBorderColor,
      marginVertical: 10,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: selectedTheme.tableBorderColor,
      borderBottomStyle: "solid",
      minHeight: 24,
      flexGrow: 1,
    },
    tableHeaderRow: {
      backgroundColor: selectedTheme.tableHeaderBg,
    },
    tableCell: {
      padding: 5,
      borderRightWidth: 1,
      borderRightColor: selectedTheme.tableBorderColor,
      borderRightStyle: "solid",
      flex: 1,
    },
    tableHeaderCell: {
      fontWeight: "bold",
    },
    lastCell: {
      borderRightWidth: 0,
    },
    lastRow: {
      borderBottomWidth: 0,
    },
  });

  // Update the processTextWithAlignment function to better handle alignment
  const processTextWithAlignment = (
    text: string,
    alignmentMap: { [key: string]: string }
  ) => {
    // Split by alignment markers
    const parts = text.split(/ALIGN_\d+/);
    const alignmentMarkers = text.match(/ALIGN_\d+/g) || [];

    if (parts.length <= 1) {
      return <Text style={styles.content}>{text}</Text>;
    }

    const elements = [];
    let currentIndex = 0;

    for (let i = 0; i < parts.length; i++) {
      if (parts[i]) {
        if (i === 0) {
          // First part without alignment
          elements.push(
            <Text key={`text-${i}`} style={styles.content}>
              {parts[i]}
            </Text>
          );
        } else if (i === parts.length - 1) {
          // Last part without alignment
          if (parts[i].trim()) {
            elements.push(
              <Text key={`text-${i}`} style={styles.content}>
                {parts[i]}
              </Text>
            );
          }
        } else {
          // Content with alignment
          const alignMarker = alignmentMarkers[Math.floor(currentIndex / 2)];
          const alignValue = alignmentMap[alignMarker];
          let styleToUse = styles.content;

          if (alignValue === "center") {
            styleToUse = styles.contentCenter;
          } else if (alignValue === "right") {
            styleToUse = styles.contentRight;
          } else if (alignValue === "left") {
            styleToUse = styles.contentLeft;
          }

          if (parts[i].trim()) {
            elements.push(
              <Text key={`text-${i}`} style={styleToUse}>
                {parts[i]}
              </Text>
            );
          }

          currentIndex++;
        }
      }
    }

    return elements;
  };

  // Update the renderContent function to pass alignmentMap to processTextWithAlignment
  const renderContent = () => {
    const elements = [];

    // First part of content (before first table)
    if (contentParts.length > 0) {
      elements.push(
        <View key="content-0">
          {processTextWithAlignment(contentParts[0], alignmentMap)}
        </View>
      );
    }

    // Render tables and content parts
    for (let i = 1; i < contentParts.length; i += 2) {
      if (i < contentParts.length - 1) {
        const tableIndex = Number.parseInt(contentParts[i], 10);
        const table = tables[tableIndex];

        if (table && table.length > 0) {
          // Render table
          elements.push(
            <View key={`table-${tableIndex}`} style={styles.table}>
              {table.map((row, rowIndex) => (
                <View
                  key={`row-${rowIndex}`}
                  style={[
                    styles.tableRow,
                    rowIndex === 0 && row.some((cell) => cell.isHeader)
                      ? styles.tableHeaderRow
                      : null,
                    rowIndex === table.length - 1 ? styles.lastRow : null,
                  ]}
                >
                  {row.map((cell, cellIndex) => (
                    <Text
                      key={`cell-${rowIndex}-${cellIndex}`}
                      style={[
                        styles.tableCell,
                        cell.isHeader ? styles.tableHeaderCell : null,
                        cellIndex === row.length - 1 ? styles.lastCell : null,
                      ]}
                    >
                      {cell.content}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          );
        }

        // Add content after table
        elements.push(
          <View key={`content-${i + 1}`}>
            {processTextWithAlignment(contentParts[i + 1], alignmentMap)}
          </View>
        );
      }
    }

    return elements;
  };

  return (
    <Document>
      <RobotoFontLoader />
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>{renderContent()}</View>
        {meta && (
          <Text style={styles.metadata}>
            Words: {meta.wordCount} | Characters: {meta.charCount}
          </Text>
        )}
      </Page>
    </Document>
  );
}

// Add the createPDF function export
export async function createPDF(props: PDFDocumentProps): Promise<Blob> {
  try {
    return await pdf(<PDFDocument {...props} />).toBlob();
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error("Failed to generate PDF");
  }
}
