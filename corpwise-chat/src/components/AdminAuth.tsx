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

            <div className="role-card" style={{ maxWidth: 400, textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: 20 }}>🔐</div>

                <h1 style={{ fontSize: "1.5rem", marginBottom: 8, fontWeight: 700 }}>
                    <DecryptedText
                        text="Admin Access"
                        animateOn="view"
                        revealDirection="center"
                        speed={70}
                        className="revealed"
                        encryptedClassName="encrypted"
                    />
                </h1>
                <p style={{ color: "var(--text-secondary)", marginBottom: 30, fontSize: "0.9rem" }}>
                    Enter credentials to access the secure portal
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="input-wrapper" style={{ margin: 0, padding: 4 }}>
                        <input
                            type="text"
                            placeholder="Company ID (e.g. silaibook)"
                            className="chat-input"
                            style={{ textAlign: "center", fontSize: "1.0rem" }}
                            name="companyId"
                            required
                        />
                    </div>

                    <div className="input-wrapper" style={{ margin: 0, padding: 4 }}>
                        <input
                            type="password"
                            placeholder="Enter admin password..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="chat-input"
                            style={{ textAlign: "center", fontSize: "1.1rem" }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            color: "#ef4444",
                            fontSize: "0.85rem",
                            padding: "8px",
                            background: "rgba(239, 68, 68, 0.1)",
                            borderRadius: 6
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="send-btn"
                        style={{
                            width: "100%",
                            padding: "14px",
                            fontSize: "1rem",
                            marginTop: 8
                        }}
                    >
                        Access Portal
                    </button>
                </form>

                <div style={{ marginTop: 24, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Hint: Default password is <code style={{ color: "var(--accent-color)", background: "transparent", border: "none" }}>admin123</code>
                </div>
            </div>
        </div>
    );
}
