import React, { useState } from "react";
import DecryptedText from "./DecryptedText";


interface AdminAuthProps {
    onAuthenticated: (companyId: string) => void;
}

export function AdminAuth({ onAuthenticated }: AdminAuthProps) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Simple password check (hardcoded for now, will upgrade later)
    const ADMIN_PASSWORD = "admin123"; // TODO: Move to env variable

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Extract company ID from the form (using name attribute since we didn't use state for it to keep it simple)
        const form = e.target as HTMLFormElement;
        const companyIdInput = form.elements.namedItem("companyId") as HTMLInputElement;
        const companyId = companyIdInput?.value?.trim().toLowerCase();

        if (password === ADMIN_PASSWORD) {
            if (!companyId) {
                setError("Company ID is required");
                return;
            }
            onAuthenticated(companyId);
            setError("");
        } else {
            setError("Invalid password");
            setPassword("");
        }
    };

    return (
        <div className="role-selection-container">

            <div className="admin-auth-card">
                <div className="admin-lock-icon">🔐</div>

                <h1 className="admin-title">
                    <DecryptedText
                        text="Admin Access"
                        animateOn="view"
                        revealDirection="center"
                        speed={70}
                        className="revealed"
                        encryptedClassName="encrypted"
                    />
                </h1>
                <p className="admin-subtitle">
                    Enter credentials to access the secure portal
                </p>

                <form onSubmit={handleSubmit} className="admin-form">
                    <div className="admin-input-wrapper">
                        <input
                            type="text"
                            placeholder="Company ID (e.g. silaibook)"
                            className="admin-input"
                            name="companyId"
                            required
                            autoComplete="off"
                        />
                    </div>

                    <div className="admin-input-wrapper">
                        <input
                            type="password"
                            placeholder="Enter admin password..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="admin-input"
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <div style={{
                            color: "#f87171",
                            fontSize: "0.85rem",
                            padding: "10px",
                            background: "rgba(239, 68, 68, 0.15)",
                            borderRadius: 8,
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            textAlign: "center"
                        }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="admin-submit-btn">
                        Access Portal
                    </button>
                </form>

                <div className="admin-hint">
                    Hint: Default password is <code>{ADMIN_PASSWORD}</code>
                </div>
            </div>
        </div>
    );
}
