const API_BASE = "http://localhost:8000";

export interface Document {
    _id: string;
    filename: string;
    doc_type: string;
    uploaded_by: string;
    uploaded_at: string;
    status: string;
    chunk_count: number;
}

export async function uploadDocument(file: File, docType: string) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
        `${API_BASE}/admin/documents/upload?doc_type=${docType}`,
        {
            method: "POST",
            body: formData,
        }
    );

    if (!response.ok) {
        throw new Error("Upload failed");
    }

    return response.json();
}

export async function listDocuments(): Promise<{ documents: Document[] }> {
    const response = await fetch(`${API_BASE}/admin/documents`);

    if (!response.ok) {
        throw new Error("Failed to fetch documents");
    }

    return response.json();
}

export async function deleteDocument(docId: string) {
    const response = await fetch(`${API_BASE}/admin/documents/${docId}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error("Delete failed");
    }

    return response.json();
}
