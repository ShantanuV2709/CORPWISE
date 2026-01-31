import React, { useState } from "react";

interface AdminAuthProps {
    onAuthenticated: () => void;
}

export function AdminAuth({ onAuthenticated }: AdminAuthProps) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Simple password check (hardcoded for now, will upgrade later)
    const ADMIN_PASSWORD = "admin123"; // TODO: Move to env variable

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (password === ADMIN_PASSWORD) {
            onAuthenticated();
            setError("");
        } else {
            setError("Invalid password");
            setPassword("");
        }
    };

    return (
        <div className="admin-auth-page">
            <div className="admin-auth-container">
                <h1>🔐 Admin Access</h1>
                <p>Enter admin password to continue</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-input"
                            autoFocus
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="auth-button">
                        Login
                    </button>
                </form>

                <p className="hint">Hint: Default password is "admin123"</p>
            </div>
        </div>
    );
}
