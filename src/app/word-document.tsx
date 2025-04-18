"use client";
import FileSaver from "file-saver";

interface TemplateData {
  [key: string]: string | number;
}

interface WordDocumentProps {
  content: string;
  templateData?: TemplateData;
}

// Process variables in content
function processVariables(
  content: string,
  templateData?: TemplateData
): string {
  if (!templateData) return content;

  return content.replace(/\${(\w+)}/g, (match, key) => {
    const value = templateData[key];
    return value != null ? String(value) : match;
  });
}

/**
 * Creates a Word document from HTML content
 * This implementation uses a DOM-based approach to ensure proper formatting
 */
export async function createWordDoc(props: WordDocumentProps): Promise<Blob> {
  try {
    // Process variables in content
    const processedContent = processVariables(
      props.content,
      props.templateData
    );

    // Create a DOM parser to work with the HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(processedContent, "text/html");

    // Process the document to ensure empty paragraphs are preserved
    preserveEmptyParagraphs(doc);

    // Create Word-specific HTML
    const wordHtml = generateWordCompatibleHtml(doc);

    // Create a blob with the Word HTML content
    const blob = new Blob([wordHtml], {
      type: "application/msword",
    });

    return blob;
  } catch (error) {
    console.error("Document generation error:", error);
    throw new Error(
      "Failed to generate document: " +
        (error instanceof Error ? error.message : String(error))
    );
  }
}

/**
 * Processes the DOM to ensure empty paragraphs are preserved
 */
function preserveEmptyParagraphs(doc: Document): void {
  // Find all paragraphs
  const paragraphs = doc.querySelectorAll("p");

  // Process each paragraph
  paragraphs.forEach((p) => {
    // If paragraph is empty or only contains whitespace
    if (!p.textContent?.trim()) {
      // Add a non-breaking space to ensure it's preserved
      p.innerHTML = "&nbsp;";
      // Add a special class to identify it
      p.classList.add("empty-paragraph");
    }
  });

  // Find all divs that might be acting as paragraphs
  const divs = doc.querySelectorAll("div");
  divs.forEach((div) => {
    if (!div.textContent?.trim()) {
      div.innerHTML = "&nbsp;";
      div.classList.add("empty-paragraph");
    }
  });

  // Process br tags to ensure they're preserved
  const brs = doc.querySelectorAll("br");
  brs.forEach((br) => {
    br.setAttribute("style", "mso-data-placement:same-cell");
  });
}

/**
 * Generates Word-compatible HTML with proper styling
 */
function generateWordCompatibleHtml(doc: Document): string {
  // Extract the processed body content
  const bodyContent = doc.body.innerHTML;

  // Create a complete Word-compatible HTML document
  return `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word 15">
  <meta name="Originator" content="Microsoft Word 15">
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:TrackMoves>false</w:TrackMoves>
      <w:TrackFormatting/>
      <w:PunctuationKerning/>
      <w:ValidateAgainstSchemas/>
      <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
      <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
      <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
      <w:DoNotPromoteQF/>
      <w:LidThemeOther>EN-US</w:LidThemeOther>
      <w:LidThemeAsian>X-NONE</w:LidThemeAsian>
      <w:LidThemeComplexScript>X-NONE</w:LidThemeComplexScript>
      <w:Compatibility>
        <w:BreakWrappedTables/>
        <w:SnapToGridInCell/>
        <w:WrapTextWithPunct/>
        <w:UseAsianBreakRules/>
        <w:DontGrowAutofit/>
        <w:SplitPgBreakAndParaMark/>
        <w:EnableOpenTypeKerning/>
        <w:DontFlipMirrorIndents/>
        <w:OverrideTableStyleHps/>
      </w:Compatibility>
      <w:DoNotOptimizeForBrowser/>
      <m:mathPr>
        <m:mathFont m:val="Cambria Math"/>
        <m:brkBin m:val="before"/>
        <m:brkBinSub m:val="&#45;-"/>
        <m:smallFrac m:val="off"/>
        <m:dispDef/>
        <m:lMargin m:val="0"/>
        <m:rMargin m:val="0"/>
        <m:defJc m:val="centerGroup"/>
        <m:wrapIndent m:val="1440"/>
        <m:intLim m:val="subSup"/>
        <m:naryLim m:val="undOvr"/>
      </m:mathPr>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    /* Basic styling */
    body {
      font-family: 'Calibri', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
    }
    
    /* Table styling */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 10px 0;
    }
    table, th, td {
      border: 1px solid black;
      padding: 8px;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    
    /* Paragraph styling */
    p {
      margin-top: 0;
      margin-bottom: 0;
      line-height: 1.5;
      min-height: 1em;
    }
    
    /* Empty paragraph styling */
    p.empty-paragraph {
      mso-line-height-rule: exactly;
      line-height: 1.5;
      margin-top: 0;
      margin-bottom: 0;
    }
    
    /* Word-specific styling */
    .MsoNormal {
      mso-style-unhide: no;
      mso-style-qformat: yes;
      mso-style-parent: "";
      margin: 0in;
      margin-bottom: .0001pt;
      mso-pagination: widow-orphan;
      font-size: 11.0pt;
      font-family: "Calibri", sans-serif;
      mso-ascii-font-family: Calibri;
      mso-ascii-theme-font: minor-latin;
      mso-fareast-font-family: "Times New Roman";
      mso-fareast-theme-font: minor-fareast;
      mso-hansi-font-family: Calibri;
      mso-hansi-theme-font: minor-latin;
      mso-bidi-font-family: "Times New Roman";
      mso-bidi-theme-font: minor-bidi;
    }
    
    /* Alignment classes */
    .text-align-center {
      text-align: center;
    }
    .text-align-right {
      text-align: right;
    }
    .text-align-left {
      text-align: left;
    }
    
    /* List styling */
    ul, ol {
      margin-top: 0;
      margin-bottom: 0;
      padding-left: 2em;
    }
    
    /* Heading styling */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 12pt;
      margin-bottom: 6pt;
      font-weight: bold;
    }
    h1 { font-size: 16pt; }
    h2 { font-size: 14pt; }
    h3 { font-size: 13pt; }
    h4 { font-size: 12pt; }
    h5 { font-size: 11pt; }
    h6 { font-size: 10pt; }
    
    /* Ensure line breaks are preserved */
    br {
      mso-data-placement: same-cell;
    }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>
  `.trim();
}

/**
 * Downloads the content as a Word document
 */
export function downloadWordDoc(
  content: string,
  filename: string,
  templateData?: TemplateData
): Promise<void> {
  return createWordDoc({ content, templateData })
    .then((blob) => {
      // Save as .doc for better compatibility
      FileSaver.saveAs(blob, `${filename}.doc`);
    })
    .catch((error) => {
      console.error("Error downloading document:", error);
      throw error;
    });
}

// This component is just a placeholder for the Word document
export function WordDocument({ content, templateData }: WordDocumentProps) {
  return null;
}
