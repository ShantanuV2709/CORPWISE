import React, { useEffect, useState } from "react";
import DecryptedText from "./DecryptedText";
import { deleteCompany, getCompanies } from "../api/auth";

// New API functions (we'll need to add these to api/admin.ts or similar, but for now defining inline or assuming they exist)
const API_BASE = "http://localhost:8001";

interface SuperAdminDashboardProps {
    token: string;
    onLogout: () => void;
}

interface Company {
    company_id: string;
    username: string;
    subscription_tier: string;
    subscription_status: string;
    usage: {
        documents_count: number;
        queries_this_month: number;
    };
    created_at: string;
}

interface Statistics {
    total_companies: number;
    active_companies: number;
    total_documents: number;
    total_queries_this_month: number;
    tier_distribution: Record<string, number>;
}

export function SuperAdminDashboard({ token, onLogout }: SuperAdminDashboardProps) {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [editForm, setEditForm] = useState({ tier: "", status: "" });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [companiesData, statsData] = await Promise.all([
                getCompanies(token),
                fetch(`${API_BASE}/super/statistics`, {
                    headers: { "x-super-token": token }
                }).then(res => res.json())
            ]);

            setCompanies(companiesData);
            setStatistics(statsData);
        } catch (err: any) {
            setError(err.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleUpdateCompany = async () => {
        if (!editingCompany) return;

        try {
            // Update Tier
            if (editForm.tier !== editingCompany.subscription_tier) {
                await fetch(`${API_BASE}/super/company/${editingCompany.company_id}/tier`, {
                    method: 'PUT',
                    headers: {
                        "Content-Type": "application/json",
                        "x-super-token": token
                    },
                    body: JSON.stringify({ new_tier: editForm.tier })
                });
            }

            // Update Status
            if (editForm.status !== editingCompany.subscription_status) {
                await fetch(`${API_BASE}/super/company/${editingCompany.company_id}/status`, {
                    method: 'PUT',
                    headers: {
                        "Content-Type": "application/json",
                        "x-super-token": token
                    },
                    body: JSON.stringify({ status: editForm.status })
                });
            }

            setEditingCompany(null);
            fetchData(); // Refresh data
        } catch (err: any) {
            alert("Update failed: " + err.message);
        }
    };

    const handleDelete = async (companyId: string) => {
        if (!window.confirm(`Are you sure you want to DELETE ${companyId}? This cannot be undone.`)) return;

        try {
            await deleteCompany(companyId, token);
            fetchData();
        } catch (err: any) {
            alert("Delete failed: " + err.message);
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'enterprise': return '#a78bfa'; // Purple
            case 'professional': return '#34d399'; // Green
            case 'starter': return '#60a5fa'; // Blue
            default: return '#94a3b8';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#34d399';
            case 'suspended': return '#fbbf24'; // Amber
            case 'cancelled': return '#ef4444'; // Red
            default: return '#94a3b8';
        }
    };

    return (
        <div className="admin-layout-container" style={{ height: '100%', width: '100%', overflowY: 'auto' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 20px' }}>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
                    <div>
                        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: "2.5rem" }}>⚡</span>
                            <DecryptedText text="Super Admin Portal" animateOn="view" speed={100} />
                        </h1>
                        <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>Overview and management of all organizations</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="glass-btn"
                        style={{
                            padding: "10px 24px",
                            background: "rgba(239, 68, 68, 0.15)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#fca5a5",
                            borderRadius: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        Sign Out
                    </button>
                </div>

                {error && (
                    <div style={{ padding: 16, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 12, color: "#ef4444", marginBottom: 24 }}>
                        {error}
                    </div>
                )}

                {/* Statistics Grid */}
                {statistics && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 40 }}>
                        <div className="glass-card" style={{ padding: 24 }}>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>Total Companies</div>
                            <div style={{ fontSize: "2.5rem", fontWeight: 800, margin: "8px 0" }}>{statistics.total_companies}</div>
                            <div style={{ fontSize: "0.85rem", color: "#34d399" }}>{statistics.active_companies} Active</div>
                        </div>
                        <div className="glass-card" style={{ padding: 24 }}>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>Total Documents</div>
                            <div style={{ fontSize: "2.5rem", fontWeight: 800, margin: "8px 0" }}>{statistics.total_documents}</div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Vector Indexed</div>
                        </div>
                        <div className="glass-card" style={{ padding: 24 }}>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>Monthly Queries</div>
                            <div style={{ fontSize: "2.5rem", fontWeight: 800, margin: "8px 0", color: "#60a5fa" }}>{statistics.total_queries_this_month}</div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Across all tenants</div>
                        </div>
                        <div className="glass-card" style={{ padding: 24 }}>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>Revenue Est.</div>
                            <div style={{ fontSize: "2.5rem", fontWeight: 800, margin: "8px 0", color: "#a78bfa" }}>
                                ${statistics.tier_distribution['professional'] * 149 + statistics.tier_distribution['starter'] * 49}
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Monthly Recurring</div>
                        </div>
                    </div>
                )}

                {/* Companies Table */}
                <div className="glass-card" style={{ padding: 32 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Registered Organizations</h3>
                        <button
                            onClick={fetchData}
                            className="glass-btn"
                            style={{
                                padding: "8px 20px",
                                borderRadius: 8,
                                fontSize: "0.9rem",
                                background: "rgba(59, 130, 246, 0.15)",
                                border: "1px solid rgba(59, 130, 246, 0.3)",
                                color: "#93c5fd",
                                fontWeight: 500
                            }}
                        >
                            ↻ Refresh
                        </button>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }} className="admin-table">
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                    <th style={{ textAlign: "left", padding: "16px", color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>Company</th>
                                    <th style={{ textAlign: "left", padding: "16px", color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>Tier</th>
                                    <th style={{ textAlign: "left", padding: "16px", color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>Status</th>
                                    <th style={{ textAlign: "center", padding: "16px", color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>Docs</th>
                                    <th style={{ textAlign: "center", padding: "16px", color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>Queries</th>
                                    <th style={{ textAlign: "right", padding: "16px", color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Loading records...</td></tr>
                                ) : companies.map(company => (
                                    <tr key={company.company_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                        <td style={{ padding: "16px" }}>
                                            <div style={{ fontWeight: 600, color: "white" }}>{company.company_id}</div>
                                            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Admin: {company.username}</div>
                                        </td>
                                        <td style={{ padding: "16px" }}>
                                            <span style={{
                                                padding: "4px 12px",
                                                borderRadius: 99,
                                                background: `${getTierColor(company.subscription_tier)}20`,
                                                color: getTierColor(company.subscription_tier),
                                                border: `1px solid ${getTierColor(company.subscription_tier)}40`,
                                                fontSize: "0.85rem",
                                                fontWeight: 500,
                                                textTransform: "capitalize"
                                            }}>
                                                {company.subscription_tier}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px" }}>
                                            <span style={{
                                                padding: "4px 12px",
                                                borderRadius: 99,
                                                background: `${getStatusColor(company.subscription_status)}20`,
                                                color: getStatusColor(company.subscription_status),
                                                border: `1px solid ${getStatusColor(company.subscription_status)}40`,
                                                fontSize: "0.85rem",
                                                fontWeight: 500,
                                                textTransform: "capitalize"
                                            }}>
                                                {company.subscription_status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px", textAlign: "center", fontFamily: "monospace" }}>
                                            {company.usage?.documents_count || 0}
                                        </td>
                                        <td style={{ padding: "16px", textAlign: "center", fontFamily: "monospace" }}>
                                            {company.usage?.queries_this_month || 0}
                                        </td>
                                        <td style={{ padding: "16px", textAlign: "right" }}>
                                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                                <button
                                                    onClick={() => {
                                                        setEditingCompany(company);
                                                        setEditForm({
                                                            tier: company.subscription_tier,
                                                            status: company.subscription_status
                                                        });
                                                    }}
                                                    className="glass-btn"
                                                    style={{
                                                        padding: "6px 16px",
                                                        borderRadius: 6,
                                                        fontSize: "0.85rem",
                                                        background: "rgba(59, 130, 246, 0.1)",
                                                        border: "1px solid rgba(59, 130, 246, 0.2)",
                                                        color: "#93c5fd"
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(company.company_id)}
                                                    className="glass-btn"
                                                    style={{
                                                        padding: "6px 16px",
                                                        borderRadius: 6,
                                                        fontSize: "0.85rem",
                                                        background: "rgba(239, 68, 68, 0.1)",
                                                        border: "1px solid rgba(239, 68, 68, 0.2)",
                                                        color: "#fca5a5"
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit Modal */}
                {editingCompany && (
                    <div style={{
                        position: "fixed", inset: 0,
                        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)",
                        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
                    }}>
                        <div className="glass-card" style={{ padding: 32, width: "100%", maxWidth: 500 }}>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>Edit Subscription</h3>
                            <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>Managing {editingCompany.company_id}</p>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: "block", marginBottom: 8, fontSize: "0.9rem", color: "var(--text-secondary)" }}>Subscription Tier</label>
                                <select
                                    value={editForm.tier}
                                    onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                                    style={{
                                        width: "100%", padding: 12, borderRadius: 12,
                                        background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                                        color: "white", outline: "none"
                                    }}
                                >
                                    <option value="starter">Starter ($49/mo)</option>
                                    <option value="professional">Professional ($149/mo)</option>
                                    <option value="enterprise">Enterprise (Custom)</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: 32 }}>
                                <label style={{ display: "block", marginBottom: 8, fontSize: "0.9rem", color: "var(--text-secondary)" }}>Account Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    style={{
                                        width: "100%", padding: 12, borderRadius: 12,
                                        background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                                        color: "white", outline: "none"
                                    }}
                                >
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="trial">Trial</option>
                                </select>
                            </div>

                            <div style={{ display: "flex", gap: 12 }}>
                                <button
                                    onClick={() => setEditingCompany(null)}
                                    className="glass-btn"
                                    style={{ flex: 1, padding: 12, borderRadius: 10, fontWeight: 600 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateCompany}
                                    style={{
                                        flex: 2, padding: 12, borderRadius: 10, fontWeight: 600, border: "none",
                                        background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white",
                                        boxShadow: "0 4px 15px rgba(37, 99, 235, 0.4)"
                                    }}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
