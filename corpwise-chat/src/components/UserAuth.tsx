import React, { useState } from "react";
import { ArrowLeft } from 'lucide-react';
import { login, signup } from "../api/auth";

interface UserAuthProps {
    onAuthenticated: (username: string, companyId: string) => void;
    onBack: () => void;
    embedded?: boolean;
}

export function UserAuth({ onAuthenticated, onBack, embedded = false }: UserAuthProps) {
    const [isLogin, setIsLogin] = useState(true);
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
            if (isLogin) {
                const data = await login(username, password);
                // Save token or session info if we had one, for now just user props
                onAuthenticated(data.username, data.company_id);
            } else {
                const data = await signup(username, password, companyId);
                // Auto login after signup? or ask to login?
                // For simplicity, auto-login
                onAuthenticated(data.username, data.company_id);
            }
        } catch (err: any) {
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={embedded ? "" : "auth-card"}>
            <h3 className="auth-title">
                {isLogin ? "Welcome Back" : "Join Corpwise"}
            </h3>
            <p className="auth-subtitle">
                {isLogin ? "Sign in to access your workspace" : "Create a new account"}
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
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="auth-input"
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input"
                    required
                    minLength={6}
                />

                {!isLogin && (
                    <input
                        type="text"
                        placeholder="Company ID (Workspace)"
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value.toLowerCase())}
                        className="auth-input"
                        required
                    />
                )}

                <button
                    type="submit"
                    className="auth-btn-primary"
                    disabled={loading}
                    style={{ marginTop: 8 }}
                >
                    {loading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
                </button>
            </form>

            <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                    onClick={onBack}
                    className="auth-back-link"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <ArrowLeft size={16} /> Back
                </span>

                <span
                    onClick={() => { setIsLogin(!isLogin); setError(""); }}
                    className="auth-link"
                >
                    {isLogin ? "Need an account?" : "Already user?"}
                </span>
            </div>
        </div>
    );
}
