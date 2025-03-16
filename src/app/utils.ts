// Utility function to handle variable interpolation
export function interpolateVariables(text: string, data?: { [key: string]: any }): string {
  if (!data) return text

  return text.replace(/\${(\w+)}/g, (match, key) => {
    if (!(key in data)) return match
    const value = data[key]
    return value != null ? String(value) : match
  })
}

// Helper function to process HTML content with variables
export function processHTMLContent(html: string, data?: { [key: string]: any }): string {
  if (!data) return html

  // Process text nodes only, preserve HTML tags
  return html.replace(/>(.*?)</g, (match, text) => {
    const processed = interpolateVariables(text, data)
    return `>${processed}<`
  })
}

