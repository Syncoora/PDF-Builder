"use client";

interface TemplateData {
  [key: string]: string | number;
}

interface RtfDocumentProps {
  content: string;
  templateData?: TemplateData;
}

// Replace the htmlToRtf function with this improved version
function htmlToRtf(html: string): string {
  // Basic RTF header
  let rtf = "{\\rtf1\\ansi\\ansicpg1252\\cocoartf2580\\cocoasubrtf220\n";
  rtf += "{\\fonttbl\\f0\\fswiss\\fcharset0 Helvetica;}\n";
  rtf += "{\\colortbl;\\red255\\green255\\blue255;}\n";
  rtf += "\\margl1440\\margr1440\\vieww11520\\viewh8400\\viewkind0\n";
  rtf +=
    "\\pard\\tx720\\tx1440\\tx2160\\tx2880\\tx3600\\tx4320\\tx5040\\tx5760\\tx6480\\tx7200\\tx7920\\tx8640\\pardirnatural\\partightenfactor0\n\n";
  rtf += "\\f0\\fs24 \\cf0 ";

  // More aggressive preservation of empty paragraphs
  // First, mark all empty paragraphs with a special class
  let preservedHtml = html.replace(
    /<p>\s*<\/p>/g,
    '<p class="empty-paragraph">&nbsp;</p>'
  );

  // Replace all br tags with a special marker
  preservedHtml = preservedHtml.replace(
    /<br\s*\/?>/g,
    '<span class="rtf-linebreak"></span>'
  );

  // Simple HTML to RTF conversion with special handling for empty paragraphs
  let text = "";

  // Split by paragraphs to handle them individually
  const paragraphs = preservedHtml.split(/<\/?p[^>]*>/);

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    if (para) {
      // Handle special empty paragraph marker
      if (para.includes('class="empty-paragraph"')) {
        text += "\\par\\par "; // Double paragraph break for empty lines
      }
      // Handle normal paragraph content
      else {
        // Process the paragraph content
        const processedPara = para
          .replace(/<strong>(.*?)<\/strong>/g, "{\\b $1}")
          .replace(/<em>(.*?)<\/em>/g, "{\\i $1}")
          .replace(/<u>(.*?)<\/u>/g, "{\\ul $1}")
          .replace(/<span class="rtf-linebreak"><\/span>/g, "\\line ")
          .replace(/<.*?>/g, ""); // Remove any remaining HTML tags

        if (processedPara.trim()) {
          text += processedPara + "\\par ";
        }
      }
    } else if (i > 0 && i < paragraphs.length - 1) {
      // Empty paragraph that's not at the beginning or end
      text += "\\par\\par "; // Double paragraph break for empty lines
    }
  }

  // Add the text to the RTF
  rtf += text;

  // Close the RTF document
  rtf += "}";

  return rtf;
}

export function createRtfDoc(props: RtfDocumentProps): string {
  try {
    // Process variables in content
    const processedContent = props.content.replace(
      /\${(\w+)}/g,
      (match, key) => {
        const value = props.templateData?.[key];
        return value != null ? String(value) : match;
      }
    );

    // Convert HTML to RTF
    return htmlToRtf(processedContent);
  } catch (error) {
    console.error("RTF document generation error:", error);
    throw new Error("Failed to generate RTF document");
  }
}

// This component is just a placeholder for the RTF document
export function RtfDocument({ content, templateData }: RtfDocumentProps) {
  return null;
}
