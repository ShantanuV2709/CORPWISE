const API_BASE = "http://localhost:8001";

export interface Document {
    _id: string;
    filename: string;
    doc_type: string;
    uploaded_by: string;
    uploaded_at: string;
    status: string;
    chunk_count: number;
}

export async function uploadDocument(file: File, docType: string, companyId: string) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
        `${API_BASE}/admin/documents/upload?doc_type=${docType}`,
        {
            method: "POST",
            headers: {
                "X-Company-ID": companyId,
            },
            body: formData,
        }
    );

    if (!response.ok) {
        throw new Error("Upload failed");
    }

    return response.json();
}

export async function listDocuments(companyId: string): Promise<{ documents: Document[] }> {
    const response = await fetch(`${API_BASE}/admin/documents`, {
        headers: {
            "X-Company-ID": companyId,
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch documents");
    }

    return response.json();
}

export async function deleteDocument(docId: string, companyId: string) {
    const response = await fetch(`${API_BASE}/admin/documents/${docId}`, {
        method: "DELETE",
        headers: {
            "X-Company-ID": companyId,
        },
    });

    if (!response.ok) {
        throw new Error("Delete failed");
    }

    return response.json();
}

export interface ApiKey {
    key_id: string;
    name: string;
    prefix: string;
    created_at: string;
    last_used: string | null;
    status: string;
}

export async function listApiKeys(companyId: string): Promise<{ keys: ApiKey[] }> {
    const response = await fetch(`${API_BASE}/api-keys`, {
        headers: {
            "X-Company-ID": companyId,
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch API keys");
    }

    return response.json();
}

export async function generateApiKey(companyId: string, name: string): Promise<{ key: string, key_data: ApiKey }> {
    const response = await fetch(`${API_BASE}/api-keys/generate?name=${encodeURIComponent(name)}`, {
        method: "POST",
        headers: {
            "X-Company-ID": companyId,
        }
    });

    if (!response.ok) {
        throw new Error("Failed to generate API key");
    }

    return response.json();
}

export async function revokeApiKey(companyId: string, keyId: string) {
    const response = await fetch(`${API_BASE}/api-keys/${keyId}`, {
        method: "DELETE",
        headers: {
            "X-Company-ID": companyId,
        }
    });

    if (!response.ok) {
        throw new Error("Failed to revoke API key");
    }

    return response.json();
}
