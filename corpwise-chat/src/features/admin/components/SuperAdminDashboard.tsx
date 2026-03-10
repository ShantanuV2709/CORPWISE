import React, { useEffect, useState } from "react";
import DecryptedText from "../../../components/DecryptedText";
import { RefreshCw, Users, FileText, Key, Activity, ArrowLeft, Settings } from "lucide-react";
import {
    deleteCompany,
    getCompanies,
    getCompanyUsers,
    getCompanyDocuments,
    getCompanyApiKeys,
    getCompanyMetrics
} from "../../auth/api/auth";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

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

    // Master-Detail State
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "users" | "documents" | "apikeys">("overview");
    const [isEditingTier, setIsEditingTier] = useState(false);
    const [editForm, setEditForm] = useState({ tier: "", status: "" });

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    // Detail Data States
    const [companyDocs, setCompanyDocs] = useState<any[]>([]);
    const [companyUsers, setCompanyUsers] = useState<any[]>([]);
    const [companyKeys, setCompanyKeys] = useState<any[]>([]);
    const [companyMetrics, setCompanyMetrics] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [companiesData, statsData] = await Promise.all([
                getCompanies(token),
                fetch(`${API_BASE}/super/statistics`, {
                    headers: { "Authorization": `Bearer ${token}` }
                }).then(res => res.json())
            ]);

            setCompanies(companiesData);
            setStatistics(statsData);

            // If a company is already selected, update its reference to the fresh data
            if (selectedCompany) {
                const updatedTarget = companiesData.find((c: Company) => c.company_id === selectedCompany.company_id);
                if (updatedTarget) setSelectedCompany(updatedTarget);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanyDetails = async (companyId: string) => {
        setLoadingDetails(true);
        try {
            const [users, docs, keys, metrics] = await Promise.all([
                getCompanyUsers(companyId, token),
                getCompanyDocuments(companyId, token),
                getCompanyApiKeys(companyId, token),
                getCompanyMetrics(companyId, token, 30) // Get 30 days of metrics
            ]);
            setCompanyUsers(users);
            setCompanyDocs(docs);
            setCompanyKeys(keys);
            setCompanyMetrics(metrics);
        } catch (err: any) {
            console.error("Failed to fetch drill-down data:", err);
            alert("Failed to fetch detailed data for this company.");
        } finally {
            setLoadingDetails(false);
        }
    };

    useEffect(() => {
        if (selectedCompany) {
            fetchCompanyDetails(selectedCompany.company_id);
            setEditForm({
                tier: selectedCompany.subscription_tier,
                status: selectedCompany.subscription_status
            });
        }
    }, [selectedCompany, token]);

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleUpdateCompany = async () => {
        if (!selectedCompany) return;

        try {
            // Update Tier
            if (editForm.tier !== selectedCompany.subscription_tier) {
                await fetch(`${API_BASE}/super/company/${selectedCompany.company_id}/tier`, {
                    method: 'PUT',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ new_tier: editForm.tier })
                });
            }

            // Update Status
            if (editForm.status !== selectedCompany.subscription_status) {
                await fetch(`${API_BASE}/super/company/${selectedCompany.company_id}/status`, {
                    method: 'PUT',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: editForm.status })
                });
            }

            setIsEditingTier(false);
            fetchData(); // Refresh data ensures selectedCompany gets updated
        } catch (err: any) {
            alert("Update failed: " + err.message);
        }
    };

    const openDeleteModal = (companyId: string) => {
        setCompanyToDelete(companyId);
        setDeleteConfirmText("");
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!companyToDelete || deleteConfirmText !== companyToDelete) return;

        try {
            await deleteCompany(companyToDelete, token);
            if (selectedCompany?.company_id === companyToDelete) {
                setSelectedCompany(null);
            }
            setDeleteModalOpen(false);
            setCompanyToDelete(null);
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
                            <span style={{ fontSize: "2.5rem" }}></span>
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

                {!selectedCompany ? (
                    <>
                        {/* Statistics Grid (Master View) */}
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
                                        ₹{(statistics.tier_distribution['professional'] * 12000 + statistics.tier_distribution['starter'] * 4000).toLocaleString('en-IN')}
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
                                        background: "rgba(255, 255, 255, 0.15)",
                                        border: "1px solid rgba(255, 255, 255, 0.3)",
                                        color: "#93c5fd",
                                        fontWeight: 500
                                    }}
                                >
                                    <RefreshCw size={16} style={{ marginRight: 6 }} /> Refresh
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
                                                                setSelectedCompany(company);
                                                                setActiveTab("overview");
                                                            }}
                                                            className="glass-btn"
                                                            style={{
                                                                padding: "6px 16px",
                                                                borderRadius: 6,
                                                                fontSize: "0.85rem",
                                                                background: "rgba(255, 255, 255, 0.1)",
                                                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                                                color: "#93c5fd"
                                                            }}
                                                        >
                                                            Manage
                                                        </button>
                                                        <button
                                                            onClick={() => openDeleteModal(company.company_id)}
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
                    </>
                ) : (
                    <>
                        {/* Detail View (Tabs) */}
                        <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h2 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                                    <button onClick={() => setSelectedCompany(null)} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                                        <ArrowLeft size={24} />
                                    </button>
                                    {selectedCompany.company_id}
                                    <span style={{
                                        padding: "4px 12px",
                                        borderRadius: 99,
                                        background: `${getTierColor(selectedCompany.subscription_tier)}20`,
                                        color: getTierColor(selectedCompany.subscription_tier),
                                        border: `1px solid ${getTierColor(selectedCompany.subscription_tier)}40`,
                                        fontSize: "0.75rem",
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                        letterSpacing: "0.05em"
                                    }}>
                                        {selectedCompany.subscription_tier}
                                    </span>
                                </h2>
                                <p style={{ color: "var(--text-secondary)", marginTop: 8, marginLeft: 36 }}>Joined {new Date(selectedCompany.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Tabs Nav */}
                        <div style={{ display: "flex", gap: 16, marginBottom: 32, overflowX: "auto", paddingBottom: 8 }}>
                            {[
                                { id: "overview", icon: Activity, label: "Overview" },
                                { id: "users", icon: Users, label: `Employees (${companyUsers.length})` },
                                { id: "documents", icon: FileText, label: `Documents (${companyDocs.length})` },
                                { id: "apikeys", icon: Key, label: `API Keys (${companyKeys.length})` }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 8,
                                        padding: "10px 20px",
                                        borderRadius: 99,
                                        background: activeTab === tab.id ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.03)",
                                        border: activeTab === tab.id ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid rgba(255, 255, 255, 0.05)",
                                        color: activeTab === tab.id ? "#e0e7ff" : "var(--text-secondary)",
                                        fontWeight: activeTab === tab.id ? 600 : 500,
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        whiteSpace: "nowrap"
                                    }}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        {loadingDetails ? (
                            <div style={{ padding: 60, textAlign: "center", color: "var(--text-secondary)" }}>Loading company details...</div>
                        ) : (
                            <div className="glass-card" style={{ padding: 32, minHeight: 400 }}>
                                {activeTab === "overview" && (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                                        <div>
                                            <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
                                                <Settings size={20} color="#818cf8" /> Usage & Settings
                                            </h3>

                                            <div style={{ display: "flex", gap: 24, marginBottom: 32 }}>
                                                <div style={{ background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 16, flex: 1, border: "1px solid rgba(255,255,255,0.05)" }}>
                                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8 }}>Documents Indexed</div>
                                                    <div style={{ fontSize: "2rem", fontWeight: 700 }}>{selectedCompany.usage?.documents_count || 0}</div>
                                                </div>
                                                <div style={{ background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 16, flex: 1, border: "1px solid rgba(255,255,255,0.05)" }}>
                                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8 }}>Queries This Month</div>
                                                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#60a5fa" }}>{selectedCompany.usage?.queries_this_month || 0}</div>
                                                </div>
                                                <div style={{ background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 16, flex: 1, border: "1px solid rgba(255,255,255,0.05)" }}>
                                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8 }}>Unique Chat Visitors (30d)</div>
                                                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#34d399" }}>{companyMetrics?.active_users || 0}</div>
                                                </div>
                                            </div>

                                            <div style={{ background: "rgba(99, 102, 241, 0.05)", padding: 24, borderRadius: 16, border: "1px solid rgba(99, 102, 241, 0.1)" }}>
                                                <h4 style={{ margin: "0 0 16px 0", fontSize: "1rem" }}>Edit Subscription</h4>
                                                <div style={{ marginBottom: 16 }}>
                                                    <label style={{ display: "block", marginBottom: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>Subscription Tier</label>
                                                    <select
                                                        value={editForm.tier}
                                                        onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                                                        style={{
                                                            width: "100%", padding: 10, borderRadius: 8,
                                                            background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                                                            color: "white", outline: "none", fontFamily: "inherit"
                                                        }}
                                                    >
                                                        <option value="starter">Starter</option>
                                                        <option value="professional">Professional</option>
                                                        <option value="enterprise">Enterprise</option>
                                                    </select>
                                                </div>
                                                <div style={{ marginBottom: 24 }}>
                                                    <label style={{ display: "block", marginBottom: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>Account Status</label>
                                                    <select
                                                        value={editForm.status}
                                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                                        style={{
                                                            width: "100%", padding: 10, borderRadius: 8,
                                                            background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                                                            color: "white", outline: "none", fontFamily: "inherit"
                                                        }}
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="suspended">Suspended</option>
                                                        <option value="cancelled">Cancelled</option>
                                                        <option value="trial">Trial</option>
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setIsEditingTier(true);
                                                        handleUpdateCompany();
                                                    }}
                                                    disabled={isEditingTier || (editForm.tier === selectedCompany.subscription_tier && editForm.status === selectedCompany.subscription_status)}
                                                    style={{
                                                        width: "100%", padding: 12, borderRadius: 8, fontWeight: 600, border: "none",
                                                        background: (editForm.tier === selectedCompany.subscription_tier && editForm.status === selectedCompany.subscription_status) ? "rgba(255,255,255,0.1)" : "#4f46e5",
                                                        color: (editForm.tier === selectedCompany.subscription_tier && editForm.status === selectedCompany.subscription_status) ? "var(--text-secondary)" : "white",
                                                        cursor: (editForm.tier === selectedCompany.subscription_tier && editForm.status === selectedCompany.subscription_status) ? "not-allowed" : "pointer"
                                                    }}
                                                >
                                                    {isEditingTier ? "Saving..." : "Save Changes"}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
                                                <Activity size={20} color="#34d399" /> Usage Metrics
                                            </h3>

                                            <div style={{ background: "rgba(0,0,0,0.2)", height: 350, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", padding: 24 }}>
                                                {companyMetrics?.timeseries && companyMetrics.timeseries.length > 0 ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={companyMetrics.timeseries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                                            <XAxis
                                                                dataKey="date"
                                                                stroke="rgba(255,255,255,0.3)"
                                                                fontSize={12}
                                                                tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            />
                                                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, color: "white" }}
                                                                itemStyle={{ color: "white" }}
                                                            />
                                                            <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                                                            <Line type="monotone" dataKey="queries" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4, fill: "#60a5fa" }} activeDot={{ r: 6 }} name="Search Queries" />
                                                            <Line type="monotone" dataKey="documents" stroke="#34d399" strokeWidth={3} dot={{ r: 4, fill: "#34d399" }} activeDot={{ r: 6 }} name="Docs Ingested" />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column" }}>
                                                        <p style={{ color: "var(--text-secondary)" }}>No metrics data available yet.</p>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => openDeleteModal(selectedCompany.company_id)}
                                                style={{
                                                    marginTop: 24, padding: "12px", width: "100%", borderRadius: 8,
                                                    background: "transparent", border: "1px solid #ef4444", color: "#ef4444",
                                                    fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                                                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                                            >
                                                Delete Organization & All Data
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "users" && (
                                    <div>
                                        <table style={{ width: "100%", borderCollapse: "collapse" }} className="admin-table">
                                            <thead>
                                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                                    <th style={{ textAlign: "left", padding: "12px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Username</th>
                                                    <th style={{ textAlign: "left", padding: "12px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Email</th>
                                                    <th style={{ textAlign: "left", padding: "12px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Role</th>
                                                    <th style={{ textAlign: "right", padding: "12px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Created</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {companyUsers.length === 0 ? (
                                                    <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "var(--text-secondary)" }}>No users found.</td></tr>
                                                ) : companyUsers.map(u => (
                                                    <tr key={u._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                                        <td style={{ padding: "12px", color: "white", fontWeight: 500 }}>{u.username}</td>
                                                        <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{u.email || "-"}</td>
                                                        <td style={{ padding: "12px" }}>
                                                            <span style={{ padding: "4px 8px", background: "rgba(255,255,255,0.1)", borderRadius: 6, fontSize: "0.75rem" }}>{u.role || "user"}</span>
                                                        </td>
                                                        <td style={{ padding: "12px", textAlign: "right", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                                            {new Date(u.created_at).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === "documents" && (
                                    <div>
                                        <table style={{ width: "100%", borderCollapse: "collapse" }} className="admin-table">
                                            <thead>
                                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                                    <th style={{ textAlign: "left", padding: "12px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Filename</th>
                                                    <th style={{ textAlign: "left", padding: "12px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Size</th>
                                                    <th style={{ textAlign: "center", padding: "12px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Chunks</th>
                                                    <th style={{ textAlign: "center", padding: "12px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Status</th>
                                                    <th style={{ textAlign: "right", padding: "12px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Uploaded</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {companyDocs.length === 0 ? (
                                                    <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "var(--text-secondary)" }}>No documents found.</td></tr>
                                                ) : companyDocs.map(d => (
                                                    <tr key={d._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                                        <td style={{ padding: "12px", color: "white", fontWeight: 500 }}>{d.filename}</td>
                                                        <td style={{ padding: "12px", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                                                            {(d.file_size || 0) < 1024 * 1024
                                                                ? `${((d.file_size || 0) / 1024).toFixed(2)} KB`
                                                                : `${((d.file_size || 0) / 1024 / 1024).toFixed(2)} MB`}
                                                        </td>
                                                        <td style={{ padding: "12px", textAlign: "center", fontFamily: "monospace" }}>{d.chunk_count || 0}</td>
                                                        <td style={{ padding: "12px", textAlign: "center" }}>
                                                            <span style={{ color: d.status === "completed" ? "#34d399" : "#fbbf24", fontSize: "0.85rem" }}>
                                                                {d.status || "processing"}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "12px", textAlign: "right", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                                            {new Date(d.upload_date).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === "apikeys" && (
                                    <div>
                                        <table style={{ width: "100%", borderCollapse: "collapse" }} className="admin-table">
                                            <thead>
                                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                                    <th style={{ textAlign: "left", padding: "12px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Key Name</th>
                                                    <th style={{ textAlign: "left", padding: "12px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Key Fragment</th>
                                                    <th style={{ textAlign: "right", padding: "12px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Created At</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {companyKeys.length === 0 ? (
                                                    <tr><td colSpan={3} style={{ padding: 24, textAlign: "center", color: "var(--text-secondary)" }}>No API keys found.</td></tr>
                                                ) : companyKeys.map((k, i) => (
                                                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                                        <td style={{ padding: "12px", color: "white", fontWeight: 500 }}>{k.name || "Default Key"}</td>
                                                        <td style={{ padding: "12px", fontFamily: "monospace", color: "#fbbf24" }}>{k.prefix || k.key || "sk_corp_..."}</td>
                                                        <td style={{ padding: "12px", textAlign: "right", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                                            {k.created_at ? new Date(k.created_at).toLocaleDateString() : "-"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Delete Confirmation Modal */}
                {deleteModalOpen && companyToDelete && (
                    <div style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                        background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(4px)",
                        display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
                    }}>
                        <div className="glass-card" style={{ padding: 32, maxWidth: 400, width: "100%", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 16px 0", color: "#f87171" }}>Delete Organization</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: 24, lineHeight: 1.5 }}>
                                You are about to permanently delete <strong>{companyToDelete}</strong> and all associated data. This action cannot be undone.
                            </p>
                            <label style={{ display: "block", marginBottom: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                Please type <strong>{companyToDelete}</strong> to confirm:
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder={companyToDelete}
                                style={{
                                    width: "100%", padding: 12, borderRadius: 8, marginBottom: 24,
                                    background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                                    color: "white", outline: "none", fontFamily: "monospace"
                                }}
                            />
                            <div style={{ display: "flex", gap: 12 }}>
                                <button
                                    onClick={() => setDeleteModalOpen(false)}
                                    className="glass-btn"
                                    style={{ flex: 1, padding: "10px", borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "none", color: "white", cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={deleteConfirmText !== companyToDelete}
                                    style={{
                                        flex: 1, padding: "10px", borderRadius: 8, border: "none", fontWeight: 600,
                                        background: deleteConfirmText === companyToDelete ? "#ef4444" : "rgba(239, 68, 68, 0.3)",
                                        color: deleteConfirmText === companyToDelete ? "white" : "rgba(255,255,255,0.5)",
                                        cursor: deleteConfirmText === companyToDelete ? "pointer" : "not-allowed",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    Delete Data
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div >
    );
}
