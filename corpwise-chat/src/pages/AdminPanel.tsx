import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DecryptedText from "../components/DecryptedText";

import { AdminAuth } from "../components/AdminAuth";
import { uploadDocument, listDocuments, deleteDocument, Document } from "../api/admin";

export function AdminPanel() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [companyId, setCompanyId] = useState(""); // Store logged-in company
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [docType, setDocType] = useState("general");
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            loadDocuments();
        }
    }, [isAuthenticated]);

    const loadDocuments = async () => {
        try {
            const data = await listDocuments();
            setDocuments(data.documents);
        } catch (error) {
            console.error("Failed to load documents:", error);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFile) return;

        setUploading(true);
        try {
            // Pass companyId to API
            await uploadDocument(selectedFile, docType, companyId);
            setSelectedFile(null);
            setDocType("general");
            await loadDocuments();
            alert(`Document uploaded successfully for ${companyId}!`);
        } catch (error) {
            alert("Upload failed: " + error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId: string, filename: string) => {
        if (!window.confirm(`Delete "${filename}"?`)) return;

        try {
            await deleteDocument(docId, companyId);
            await loadDocuments();
            alert("Document deleted successfully!");
        } catch (error) {
            alert("Delete failed: " + error);
        }
    };

    if (!isAuthenticated) {
        return <AdminAuth onAuthenticated={(id) => {
            setCompanyId(id);
            setIsAuthenticated(true);
        }} />;
    }

    return (

        <div className="admin-container">
            <header className="admin-header">
                <div>
                    <h1 className="brand-title">
                        <DecryptedText
                            text="CORPWISE"
                            animateOn="view"
                            revealDirection="start"
                            sequential={true}
                            speed={100}
                            className="revealed"
                            encryptedClassName="encrypted"
                        />
                    </h1>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Document Management</span>
                </div>
                <button onClick={() => navigate("/")} className="btn-primary" style={{ background: "transparent", border: "1px solid var(--border-color)" }}>
                    ← Back to Home
                </button>
            </header>

            <div className="admin-content">
                {/* Upload Section */}
                <div className="admin-card">
                    <h2 style={{ marginBottom: 20 }}>Upload New Document</h2>
                    <form onSubmit={handleUpload}>
                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>

                            <div className="upload-zone" style={{ flex: 1, padding: 20, textAlign: "left" }} onClick={() => document.getElementById("file-upload")?.click()}>
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".md,.txt,.pdf"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    style={{ display: "none" }}
                                />
                                {selectedFile ? (
                                    <span style={{ color: "var(--text-primary)" }}>📄 {selectedFile.name}</span>
                                ) : (
                                    <span>Click to select file (.txt, .md, .pdf)</span>
                                )}
                            </div>

                            <select
                                value={docType}
                                onChange={(e) => setDocType(e.target.value)}
                                style={{ padding: 16, borderRadius: 12, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "white" }}
                            >
                                <option value="general">General</option>
                                <option value="hr">HR Policy</option>
                                <option value="it">IT Support</option>
                                <option value="policy">Company Policy</option>
                            </select>

                            <button
                                type="submit"
                                disabled={!selectedFile || uploading}
                                className="btn-primary"
                                style={{ height: 54 }}
                            >
                                {uploading ? "Uploading..." : "Upload Document"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Documents Table */}
                <div className="admin-card">
                    <h2 style={{ marginBottom: 20 }}>Uploaded Documents ({documents.length})</h2>

                    {documents.length === 0 ? (
                        <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                            No documents found. Upload one to get started.
                        </div>
                    ) : (
                        <table className="file-list">
                            <thead>
                                <tr>
                                    <th>Filename</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Chunks</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map((doc) => (
                                    <tr key={doc._id}>
                                        <td style={{ fontWeight: 500 }}>{doc.filename}</td>
                                        <td>
                                            <span className="chip source" style={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                                                {doc.doc_type}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ color: "#4ade80", fontSize: "0.85rem" }}>● {doc.status}</span>
                                        </td>
                                        <td style={{ color: "var(--text-secondary)" }}>{doc.chunk_count}</td>
                                        <td style={{ color: "var(--text-secondary)" }}>{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                onClick={() => handleDelete(doc._id, doc.filename)}
                                                className="btn-danger"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
