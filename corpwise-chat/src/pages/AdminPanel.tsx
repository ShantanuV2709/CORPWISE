import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminAuth } from "../components/AdminAuth";
import { uploadDocument, listDocuments, deleteDocument, Document } from "../api/admin";

export function AdminPanel() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
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
            await uploadDocument(selectedFile, docType);
            setSelectedFile(null);
            setDocType("general");
            await loadDocuments();
            alert("Document uploaded successfully!");
        } catch (error) {
            alert("Upload failed: " + error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId: string, filename: string) => {
        if (!window.confirm(`Delete "${filename}"?`)) return;

        try {
            await deleteDocument(docId);
            await loadDocuments();
            alert("Document deleted successfully!");
        } catch (error) {
            alert("Delete failed: " + error);
        }
    };

    if (!isAuthenticated) {
        return <AdminAuth onAuthenticated={() => setIsAuthenticated(true)} />;
    }

    return (
        <div className="admin-panel">
            <div className="admin-header">
                <h1>📁 Document Management</h1>
                <button onClick={() => navigate("/")} className="back-button">
                    ← Back to Home
                </button>
            </div>

            <div className="admin-content">
                {/* Upload Section */}
                <section className="upload-section">
                    <h2>Upload New Document</h2>
                    <form onSubmit={handleUpload} className="upload-form">
                        <div className="form-row">
                            <input
                                type="file"
                                accept=".md,.txt"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                className="file-input"
                            />

                            <select
                                value={docType}
                                onChange={(e) => setDocType(e.target.value)}
                                className="doc-type-select"
                            >
                                <option value="general">General</option>
                                <option value="hr">HR Policy</option>
                                <option value="it">IT Support</option>
                                <option value="policy">Company Policy</option>
                            </select>

                            <button
                                type="submit"
                                disabled={!selectedFile || uploading}
                                className="upload-button"
                            >
                                {uploading ? "Uploading..." : "Upload"}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Documents Table */}
                <section className="documents-section">
                    <h2>Uploaded Documents ({documents.length})</h2>

                    <table className="documents-table">
                        <thead>
                            <tr>
                                <th>Filename</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Chunks</th>
                                <th>Uploaded</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((doc) => (
                                <tr key={doc._id}>
                                    <td>{doc.filename}</td>
                                    <td><span className="doc-type-badge">{doc.doc_type}</span></td>
                                    <td>
                                        <span className={`status-badge status-${doc.status}`}>
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td>{doc.chunk_count}</td>
                                    <td>{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            onClick={() => handleDelete(doc._id, doc.filename)}
                                            className="delete-button"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {documents.length === 0 && (
                        <div className="empty-state">
                            <p>No documents uploaded yet. Upload your first document above!</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
