import type { SavedDocument } from "./types";
import monday from "./monday-sdk";
import { getStorageKey } from "./monday-sdk";

export async function getSavedDocuments(): Promise<SavedDocument[]> {
  try {
    const storageKey = getStorageKey();
    console.log(`storageKey: ${storageKey}`);

    const result = await monday.storage.instance.getItem(storageKey);
    return result.data?.value ? JSON.parse(result.data.value) : [];
  } catch (error) {
    console.error("Error fetching documents from Monday:", error);
    return [];
  }
}

export async function saveDocument(
  doc: Omit<SavedDocument, "id" | "createdAt" | "updatedAt">
): Promise<SavedDocument> {
  try {
    // Get existing documents
    const documents = await getSavedDocuments();

    // Create new document with ID and timestamps
    const newDoc: SavedDocument = {
      ...doc,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to documents array
    documents.push(newDoc);

    // Save to Monday storage with the appropriate key
    const storageKey = getStorageKey();
    await monday.storage.instance.setItem(
      storageKey,
      JSON.stringify(documents)
    );

    return newDoc;
  } catch (error) {
    console.error("Error saving document to Monday:", error);
    throw new Error("Failed to save document");
  }
}

export async function updateDocument(
  id: string,
  updates: Partial<SavedDocument>
): Promise<SavedDocument> {
  try {
    // Get existing documents
    const documents = await getSavedDocuments();
    const index = documents.findIndex((doc) => doc.id === id);

    if (index === -1) throw new Error("Document not found");

    // Update the document
    const updatedDoc = {
      ...documents[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    documents[index] = updatedDoc;

    // Save to Monday storage with the appropriate key
    const storageKey = getStorageKey();
    await monday.storage.instance.setItem(
      storageKey,
      JSON.stringify(documents)
    );

    return updatedDoc;
  } catch (error) {
    console.error("Error updating document in Monday:", error);
    throw new Error("Failed to update document");
  }
}

export async function deleteDocument(id: string): Promise<void> {
  try {
    // Get existing documents
    const documents = await getSavedDocuments();
    const filtered = documents.filter((doc) => doc.id !== id);

    // Save filtered list to Monday storage with the appropriate key
    const storageKey = getStorageKey();
    await monday.storage.instance.setItem(storageKey, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting document from Monday:", error);
    throw new Error("Failed to delete document");
  }
}
