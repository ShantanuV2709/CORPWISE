import React from "react";
import { useNavigate } from "react-router-dom";

export function RoleSelection() {
    const navigate = useNavigate();

    return (
        <div className="role-selection-page">
            <div className="role-selection-container">
                <h1>Welcome to CORPWISE AI</h1>
                <p className="subtitle">Your intelligent enterprise assistant</p>

                <div className="role-cards">
                    <div
                        className="role-card user-card"
                        onClick={() => navigate("/chat")}
                    >
                        <div className="role-icon">👤</div>
                        <h2>I'm a User</h2>
                        <p>Ask questions and get answers from company knowledge</p>
                        <button className="role-button user-button">Continue as User</button>
                    </div>

                    <div
                        className="role-card admin-card"
                        onClick={() => navigate("/admin")}
                    >
                        <div className="role-icon">🔐</div>
                        <h2>I'm an Admin</h2>
                        <p>Manage documents and configure the knowledge base</p>
                        <button className="role-button admin-button">Admin Panel</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
