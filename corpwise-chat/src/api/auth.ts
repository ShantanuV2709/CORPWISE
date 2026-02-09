const API_BASE = "http://localhost:8001";

export async function login(username: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Login failed");
    }

    return res.json();
}

export async function signup(username: string, password: string, company_id: string) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, company_id }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Signup failed");
    }

    return res.json();
}

// ==============================
// Admin / Super Admin API
// ==============================

export async function adminLogin(username: string, password: string, company_id: string) {
    const res = await fetch(`${API_BASE}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, company_id }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Admin Login failed");
    }

    return res.json();
}

export async function adminSignup(username: string, password: string, company_id: string, subscription_tier: string = "professional") {
    const res = await fetch(`${API_BASE}/auth/admin/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, company_id, subscription_tier }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Organization Registration failed");
    }

    return res.json();
}

export async function getCompanies(superToken: string) {
    const res = await fetch(`${API_BASE}/super/companies`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "x-super-token": superToken
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to fetch companies");
    }

    return res.json();
}

export async function deleteCompany(companyId: string, superToken: string) {
    const res = await fetch(`${API_BASE}/super/company/${companyId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "x-super-token": superToken
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Delete failed");
    }

    return res.json();
}
