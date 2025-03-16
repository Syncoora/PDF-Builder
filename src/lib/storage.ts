import type { SavedDocument } from "./types";

const STORAGE_KEY = "saved_documents";

export function getSavedDocuments(): SavedDocument[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function saveDocument(
  doc: Omit<SavedDocument, "id" | "createdAt" | "updatedAt">
): SavedDocument {
  const documents = getSavedDocuments();
  const newDoc: SavedDocument = {
    ...doc,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  documents.push(newDoc);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  return newDoc;
}

export function updateDocument(
  id: string,
  updates: Partial<SavedDocument>
): SavedDocument {
  const documents = getSavedDocuments();
  const index = documents.findIndex((doc) => doc.id === id);

  if (index === -1) throw new Error("Document not found");

  const updatedDoc = {
    ...documents[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  documents[index] = updatedDoc;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  return updatedDoc;
}

export function deleteDocument(id: string): void {
  const documents = getSavedDocuments();
  const filtered = documents.filter((doc) => doc.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
