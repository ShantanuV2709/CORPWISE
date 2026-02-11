/**
 * Subscription API Client
 * Fetch subscription tier information from backend
 */

const API_BASE = "http://localhost:8001";

export interface SubscriptionTier {
    name: string;
    description: string;
    max_documents: number;
    max_queries_per_month: number;
    max_employees: number;
    analytics_enabled: boolean;
    custom_branding: boolean;
    priority_support: boolean;
    price_monthly: number | null;
    price_display: string;
}

export interface TierResponse {
    tiers: Record<string, SubscriptionTier>;
}

export async function fetchSubscriptionTiers(): Promise<TierResponse> {
    const response = await fetch(`${API_BASE}/subscription/tiers`);

    if (!response.ok) {
        throw new Error("Failed to fetch subscription tiers");
    }

    return response.json();
}

export async function updateSubscriptionTier(tierId: string, companyId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/subscription/update-tier`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-Company-ID": companyId
        },
        body: JSON.stringify({
            company_id: companyId,
            new_tier: tierId
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to update subscription tier");
    }

    return response.json();
}
