import React, { useState } from "react";
import { Lock } from "lucide-react";
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
            console.log("Admin Login Response:", data);

            if (data.is_super_admin && onSuperAdmin) {
                // Pass the entered password as the token, since the backend validated it against SUPER_USER_KEY
                onSuperAdmin(password);
                return;
            }

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
        <div className={embedded ? "" : "admin-login-container"} style={embedded ? {} : {
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "radial-gradient(circle at 50% 10%, #1e1e24, #000)",
            zIndex: 50
        }}>
            {!embedded && (
                <div style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                    pointerEvents: "none"
                }}>
                    <div style={{
                        position: "absolute",
                        top: "-20%",
                        left: "-10%",
                        width: "60%",
                        height: "60%",
                        background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
                        filter: "blur(60px)",
                        animation: "pulse-slow 8s infinite ease-in-out"
                    }} />
                    <div style={{
                        position: "absolute",
                        bottom: "-20%",
                        right: "-10%",
                        width: "60%",
                        height: "60%",
                        background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
                        filter: "blur(60px)",
                        animation: "pulse-slow 8s infinite ease-in-out reverse"
                    }} />
                </div>
            )}

            <div className={embedded ? "glass-card" : "auth-card glass-panel"} style={embedded ? {
                width: "100%",
                maxWidth: "420px",
                padding: "40px",
                borderRadius: "24px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(15, 15, 20, 0.95)",
                backdropFilter: "blur(30px)",
                WebkitBackdropFilter: "blur(30px)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)",
                position: "relative"
            } : {
                width: "100%",
                maxWidth: "420px",
                padding: "40px",
                borderRadius: "24px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(15, 15, 20, 0.6)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                position: "relative",
                zIndex: 10
            }}>
                <div className="admin-lock-icon" style={{
                    fontSize: 'unset',
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '32px',
                    position: 'relative'
                }}>
                    <div style={{
                        position: "absolute",
                        inset: -20,
                        background: "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)",
                        zIndex: -1,
                        filter: "blur(10px)"
                    }} />
                    <Lock size={56} strokeWidth={1.5} color="#60a5fa" style={{ filter: "drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))" }} />
                </div>

                <div className="text-center mb-8">
                    <h1 className="auth-title" style={{
                        fontSize: "2rem",
                        fontWeight: 700,
                        marginBottom: "8px",
                        background: "linear-gradient(to right, #fff, #94a3b8)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textAlign: "center"
                    }}>
                        Admin Portal
                    </h1>
                    <p className="auth-subtitle" style={{ color: "#64748b", fontSize: "0.95rem", textAlign: "center" }}>
                        Secure access for authorized personnel only
                    </p>
                </div>

                {error && (
                    <div style={{
                        color: "#f87171",
                        fontSize: "0.85rem",
                        padding: "12px",
                        background: "rgba(239, 68, 68, 0.1)",
                        borderRadius: 12,
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        textAlign: "center",
                        marginBottom: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8
                    }}>
                        <span style={{ fontSize: "1.2em" }}>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="admin-form" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className="group">
                        <input
                            type="text"
                            placeholder="Company ID"
                            value={companyId}
                            onChange={(e) => setCompanyId(e.target.value.toLowerCase())}
                            className="auth-input"
                            required
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: "12px",
                                background: "rgba(255, 255, 255, 0.03)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                color: "white",
                                fontSize: "1rem",
                                outline: "none",
                                transition: "all 0.2s"
                            }}
                        />
                    </div>

                    <div className="group">
                        <input
                            type="text"
                            placeholder="Admin Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="auth-input"
                            required
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: "12px",
                                background: "rgba(255, 255, 255, 0.03)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                color: "white",
                                fontSize: "1rem",
                                outline: "none",
                                transition: "all 0.2s"
                            }}
                        />
                    </div>

                    <div className="group">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-input"
                            autoComplete="current-password"
                            required
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: "12px",
                                background: "rgba(255, 255, 255, 0.03)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                color: "white",
                                fontSize: "1rem",
                                outline: "none",
                                transition: "all 0.2s"
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "16px",
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                            color: "white",
                            border: "none",
                            fontSize: "1rem",
                            fontWeight: 600,
                            cursor: loading ? "wait" : "pointer",
                            transition: "all 0.3s",
                            opacity: loading ? 0.7 : 1,
                            marginTop: "10px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                        {loading ? "Verifying Credentials..." : "Access Portal"}
                    </button>

                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "12px",
                                background: "transparent",
                                color: "#94a3b8",
                                border: "1px solid rgba(255, 255, 255, 0.05)",
                                fontSize: "0.9rem",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                marginTop: "0"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                                e.currentTarget.style.color = "#cbd5e1";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "#94a3b8";
                            }}
                        >
                            ← Back to Role Selection
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
