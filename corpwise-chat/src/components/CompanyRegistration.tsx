import React, { useState, useEffect } from "react";
import { ArrowLeft } from 'lucide-react';
import { adminSignup } from "../api/auth";
import { fetchSubscriptionTiers, type SubscriptionTier } from "../api/subscription";
import { TierCard } from "./TierCard";

interface CompanyRegistrationProps {
    onRegistered: (username: string, companyId: string) => void;
    onBack: () => void;
    embedded?: boolean;
}

export function CompanyRegistration({ onRegistered, onBack, embedded = false }: CompanyRegistrationProps) {
    const [companyName, setCompanyName] = useState("");
    const [companyId, setCompanyId] = useState("");
    const [adminUsername, setAdminUsername] = useState("");
    const [password, setPassword] = useState("");
    const [selectedTier, setSelectedTier] = useState("professional");
    const [tiers, setTiers] = useState<Record<string, SubscriptionTier>>({});
    const [loadingTiers, setLoadingTiers] = useState(true);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTiers();
    }, []);

    const loadTiers = async () => {
        try {
            const data = await fetchSubscriptionTiers();
            setTiers(data.tiers);
        } catch (err) {
            console.error("Failed to load tiers:", err);
        } finally {
            setLoadingTiers(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await adminSignup(adminUsername, password, companyId, selectedTier);
            onRegistered(data.username, data.company_id);
        } catch (err: any) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={embedded ? "" : "auth-card"}>
            <h3 className="auth-title">
                Register Organization
            </h3>
            <p className="auth-subtitle">
                Create a new secure workspace for your company
            </p>

            {error && (
                <div style={{
                    padding: "10px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    color: "#ef4444",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    fontSize: "0.85rem",
                    textAlign: "center"
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Company Name (e.g. Acme Corp)"
                    value={companyName}
                    onChange={(e) => {
                        setCompanyName(e.target.value);
                        // Auto-generate ID from name if empty
                        if (!companyId) {
                            setCompanyId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
                        }
                    }}
                    className="auth-input"
                    required
                />

                <input
                    type="text"
                    placeholder="Workspace ID (e.g. acmecorp)"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value.toLowerCase())}
                    className="auth-input"
                    required
                    pattern="^[a-z0-9\-]+$"
                    title="Alphanumeric characters only"
                />

                <input
                    type="text"
                    placeholder="Admin Username"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="auth-input"
                    required
                />

                <input
                    type="password"
                    placeholder="Admin Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input"
                    required
                    minLength={6}
                />

                {/* Tier Selection Section */}
                <div style={{ marginTop: "32px", marginBottom: "24px" }}>
                    <h4 style={{
                        textAlign: "center",
                        marginBottom: "24px",
                        color: "rgba(255,255,255,0.9)",
                        fontSize: "1.25rem",
                        fontWeight: 600
                    }}>
                        Choose Your Plan
                    </h4>

                    {loadingTiers ? (
                        <div style={{
                            textAlign: "center",
                            padding: "40px",
                            color: "rgba(255,255,255,0.6)"
                        }}>
                            Loading plans...
                        </div>
                    ) : (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: "24px",
                            maxWidth: "1200px",
                            margin: "0 auto"
                        }}>
                            {Object.entries(tiers).map(([tierId, tier]) => (
                                <TierCard
                                    key={tierId}
                                    tierId={tierId}
                                    tierName={tier.name}
                                    price={tier.price_display}
                                    description={tier.description}
                                    isPopular={tierId === "professional"}
                                    isSelected={selectedTier === tierId}
                                    onSelect={setSelectedTier}
                                    features={[
                                        {
                                            text: tier.max_documents === -1
                                                ? "Unlimited Documents"
                                                : `${tier.max_documents} Documents`,
                                            enabled: true
                                        },
                                        {
                                            text: tier.max_queries_per_month === -1
                                                ? "Unlimited Queries"
                                                : `${tier.max_queries_per_month.toLocaleString()} Queries/month`,
                                            enabled: true
                                        },
                                        {
                                            text: "Advanced Analytics",
                                            enabled: tier.analytics_enabled
                                        },
                                        {
                                            text: "Custom Branding",
                                            enabled: tier.custom_branding
                                        },
                                        {
                                            text: "Priority Support",
                                            enabled: tier.priority_support
                                        }
                                    ]}
                                    behindGlowColor={
                                        tierId === "enterprise"
                                            ? "rgba(167, 139, 250, 0.67)"
                                            : tierId === "professional"
                                                ? "rgba(16, 185, 129, 0.67)"
                                                : "rgba(59, 130, 246, 0.67)"
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="auth-btn-primary"
                    disabled={loading}
                    style={{ marginTop: "24px" }}
                >
                    {loading ? "Creating Workspace..." : "Register Organization"}
                </button>
            </form>

            <div style={{ marginTop: 24, textAlign: "center" }}>
                <span
                    onClick={onBack}
                    className="auth-back-link"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <ArrowLeft size={16} /> Back to Role Selection
                </span>
            </div>
        </div>
    );
}
