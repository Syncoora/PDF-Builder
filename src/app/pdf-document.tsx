import { Document, Page, Text, View, StyleSheet, Font, pdf } from "@react-pdf/renderer"
import { interpolateVariables } from "./utils"

// Register a web-safe font that's guaranteed to work
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
})

const themes = {
  default: {
    fontSize: 12,
    padding: 30,
    fontColor: "#000000",
    backgroundColor: "#ffffff",
  },
  modern: {
    fontSize: 11,
    padding: 40,
    fontColor: "#1a1a1a",
    backgroundColor: "#f8f9fa",
  },
  minimal: {
    fontSize: 10,
    padding: 20,
    fontColor: "#2d2d2d",
    backgroundColor: "#ffffff",
  },
  professional: {
    fontSize: 12,
    padding: 35,
    fontColor: "#333333",
    backgroundColor: "#ffffff",
  },
}

interface TemplateData {
  [key: string]: string | number
}

interface PDFDocumentProps {
  content: string
  theme?: keyof typeof themes
  meta?: {
    wordCount: number
    charCount: number
  }
  templateData?: TemplateData
}

export function PDFDocument({ content, theme = "default", meta, templateData }: PDFDocumentProps) {
  const selectedTheme = themes[theme]

  // Process content to replace HTML tags and preserve line breaks
  const processContent = (text: string) => {
    return text
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ") // Replace &nbsp; with spaces
      .split("<br>")
      .join("\n") // Preserve line breaks
  }

  // Use the utility function for interpolation and then process HTML
  const processedContent = processContent(interpolateVariables(content, templateData))

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
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.content}>{processedContent}</Text>
        </View>
        {meta && (
          <Text style={styles.metadata}>
            Words: {meta.wordCount} | Characters: {meta.charCount}
          </Text>
        )}
      </Page>
    </Document>
  )
}

// Add the createPDF function export
export async function createPDF(props: PDFDocumentProps): Promise<Blob> {
  try {
    return await pdf(<PDFDocument {...props} />).toBlob()
  } catch (error) {
    console.error("PDF generation error:", error)
    throw new Error("Failed to generate PDF")
  }
}

