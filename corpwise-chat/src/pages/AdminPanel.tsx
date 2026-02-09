import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { AdminAuth } from "../components/AdminAuth";
import { uploadDocument, listDocuments, deleteDocument, Document } from "../api/admin";

export function AdminPanel() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [companyId, setCompanyId] = useState(""); // Store logged-in company
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [docType, setDocType] = useState("general");
    const [isDragging, setIsDragging] = useState(false);
    const navigate = useNavigate();

    // Check for existing admin session on mount
    useEffect(() => {
        const savedCompanyId = localStorage.getItem("admin_company_id");
        if (savedCompanyId) {
            setCompanyId(savedCompanyId);
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadDocuments();
        }
    }, [isAuthenticated]);

    const loadDocuments = async () => {
        if (!companyId) return;
        try {
            const data = await listDocuments(companyId);
            setDocuments(data.documents);
        } catch (error) {
            console.error("Failed to load documents:", error);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFile) return;

        setUploading(true);
        setUploadProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setUploadProgress((prev: number) => Math.min(prev + 10, 90));
        }, 200);

        try {
            // Pass companyId to API
            await uploadDocument(selectedFile, docType, companyId);
            clearInterval(progressInterval);
            setUploadProgress(100);

            setTimeout(() => {
                setSelectedFile(null);
                setDocType("general");
                setUploadProgress(0);
            }, 500);

            await loadDocuments();
            alert(`Document uploaded successfully for ${companyId}!`);
        } catch (error) {
            clearInterval(progressInterval);
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

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            const file = files[0];
            if (file.name.endsWith('.pdf') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
                setSelectedFile(file);
            } else {
                alert('Please upload only PDF, MD, or TXT files');
            }
        }
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return '📕';
            case 'md': return '📘';
            case 'txt': return '📄';
            default: return '📄';
        }
    };

    if (!isAuthenticated) {
        return <AdminAuth onAuthenticated={(id) => {
            localStorage.setItem("admin_company_id", id);
            setCompanyId(id);
            setIsAuthenticated(true);
        }} />;
    }

    // Enhanced Admin UI
    return (
        <div className="app-container" style={{ overflowY: "auto", display: "block" }}>
            <header className="admin-header" style={{ background: "rgba(5, 5, 7, 0.6)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.08)", position: "sticky", top: 0, zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="admin-lock-icon" style={{ fontSize: "1.5rem", marginBottom: 0 }}>🔐</div>
                    <h2 className="admin-title" style={{ fontSize: "1.2rem", margin: 0 }}>
                        CORPWISE <span style={{ opacity: 0.5, fontWeight: 400 }}>Admin Portal</span>
                    </h2>
                </div>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    <div className="status-badge-desktop glass-panel" style={{ color: "#60a5fa", borderColor: "rgba(59, 130, 246, 0.2)", padding: "6px 16px", borderRadius: 99 }}>
                        Workspace: <span style={{ fontWeight: 600, color: "white" }}>{companyId}</span>
                    </div>
                    <button onClick={() => navigate("/")} className="glass-btn" style={{ padding: "8px 16px", borderRadius: 8, color: "#cbd5e1", cursor: "pointer" }}>
                        ← Back to Home
                    </button>
                </div>
            </header>

            <main className="admin-content" style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 20px" }}>
                {/* Section 1: Upload */}
                <section className="glass-card" style={{ padding: 32, marginBottom: 32 }}>
                    <h3 style={{ fontSize: "1.25rem", marginBottom: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: "1.5rem" }}>📤</span> Upload Knowledge
                    </h3>
                    <p style={{ color: "#94a3b8", marginBottom: 32, fontSize: "0.95rem", maxWidth: 600 }}>
                        Ingest PDF, Markdown, or Text documents into the <strong>{companyId}</strong> vector store.
                    </p>

                    <div style={{ display: "flex", gap: 32, alignItems: "stretch", flexWrap: "wrap" }}>
                        <div
                            className="upload-zone"
                            style={{
                                flex: 1,
                                minWidth: 300,
                                padding: 40,
                                textAlign: "center",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                border: isDragging ? "2px solid #3b82f6" : "2px dashed rgba(255,255,255,0.15)",
                                background: isDragging ? "rgba(59, 130, 246, 0.1)" : "rgba(255,255,255,0.02)",
                                transition: "all 0.3s ease",
                                cursor: "pointer",
                                borderRadius: 16,
                                position: "relative",
                                overflow: "hidden",
                                backdropFilter: "blur(10px)"
                            }}
                            onClick={() => document.getElementById("file-upload")?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
                                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = isDragging ? "#3b82f6" : "rgba(255,255,255,0.15)";
                                e.currentTarget.style.background = isDragging ? "rgba(59, 130, 246, 0.1)" : "rgba(255,255,255,0.02)";
                            }}
                        >
                            <input
                                type="file"
                                id="file-upload"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                style={{ display: "none" }}
                                accept=".pdf,.txt,.md"
                            />
                            {selectedFile ? (
                                <div style={{ animation: "fadeIn 0.3s ease" }}>
                                    <div style={{ fontSize: "4rem", marginBottom: 16, filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))" }}>
                                        {getFileIcon(selectedFile.name)}
                                    </div>
                                    <div style={{ fontWeight: 700, color: "#60a5fa", fontSize: "1.1rem" }}>{selectedFile.name}</div>
                                    <div style={{ fontSize: "0.9rem", color: "#64748b", marginTop: 6, fontFamily: "monospace" }}>
                                        {(selectedFile.size / 1024).toFixed(1)} KB
                                    </div>
                                    <div style={{
                                        marginTop: 16,
                                        padding: "8px 16px",
                                        background: "rgba(16, 185, 129, 0.15)",
                                        border: "1px solid rgba(16, 185, 129, 0.3)",
                                        borderRadius: 99,
                                        color: "#34d399",
                                        fontSize: "0.85rem",
                                        fontWeight: 600
                                    }}>
                                        ✓ Ready to Upload
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div style={{
                                        fontSize: "4rem",
                                        marginBottom: 20,
                                        opacity: isDragging ? 1 : 0.8,
                                        transform: isDragging ? "scale(1.1)" : "scale(1)",
                                        transition: "all 0.3s ease",
                                        filter: "brightness(0) invert(1) opacity(0.5)"
                                    }}>
                                        {isDragging ? "📂" : "☁️"}
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: 8 }}>
                                        {isDragging ? "Drop File Here" : "Click to Upload"}
                                    </div>
                                    <div style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
                                        PDF, Markdown, or Text files
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ flex: 1, minWidth: 250, display: "flex", flexDirection: "column", gap: 24 }}>
                            <div className="admin-input-wrapper">
                                <label style={{ display: "block", marginBottom: 10, fontSize: "0.9rem", color: "#94a3b8", fontWeight: 600 }}>Document Category</label>
                                <select
                                    className="admin-input glass-btn"
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value)}
                                    style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "16px",
                                        borderRadius: 12,
                                        color: "white",
                                        fontSize: "1rem",
                                        cursor: "pointer",
                                        appearance: "none",
                                        backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
                                        backgroundRepeat: "no-repeat",
                                        backgroundPosition: "right 16px center",
                                        backgroundSize: "16px"
                                    }}
                                >
                                    <option value="general" style={{ background: "#1a1a1a" }}>📚 General Knowledge</option>
                                    <option value="policy" style={{ background: "#1a1a1a" }}>📋 Policy Document</option>
                                    <option value="technical" style={{ background: "#1a1a1a" }}>⚙️ Technical Specification</option>
                                    <option value="hr" style={{ background: "#1a1a1a" }}>👥 HR & Compliance</option>
                                </select>
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || uploading}
                                style={{
                                    flex: 1,
                                    width: "100%",
                                    marginTop: "auto",
                                    padding: "20px",
                                    background: !selectedFile || uploading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                                    color: !selectedFile || uploading ? "#64748b" : "white",
                                    border: !selectedFile || uploading ? "1px solid rgba(255,255,255,0.05)" : "none",
                                    borderRadius: 16,
                                    fontWeight: 700,
                                    fontSize: "1rem",
                                    cursor: !selectedFile || uploading ? "not-allowed" : "pointer",
                                    transition: "all 0.3s",
                                    boxShadow: !selectedFile || uploading ? "none" : "0 8px 30px rgba(37, 99, 235, 0.4)",
                                    opacity: !selectedFile || uploading ? 0.7 : 1
                                }}
                                className={!selectedFile || uploading ? "" : "hover-glow-blue"}
                            >
                                {uploading ? "⏳ Processing..." : "🚀 Upload Document"}
                            </button>
                        </div>
                    </div>

                    {uploading && (
                        <div style={{ marginTop: 32 }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 12
                            }}>
                                <span style={{ fontSize: "0.9rem", color: "#94a3b8", fontWeight: 600 }}>
                                    Uploading & Processing
                                </span>
                                <span style={{ fontSize: "0.9rem", color: "#60a5fa", fontWeight: 700 }}>
                                    {uploadProgress}%
                                </span>
                            </div>
                            <div style={{
                                height: 8,
                                background: "rgba(255,255,255,0.05)",
                                borderRadius: 99,
                                overflow: "hidden",
                                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)"
                            }}>
                                <div style={{
                                    height: "100%",
                                    width: `${uploadProgress}%`,
                                    background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)",
                                    backgroundSize: "200% 100%",
                                    animation: "shimmer 2s infinite linear",
                                    transition: "width 0.3s ease",
                                    borderRadius: 99,
                                    boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)"
                                }} />
                            </div>
                            <style>{`
                                @keyframes shimmer {
                                    0% { background-position: 200% 0; }
                                    100% { background-position: -200% 0; }
                                }
                                @keyframes fadeIn {
                                    from { opacity: 0; transform: scale(0.95); }
                                    to { opacity: 1; transform: scale(1); }
                                }
                            `}</style>
                        </div>
                    )}
                </section>

                {/* Section 2: Document List */}
                <section className="glass-card" style={{ padding: 32 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: "1.5rem" }}>📚</span> Repository Index
                            <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 400, background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: 99 }}>
                                {documents.length} files
                            </span>
                        </h3>
                        <button onClick={loadDocuments} className="glass-btn" style={{ padding: "10px 16px", borderRadius: 8, color: "#60a5fa", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6 }}>
                            <span>↻</span> Refresh List
                        </button>
                    </div>

                    {documents.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 80, color: "#64748b", border: "2px dashed rgba(255,255,255,0.05)", borderRadius: 16 }}>
                            <div style={{ fontSize: "3rem", marginBottom: 16, opacity: 0.3, filter: "grayscale(1)" }}>📭</div>
                            <div style={{ fontSize: "1.1rem", marginBottom: 8, color: "#94a3b8" }}>No documents found</div>
                            <div style={{ fontSize: "0.9rem", opacity: 0.7 }}>Documents uploaded here will be visible to your company's chatbot.</div>
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: "left", padding: "12px 20px", color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1 }}>Filename</th>
                                        <th style={{ textAlign: "left", padding: "12px 20px", color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1 }}>Category</th>
                                        <th style={{ textAlign: "left", padding: "12px 20px", color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1 }}>Status</th>
                                        <th style={{ textAlign: "left", padding: "12px 20px", color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1 }}>Date</th>
                                        <th style={{ textAlign: "right", padding: "12px 20px", color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1 }}>Chunks</th>
                                        <th style={{ textAlign: "right", padding: "12px 20px", color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1 }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documents.map((doc: Document) => (
                                        <tr key={doc._id} style={{ background: "rgba(255,255,255,0.02)", transition: "all 0.2s" }} className="glass-btn">
                                            <td style={{ padding: "16px 20px", borderRadius: "12px 0 0 12px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                                    <span style={{ fontSize: "1.8rem", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" }}>{getFileIcon(doc.filename)}</span>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: "white", fontSize: "0.95rem" }}>{doc.filename}</div>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4, fontFamily: "monospace", opacity: 0.7 }}>ID: {doc._id.substring(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "16px 20px" }}>
                                                <span style={{
                                                    padding: "6px 12px",
                                                    borderRadius: 8,
                                                    background: "rgba(255,255,255,0.05)",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    fontSize: "0.8rem",
                                                    textTransform: "capitalize",
                                                    color: "#cbd5e1"
                                                }}>
                                                    {doc.doc_type}
                                                </span>
                                            </td>
                                            <td style={{ padding: "16px 20px" }}>
                                                <span style={{
                                                    color: doc.status === "indexed" ? "#34d399" : "#fbbf24",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    fontSize: "0.9rem",
                                                    fontWeight: 500,
                                                    background: doc.status === "indexed" ? "rgba(52, 211, 153, 0.1)" : "rgba(251, 191, 36, 0.1)",
                                                    padding: "6px 12px",
                                                    borderRadius: 99,
                                                    width: "fit-content"
                                                }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor", boxShadow: `0 0 8px ${doc.status === "indexed" ? "#34d399" : "#fbbf24"}` }} />
                                                    {doc.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: "16px 20px", color: "#94a3b8", fontSize: "0.9rem" }}>
                                                {new Date(doc.uploaded_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: "16px 20px", color: "#94a3b8", textAlign: "right", fontFamily: "monospace", fontSize: "1rem" }}>
                                                {doc.chunk_count}
                                            </td>
                                            <td style={{ padding: "16px 20px", textAlign: "right", borderRadius: "0 12px 12px 0" }}>
                                                <button
                                                    onClick={() => handleDelete(doc._id, doc.filename)}
                                                    className="glass-btn"
                                                    style={{ padding: "8px 12px", borderRadius: 8, color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.05)" }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
