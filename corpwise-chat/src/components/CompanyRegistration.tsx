import React, { useState, useEffect } from "react";
import { ArrowLeft } from 'lucide-react';
import { adminSignup } from "../api/auth";
import toast from 'react-hot-toast';

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
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await adminSignup(adminUsername, password, companyId, "starter");
            toast.success("Organization registered successfully!");
            onRegistered(data.username, data.company_id);
        } catch (err: any) {
            setError(err.message || "Registration failed");
            toast.error(err.message || "Registration failed");
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

                {/* Tier Selection moved to dedicated OnboardingPage */}

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
