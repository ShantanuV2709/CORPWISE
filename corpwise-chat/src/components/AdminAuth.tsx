import React, { useState } from "react";
import DecryptedText from "./DecryptedText";
import { adminLogin } from "../api/auth";

interface AdminAuthProps {
    onAuthenticated: (companyId: string) => void;
    onSuperAdmin?: (token: string) => void;
    onBack?: () => void;
    embedded?: boolean;
}

export function AdminAuth({ onAuthenticated, onBack, onSuperAdmin, embedded = false }: AdminAuthProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [companyId, setCompanyId] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await adminLogin(username, password, companyId);
            console.log("Admin Login Response:", data); // Debugging
            console.log("is_super_admin:", data.is_super_admin); // Debugging
            console.log("onSuperAdmin prop:", !!onSuperAdmin); // Debugging

            if (data.is_super_admin && onSuperAdmin) {
                // If super admin, verify the secret token (password) matches
                // For simplicity, we just use the password as the token for our simple backend.
                onSuperAdmin("masterkey123");
                return;
            }

            // Regular Admin: Verify company ID matches
            if (data.company_id.toLowerCase() !== companyId.toLowerCase()) {
                throw new Error("User does not belong to this company");
            }

            onAuthenticated(data.company_id);
        } catch (err: any) {
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={embedded ? "" : "auth-card"}>
            <div className="admin-lock-icon">🔐</div>

            <h1 className="auth-title">
                <DecryptedText
                    text="Admin Access"
                    animateOn="view"
                    revealDirection="center"
                    speed={70}
                    className="revealed"
                    encryptedClassName="encrypted"
                />
            </h1>
            <p className="auth-subtitle">
                Enter credentials to access the secure portal
            </p>

            {error && (
                <div style={{
                    color: "#f87171",
                    fontSize: "0.8rem",
                    padding: "8px",
                    background: "rgba(239, 68, 68, 0.15)",
                    borderRadius: 8,
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    textAlign: "center",
                    marginBottom: 12
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="admin-form">
                <div className="admin-input-wrapper">
                    <input
                        type="text"
                        placeholder="Company ID"
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value.toLowerCase())}
                        className="auth-input"
                        required
                    />
                </div>

                <div className="admin-input-wrapper">
                    <input
                        type="text"
                        placeholder="Admin Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="auth-input"
                        required
                    />
                </div>

                <div className="admin-input-wrapper">
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="auth-input"
                        autoComplete="current-password"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="auth-btn-primary"
                    style={{ marginTop: 8 }}
                    disabled={loading}
                >
                    {loading ? "Verifying..." : "Access Portal"}
                </button>

                {onBack && (
                    <div style={{ marginTop: 16, textAlign: "center" }}>
                        <span
                            onClick={onBack}
                            className="auth-back-link"
                        >
                            ← Back to Role Selection
                        </span>
                    </div>
                )}
            </form>
        </div>
    );
}
