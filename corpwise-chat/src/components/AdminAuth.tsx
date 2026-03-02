import React, { useState } from "react";
import { Lock } from "lucide-react";
import DecryptedText from "./DecryptedText";
import { adminLogin, googleAdminLogin } from "../api/auth";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

interface AdminAuthProps {
    onAuthenticated: (companyId: string, isNewUser?: boolean) => void;
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

    const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) return;

        // If they want to link a company ID manually, we should check it.
        // But for simplicity, we pass what they typed in companyId block (or they register with what they typed).
        setError("");
        setLoading(true);

        try {
            const data = await googleAdminLogin(
                credentialResponse.credential,
                companyId ? companyId : undefined
            );

            console.log("Admin Google Login Response:", data);

            if (data.is_admin) {
                onAuthenticated(data.company_id, data.is_new_user);
            } else {
                throw new Error("Logged in, but not recognized as an Admin");
            }

        } catch (err: any) {
            setError(err.message || "Google Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (!companyId || !username || !password) {
                throw new Error("Company ID, Username and Password are required for manual sign in.");
            }
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

            onAuthenticated(data.company_id, false);
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
                        background: "radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)",
                        filter: "blur(60px)",
                        animation: "pulse-slow 8s infinite ease-in-out"
                    }} />
                    <div style={{
                        position: "absolute",
                        bottom: "-20%",
                        right: "-10%",
                        width: "60%",
                        height: "60%",
                        background: "radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)",
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
                        background: "radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)",
                        zIndex: -1,
                        filter: "blur(10px)"
                    }} />
                    <Lock size={56} strokeWidth={1.5} color="#60a5fa" style={{ filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))" }} />
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
                            background: "rgba(255, 255, 255, 0.03)",
                            color: "#ffffff",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            fontSize: "1rem",
                            fontFamily: "var(--font-body)",
                            fontWeight: 500,
                            cursor: loading ? "wait" : "pointer",
                            transition: "all 0.3s",
                            opacity: loading ? 0.7 : 1,
                            marginTop: "10px",
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.color = "#000000";
                            e.currentTarget.style.borderColor = "#ffffff";
                            e.currentTarget.style.boxShadow = "0 0 30px rgba(255, 255, 255, 0.6)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                            e.currentTarget.style.color = "#ffffff";
                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.2)";
                        }}
                    >
                        {loading ? "Verifying Credentials..." : "Access Portal"}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: '8px' }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin
                            theme="filled_black"
                            onSuccess={handleGoogleLogin}
                            onError={() => setError("Google Login Failed")}
                        />
                    </div>

                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            title="Go back"
                            style={{
                                marginTop: '12px',
                                width: '100%',
                                padding: '10px',
                                background: 'transparent',
                                color: '#64748b',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '12px',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#64748b';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            ← Back
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
