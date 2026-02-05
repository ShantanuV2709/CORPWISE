import React from "react";
import { useNavigate } from "react-router-dom";
import DecryptedText from "../components/DecryptedText";


export function RoleSelection() {
    const navigate = useNavigate();

    return (
        <div className="role-selection-container">
            <div className="role-card">
                <h1 className="brand-title" style={{ fontSize: "2rem", marginBottom: 10, textAlign: "center" }}>
                    <DecryptedText
                        text="CORPWISE"
                        animateOn="view"
                        revealDirection="center"
                        speed={80}
                        maxIterations={20}
                        className="revealed"
                        encryptedClassName="encrypted"
                    />
                </h1>
                <p style={{ color: "var(--text-secondary)", marginBottom: 40, textAlign: "center" }}>
                    Secure Enterprise Knowledge Assistant
                </p>

                <div className="role-buttons">
                    <button onClick={() => navigate("/chat")} className="role-btn user">
                        <div className="role-icon">💬</div>
                        <div className="role-info">
                            <h3>Employee Chat</h3>
                            <span>Access internal documents</span>
                        </div>
                    </button>

                    <button onClick={() => navigate("/admin")} className="role-btn admin">
                        <div className="role-icon">🔒</div>
                        <div className="role-info">
                            <h3>Admin Portal</h3>
                            <span>Manage knowledge base</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
