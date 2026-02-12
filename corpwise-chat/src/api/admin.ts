const API_BASE = "http://localhost:8001";

export interface Document {
    _id: string;
    filename: string;
    doc_type: string;
    uploaded_by: string;
    uploaded_at: string;
    status: string;
    chunk_count: number;
    dimensions?: number;
    file_size?: number;
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

export interface SearchResult {
    score: number;
    text: string;
    source: string;
    section: string;
    doc_id: string;
}

export async function debugSearch(companyId: string, query: string): Promise<{ results: SearchResult[] }> {
    const response = await fetch(`${API_BASE}/admin/search_debug`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Company-ID": companyId,
        },
        body: JSON.stringify({ query })
    });

    if (!response.ok) {
        throw new Error("Search failed");
    }

    return response.json();
}


export interface UsageStats {
    documents_count: number;
    max_documents: number;
    queries_this_month: number;
    max_queries: number;
    documents_limit_label: string;
    queries_limit_label: string;
    storage_used_bytes?: number;
    storage_used_formatted?: string;
    active_api_keys?: number;
    max_api_keys?: number;
    team_members?: number;
    max_team_members?: number;
    member_since?: string;
    renews_at?: string;
}

export interface TechSpecs {
    model_name: string;
    vector_dimensions: number;
    analytics_enabled: boolean;
    custom_branding: boolean;
}

export interface SubscriptionDetails {
    company_id: string;
    subscription_tier: string;
    subscription_status: string;
    usage: UsageStats;
    tech_specs?: TechSpecs;
}

export async function getSubscription(companyId: string): Promise<SubscriptionDetails> {
    const response = await fetch(`${API_BASE}/admin/subscription`, {
        headers: {
            "X-Company-ID": companyId,
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch subscription");
    }

    return response.json();
}
