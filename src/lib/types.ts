export interface SavedDocument {
  id: string
  title: string
  content: string
  meta: {
    wordCount: number
    charCount: number
  }
  createdAt: string
  updatedAt: string
}

export interface TemplateData {
  [key: string]: any
}

