import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminAuth } from "../components/AdminAuth";
import {
    uploadDocument, listDocuments, deleteDocument, Document as AdminDocument,
    listApiKeys, generateApiKey, revokeApiKey, ApiKey
} from "../api/admin";
import {
    Lock,
    Upload,
    FileText,
    File,
    Check,
    CloudUpload,
    FolderOpen,
    Inbox,
    Loader2,
    RefreshCw,
    Trash2,
    FileCode,
    Database,
    Key,
    Copy,
    Shield,
    Plus,
    X
} from "lucide-react";

export function AdminPanel() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [companyId, setCompanyId] = useState(""); // Store logged-in company
    const [documents, setDocuments] = useState<AdminDocument[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [docType, setDocType] = useState("general");
    const [isDragging, setIsDragging] = useState(false);

    // API Key State
    const [activeTab, setActiveTab] = useState<'documents' | 'api-keys'>('documents');
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [generatedKey, setGeneratedKey] = useState<{ key: string, name: string } | null>(null);
    const [newKeyName, setNewKeyName] = useState("");
    const [showKeyModal, setShowKeyModal] = useState(false);

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
            if (activeTab === 'documents') {
                loadDocuments();
            } else if (activeTab === 'api-keys') {
                loadApiKeys();
            }
        }
    }, [isAuthenticated, activeTab]);

    const loadApiKeys = async () => {
        if (!companyId) return;
        try {
            const data = await listApiKeys(companyId);
            setApiKeys(data.keys);
        } catch (error) {
            console.error("Failed to load API keys:", error);
        }
    };

    const handleGenerateKey = async () => {
        if (!newKeyName.trim()) {
            alert("Please enter a name for the key");
            return;
        }
        try {
            const data = await generateApiKey(companyId, newKeyName);
            setGeneratedKey({ key: data.key, name: newKeyName });
            setNewKeyName("");
            setShowKeyModal(true);
            loadApiKeys();
        } catch (error) {
            alert("Failed to generate key: " + error);
        }
    };

    const handleRevokeKey = async (keyId: string) => {
        if (!window.confirm("Are you sure you want to revoke this API key? This cannot be undone.")) return;
        try {
            await revokeApiKey(companyId, keyId);
            loadApiKeys();
        } catch (error) {
            alert("Failed to revoke key: " + error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

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
            case 'pdf': return <FileText size={48} className="text-red-400" color="#f87171" />; // Red for PDF
            case 'md': return <FileCode size={48} className="text-blue-400" color="#60a5fa" />; // Blue for Markdown
            case 'txt': return <File size={48} className="text-gray-400" color="#9ca3af" />; // Gray for Text
            default: return <File size={48} className="text-gray-400" color="#9ca3af" />;
        }
    };

    const getSmallFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return <FileText size={20} color="#f87171" />;
            case 'md': return <FileCode size={20} color="#60a5fa" />;
            case 'txt': return <File size={20} color="#9ca3af" />;
            default: return <File size={20} color="#9ca3af" />;
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
                    <div className="admin-lock-icon" style={{ fontSize: "1.5rem", marginBottom: 0, display: 'flex', alignItems: 'center' }}>
                        <Lock size={24} color="#60a5fa" />
                    </div>
                    <h2 className="admin-title" style={{ fontSize: "1.2rem", margin: 0 }}>
                        CORPWISE <span style={{ opacity: 0.5, fontWeight: 400 }}>Admin Portal</span>
                    </h2>
                </div>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    <div className="status-badge-desktop glass-panel" style={{ color: "#60a5fa", borderColor: "rgba(59, 130, 246, 0.2)", padding: "8px 16px", borderRadius: 99, background: "rgba(59, 130, 246, 0.05)" }}>
                        Workspace: <span style={{ fontWeight: 600, color: "white" }}>{companyId}</span>
                    </div>
                    <button
                        onClick={() => navigate("/")}
                        className="glass-btn hover-glow-blue"
                        style={{
                            padding: "10px 20px",
                            borderRadius: 12,
                            color: "white",
                            cursor: "pointer",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            fontSize: "0.9rem",
                            fontWeight: 500
                        }}
                    >
                        ← Back to Home
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', minHeight: 'calc(100vh - 73px)' }}>
                {/* Sidebar Navigation */}
                <aside style={{
                    width: 280,
                    background: "rgba(5, 5, 7, 0.4)",
                    borderRight: "1px solid rgba(255,255,255,0.08)",
                    padding: "32px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    position: "sticky",
                    top: 73,
                    height: "calc(100vh - 73px)"
                }}>
                    <div style={{
                        padding: "0 16px 16px 16px",
                        marginBottom: 16,
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        color: "#64748b",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase"
                    }}>
                        Management
                    </div>

                    <button
                        onClick={() => setActiveTab('documents')}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "12px 16px",
                            borderRadius: 12,
                            background: activeTab === 'documents' ? "rgba(59, 130, 246, 0.1)" : "transparent",
                            color: activeTab === 'documents' ? "#60a5fa" : "#94a3b8",
                            border: "1px solid",
                            borderColor: activeTab === 'documents' ? "rgba(59, 130, 246, 0.2)" : "transparent",
                            fontSize: "0.95rem",
                            fontWeight: activeTab === 'documents' ? 600 : 500,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            textAlign: "left"
                        }}
                        onMouseEnter={(e) => {
                            if (activeTab !== 'documents') {
                                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                                e.currentTarget.style.color = "#cbd5e1";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeTab !== 'documents') {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "#94a3b8";
                            }
                        }}
                    >
                        <FileText size={20} /> Documents
                    </button>

                    <button
                        onClick={() => setActiveTab('api-keys')}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "12px 16px",
                            borderRadius: 12,
                            background: activeTab === 'api-keys' ? "rgba(59, 130, 246, 0.1)" : "transparent",
                            color: activeTab === 'api-keys' ? "#60a5fa" : "#94a3b8",
                            border: "1px solid",
                            borderColor: activeTab === 'api-keys' ? "rgba(59, 130, 246, 0.2)" : "transparent",
                            fontSize: "0.95rem",
                            fontWeight: activeTab === 'api-keys' ? 600 : 500,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            textAlign: "left"
                        }}
                        onMouseEnter={(e) => {
                            if (activeTab !== 'api-keys') {
                                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                                e.currentTarget.style.color = "#cbd5e1";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeTab !== 'api-keys') {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "#94a3b8";
                            }
                        }}
                    >
                        <Key size={20} /> API Keys
                    </button>
                </aside>

                <main className="admin-content" style={{ flex: 1, padding: "40px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>

                    {activeTab === 'documents' && (
                        <>
                            {/* Section 1: Upload */}
                            <section className="glass-card" style={{ padding: 32, marginBottom: 32 }}>
                                <h3 style={{ fontSize: "1.25rem", marginBottom: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                                    <Upload size={24} color="#60a5fa" /> Upload Knowledge
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
                                            <div style={{ animation: "fadeIn 0.3s ease", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{ marginBottom: 16, filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))" }}>
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
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8
                                                }}>
                                                    <Check size={16} /> Ready to Upload
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{
                                                    marginBottom: 20,
                                                    opacity: isDragging ? 1 : 0.8,
                                                    transform: isDragging ? "scale(1.1)" : "scale(1)",
                                                    transition: "all 0.3s ease",
                                                    color: isDragging ? "#3b82f6" : "#64748b"
                                                }}>
                                                    {isDragging ? <FolderOpen size={64} /> : <CloudUpload size={64} />}
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
                                                <option value="general" style={{ background: "#1a1a1a" }}>General Knowledge</option>
                                                <option value="policy" style={{ background: "#1a1a1a" }}>Policy Document</option>
                                                <option value="technical" style={{ background: "#1a1a1a" }}>Technical Specification</option>
                                                <option value="hr" style={{ background: "#1a1a1a" }}>HR & Compliance</option>
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
                                                opacity: !selectedFile || uploading ? 0.7 : 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 10
                                            }}
                                            className={!selectedFile || uploading ? "" : "hover-glow-blue"}
                                        >
                                            {uploading ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={20} /> Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={20} /> Upload Document
                                                </>
                                            )}
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
                                        <Database size={24} color="#60a5fa" /> Repository Index
                                        <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 400, background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: 99 }}>
                                            {documents.length} files
                                        </span>
                                    </h3>
                                    <button onClick={loadDocuments} className="glass-btn" style={{ padding: "10px 16px", borderRadius: 8, color: "#60a5fa", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6 }}>
                                        <RefreshCw size={16} /> Refresh List
                                    </button>
                                </div>

                                {documents.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: 80, color: "#64748b", border: "2px dashed rgba(255,255,255,0.05)", borderRadius: 16 }}>
                                        <div style={{ marginBottom: 16, opacity: 0.3, display: 'flex', justifyContent: 'center' }}>
                                            <Inbox size={64} />
                                        </div>
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
                                                {documents.map((doc: AdminDocument) => (
                                                    <tr key={doc._id} style={{ background: "rgba(255,255,255,0.02)", transition: "all 0.2s" }} className="glass-btn">
                                                        <td style={{ padding: "16px 20px", borderRadius: "12px 0 0 12px" }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                                                <span style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" }}>{getSmallFileIcon(doc.filename)}</span>
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
                                                                style={{ padding: "8px 12px", borderRadius: 8, color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.05)", display: "flex", alignItems: "center", gap: 6 }}
                                                            >
                                                                <Trash2 size={16} /> Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        </>
                    )}

                    {activeTab === 'api-keys' && (
                        <section className="glass-card" style={{ padding: 32 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                                <div>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                                        <Shield size={24} color="#60a5fa" /> API Access Management
                                    </h3>
                                    <p style={{ color: "#94a3b8", marginTop: 8, fontSize: "0.95rem" }}>
                                        Manage API keys for accessing the CORPWISE platform programmatically.
                                    </p>
                                </div>
                            </div>

                            {/* Generate New Key */}
                            <div style={{ background: "rgba(255,255,255,0.02)", padding: 24, borderRadius: 16, marginBottom: 32, border: "1px solid rgba(255,255,255,0.05)" }}>
                                <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>Create New API Key</h4>
                                <div style={{ display: "flex", gap: 16, alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        placeholder="Key Name (e.g. Production App)"
                                        value={newKeyName}
                                        onChange={(e) => setNewKeyName(e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: "12px 16px",
                                            borderRadius: 12,
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            background: "rgba(0,0,0,0.2)",
                                            color: "white",
                                            fontSize: "0.95rem"
                                        }}
                                    />
                                    <button
                                        onClick={handleGenerateKey}
                                        className="glass-btn hover-glow-blue"
                                        style={{
                                            padding: "12px 24px",
                                            borderRadius: 12,
                                            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                                            color: "white",
                                            fontWeight: 600,
                                            border: "none",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: 'center',
                                            gap: 8
                                        }}
                                    >
                                        <Plus size={18} /> Generate Key
                                    </button>
                                </div>
                            </div>

                            {/* Key List */}
                            <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>Active Keys</h4>
                            {apiKeys.length === 0 ? (
                                <div style={{ textAlign: "center", padding: 40, color: "#64748b", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12 }}>
                                    No API keys found. Generate one to get started.
                                </div>
                            ) : (
                                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: "left", padding: "12px", color: "#64748b", fontSize: "0.85rem" }}>Name</th>
                                            <th style={{ textAlign: "left", padding: "12px", color: "#64748b", fontSize: "0.85rem" }}>Prefix</th>
                                            <th style={{ textAlign: "left", padding: "12px", color: "#64748b", fontSize: "0.85rem" }}>Created</th>
                                            <th style={{ textAlign: "right", padding: "12px", color: "#64748b", fontSize: "0.85rem" }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {apiKeys.map(key => (
                                            <tr key={key.key_id} style={{ background: "rgba(255,255,255,0.02)" }}>
                                                <td style={{ padding: "16px", borderRadius: "8px 0 0 8px", fontWeight: 500, color: "white" }}>{key.name}</td>
                                                <td style={{ padding: "16px", fontFamily: "monospace", color: "#9ca3af" }}>{key.prefix}••••••••</td>
                                                <td style={{ padding: "16px", color: "#94a3b8", fontSize: "0.9rem" }}>{new Date(key.created_at).toLocaleDateString()}</td>
                                                <td style={{ padding: "16px", textAlign: "right", borderRadius: "0 8px 8px 0" }}>
                                                    <button
                                                        onClick={() => handleRevokeKey(key.key_id)}
                                                        className="glass-btn"
                                                        style={{
                                                            padding: "8px 12px",
                                                            borderRadius: 8,
                                                            color: "#ef4444",
                                                            border: "1px solid rgba(239, 68, 68, 0.2)",
                                                            background: "rgba(239, 68, 68, 0.05)",
                                                            cursor: "pointer",
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 6
                                                        }}
                                                    >
                                                        <Trash2 size={16} /> Revoke
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </section>
                    )}
                </main>
            </div>

            {/* New Key Modal */}
            {showKeyModal && generatedKey && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20
                }}>
                    <div style={{
                        background: '#1a1a1a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 16,
                        padding: 32,
                        maxWidth: 500,
                        width: '100%',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>API Key Generated</h3>
                            <button onClick={() => setShowKeyModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', padding: 16, borderRadius: 8, marginBottom: 24, color: '#facc15', fontSize: '0.9rem' }}>
                            <strong>Important:</strong> Copy this key now. You won't be able to see it again!
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.9rem', marginBottom: 8 }}>Your API Key</label>
                            <div style={{
                                display: 'flex',
                                background: 'black',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 8,
                                padding: 4,
                                alignItems: 'center'
                            }}>
                                <code style={{ flex: 1, padding: 12, color: '#60a5fa', fontFamily: 'monospace', fontSize: '1rem', overflowX: 'auto' }}>
                                    {generatedKey.key}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(generatedKey.key)}
                                    style={{
                                        padding: 12,
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        borderRadius: 6,
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}
                                >
                                    <Copy size={16} /> Copy
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowKeyModal(false)}
                            style={{
                                width: '100%',
                                padding: 14,
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: 12,
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
