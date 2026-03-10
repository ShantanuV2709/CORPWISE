import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// Authentication handled by DashboardLayout
import {
    uploadDocument, listDocuments, deleteDocument, Document as AdminDocument,
    listApiKeys, generateApiKey, revokeApiKey, ApiKey, debugSearch,
    listConversations, getConversationDetails, ConversationSummary, ConversationDetail,
    getSubscription, SubscriptionDetails
} from "../api/admin";
import { fetchSubscriptionTiers, updateSubscriptionTier, type SubscriptionTier } from "../../onboarding/api/subscription";
import { PremiumTierCard } from "../../onboarding/components/PremiumTierCard";
import { SkeletonLoader } from "../../../components/SkeletonLoader";
import { OnboardingStepper } from "../../onboarding/components/OnboardingStepper";
import toast from 'react-hot-toast';
import CustomUploadBtn from '../../../components/custom/CustomUploadBtn';
import CustomCategorySelect from '../../../components/custom/CustomCategorySelect';
import CustomUpgradeBtn from '../../../components/custom/CustomUpgradeBtn';
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
    Search,
    X,
    MessageSquare,
    History,
    Sparkles,
    Users,
    CreditCard,
    Zap,
    Lightbulb
} from "lucide-react";

export function AdminPanel() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [companyId, setCompanyId] = useState(""); // Store logged-in company
    const [documents, setDocuments] = useState<AdminDocument[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [docType, setDocType] = useState("general");
    const [isDragging, setIsDragging] = useState(false);

    const location = useLocation();
    const activeRoute = location.pathname.split('/').pop() || '';
    const searchParams = new URLSearchParams(location.search);
    const urlSearchQuery = searchParams.get('q') || '';

    // Map Dashboard routes to AdminPanel internal names
    const activeTab =
        activeRoute === 'apikeys' ? 'api-keys' :
            activeRoute === 'logs' ? 'chat-history' :
                activeRoute === 'search-debug' ? 'search-debug' :
                    activeRoute === 'billing' ? 'billing' :
                        activeRoute === 'overview' ? 'overview' : 'documents';

    // Pre-fill search from URL query param if coming from header search bar
    React.useEffect(() => {
        if (activeTab === 'search-debug' && urlSearchQuery) {
            setSearchQuery(urlSearchQuery);
        }
    }, [activeTab, urlSearchQuery]);

    // API Key State
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loadingKeys, setLoadingKeys] = useState(true);
    const [generatedKey, setGeneratedKey] = useState<{ key: string, name: string } | null>(null);
    const [newKeyName, setNewKeyName] = useState("");
    const [showKeyModal, setShowKeyModal] = useState(false);

    // Search Debug State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // Subscription State (for Overview tab)
    const [currentSub, setCurrentSub] = useState<SubscriptionDetails | null>(null);
    const [loadingOverview, setLoadingOverview] = useState(false);
    const [tiers, setTiers] = useState<Record<string, SubscriptionTier>>({});

    // Chat History State
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [chatPage, setChatPage] = useState(1);
    const [totalChats, setTotalChats] = useState(0);
    const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
    const [chatLoading, setChatLoading] = useState(false);

    // Billing tab state
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [recommendedTier, setRecommendedTier] = useState<string | null>(null);
    const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
    const [tierUpdating, setTierUpdating] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

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
            } else if (activeTab === 'chat-history') {
                loadConversations();
            } else if (activeTab === 'overview' || activeTab === 'billing') {
                loadOverview();
            }
        }
    }, [isAuthenticated, activeTab]);

    const loadOverview = async () => {
        if (!companyId) return;
        setLoadingOverview(true);
        try {
            const [subData, tiersData, keysData] = await Promise.all([
                getSubscription(companyId),
                fetchSubscriptionTiers(),
                listApiKeys(companyId)
            ]);
            setCurrentSub(subData);
            setTiers(tiersData.tiers);
            setApiKeys(keysData.keys);
        } catch (err) {
            console.error('Failed to load overview:', err);
        } finally {
            setLoadingOverview(false);
        }
    };

    const loadApiKeys = async () => {
        if (!companyId) return;
        setLoadingKeys(true);
        try {
            const data = await listApiKeys(companyId);
            setApiKeys(data.keys);
        } catch (error) {
            console.error("Failed to load API keys:", error);
        } finally {
            setLoadingKeys(false);
        }
    };

    const handleGenerateKey = async () => {
        if (!newKeyName.trim()) {
            toast.error("Please enter a name for the key");
            return;
        }
        try {
            const data = await generateApiKey(companyId, newKeyName);
            setGeneratedKey({ key: data.key, name: newKeyName });
            setNewKeyName("");
            setShowKeyModal(true);
            loadApiKeys();
            toast.success("API Key generated successfully");
        } catch (error) {
            toast.error("Failed to generate key: " + error);
        }
    };

    const handleRevokeKey = async (keyId: string) => {
        if (!window.confirm("Are you sure you want to revoke this API key? This cannot be undone.")) return;
        try {
            await revokeApiKey(companyId, keyId);
            loadApiKeys();
            toast.success("API Key revoked");
        } catch (error) {
            toast.error("Failed to revoke key: " + error);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearchLoading(true);
        try {
            const data = await debugSearch(companyId, searchQuery);
            setSearchResults(data.results);
        } catch (error) {
            toast.error("Search failed: " + error);
        } finally {
            setSearchLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    const loadDocuments = async () => {
        if (!companyId) return;
        setLoadingDocs(true);
        try {
            const data = await listDocuments(companyId);
            setDocuments(data.documents);
        } catch (error) {
            console.error("Failed to load documents:", error);
        } finally {
            setLoadingDocs(false);
        }
    };

    const loadConversations = async () => {
        if (!companyId) return;
        setChatLoading(true);
        try {
            const data = await listConversations(companyId, chatPage, 20);
            setConversations(data.conversations);
            setTotalChats(data.total);
        } catch (error) {
            console.error("Failed to load conversations:", error);
        } finally {
            setChatLoading(false);
        }
    };

    const handleViewConversation = async (convoId: string) => {
        try {
            const details = await getConversationDetails(companyId, convoId);
            setSelectedConversation(details);
        } catch (error) {
            toast.error("Failed to load details: " + error);
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
            toast.success(`Document uploaded successfully for ${companyId}!`);
        } catch (error) {
            clearInterval(progressInterval);
            toast.error("Upload failed: " + error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId: string, filename: string) => {
        if (!window.confirm(`Delete "${filename}"?`)) return;

        try {
            await deleteDocument(docId, companyId);
            await loadDocuments();
            toast.success("Document deleted successfully!");
        } catch (error) {
            toast.error("Delete failed: " + error);
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
                toast.error('Please upload only PDF, MD, or TXT files');
            }
        }
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return <FileText size={48} className="text-red-400" color="#f87171" />; // Red for PDF
            case 'md': return <FileCode size={48} className="text-blue-400" color="rgba(255,255,255,0.75)" />; // Blue for Markdown
            case 'txt': return <File size={48} className="text-gray-400" color="#9ca3af" />; // Gray for Text
            default: return <File size={48} className="text-gray-400" color="#9ca3af" />;
        }
    };

    const getSmallFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return <FileText size={20} color="#f87171" />;
            case 'md': return <FileCode size={20} color="rgba(255,255,255,0.75)" />;
            case 'txt': return <File size={20} color="#9ca3af" />;
            default: return <File size={20} color="#9ca3af" />;
        }
    };

    // Admin authentication is now handled by the parent DashboardLayout component.
    // The companyId is guaranteed to be in localStorage by the time this mounts.

    // Enhanced Admin UI without sidebar (provided by DashboardLayout)
    return (
        <>
            <main className="admin-content" style={{ flex: 1, padding: "0 0", width: "100%", maxWidth: "100%", margin: 0 }}>

                {activeTab === 'overview' && (
                    <div style={{ padding: 0, animation: 'slideUp 0.4s easeOut' }}>
                        {/* Header */}
                        <div style={{ marginBottom: 24 }}>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>Current Plan</h2>
                        </div>

                        {loadingOverview ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <SkeletonLoader height="400px" borderRadius="16px" />
                                <SkeletonLoader height="400px" borderRadius="16px" />
                            </div>
                        ) : currentSub ? (
                            <div style={{
                                background: '#111111',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: 20,
                                padding: 48,
                                display: 'grid',
                                gridTemplateColumns: 'minmax(350px, 450px) 1fr',
                                gap: 64,
                                alignItems: 'start',
                                position: 'relative',
                                overflow: 'hidden',
                                width: '100%'
                            }}>
                                {/* Subtle background texture */}
                                <div style={{ position: 'absolute', top: 0, left: '20%', width: '60%', height: '100%', background: 'radial-gradient(ellipse at top, rgba(255, 255, 255, 0.03), transparent 70%)', pointerEvents: 'none' }} />

                                {/* Left: Current Tier Card */}
                                <div style={{ zIndex: 1, width: '100%', maxWidth: 340, margin: '0 auto' }}>
                                    {tiers[currentSub.subscription_tier] && (
                                        <PremiumTierCard
                                            tierId={currentSub.subscription_tier}
                                            tierName={tiers[currentSub.subscription_tier].name}
                                            price={tiers[currentSub.subscription_tier].price_display}
                                            description={tiers[currentSub.subscription_tier].description}
                                            isCurrent={true}
                                            features={[
                                                {
                                                    text: tiers[currentSub.subscription_tier].max_documents === -1
                                                        ? 'Unlimited Documents'
                                                        : `${tiers[currentSub.subscription_tier].max_documents} Documents`,
                                                    enabled: true
                                                },
                                                {
                                                    text: tiers[currentSub.subscription_tier].max_queries_per_month === -1
                                                        ? 'Unlimited Queries'
                                                        : `${tiers[currentSub.subscription_tier].max_queries_per_month.toLocaleString()} Queries/month`,
                                                    enabled: true
                                                },
                                                { text: 'Advanced Analytics', enabled: tiers[currentSub.subscription_tier].analytics_enabled },
                                                { text: 'Custom Branding', enabled: tiers[currentSub.subscription_tier].custom_branding },
                                                { text: 'Priority Support', enabled: currentSub.subscription_tier === 'enterprise' },
                                            ]}
                                        />
                                    )}
                                    {/* Upgrade Plan button */}
                                    <div style={{ marginTop: 16 }}>
                                        <CustomUpgradeBtn onClick={() => navigate('/admin/billing')} />
                                    </div>
                                </div>

                                {/* Right: Usage Stats */}
                                <div style={{ zIndex: 1, padding: '16px 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                        <Sparkles size={22} color="#fbbf24" />
                                        <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'white' }}>Usage Statistics</span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                        {/* Documents */}
                                        <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: '0.95rem' }}>
                                                    <FileText size={18} /> <span>Documents</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.95rem' }}>
                                                    <span style={{ color: 'white' }}>{currentSub.usage.documents_count}</span>
                                                    <span style={{ color: '#64748b' }}>/ {tiers[currentSub.subscription_tier]?.max_documents === -1 ? '8' : tiers[currentSub.subscription_tier]?.max_documents}</span>
                                                </div>
                                            </div>
                                            {tiers[currentSub.subscription_tier]?.max_documents !== -1 && (
                                                <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${Math.min(100, (currentSub.usage.documents_count / (tiers[currentSub.subscription_tier]?.max_documents || 1)) * 100)}%`,
                                                        background: '#6366f1',
                                                        borderRadius: 3
                                                    }} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Queries */}
                                        <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: '0.95rem' }}>
                                                    <Search size={18} /> <span>Monthly Queries</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.95rem' }}>
                                                    <span style={{ color: 'white' }}>{currentSub.usage.queries_this_month}</span>
                                                    <span style={{ color: '#64748b' }}>/ {tiers[currentSub.subscription_tier]?.max_queries_per_month === -1 ? '8' : tiers[currentSub.subscription_tier]?.max_queries_per_month}</span>
                                                </div>
                                            </div>
                                            {tiers[currentSub.subscription_tier]?.max_queries_per_month !== -1 && (
                                                <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${Math.min(100, (currentSub.usage.queries_this_month / (tiers[currentSub.subscription_tier]?.max_queries_per_month || 1)) * 100)}%`,
                                                        background: '#10b981',
                                                        borderRadius: 3
                                                    }} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Storage */}
                                        <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: '0.95rem' }}>
                                                    <Database size={18} /> <span>Storage Used</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.95rem' }}>
                                                    <span style={{ color: 'white' }}>{currentSub.usage.storage_used_bytes ? (currentSub.usage.storage_used_bytes / 1024).toFixed(2) : 0} KB</span>
                                                </div>
                                            </div>
                                            <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${Math.min(((currentSub.usage.storage_used_bytes || 0) / (1024 * 1024 * 100)) * 100, 100)}%`,
                                                    background: '#a78bfa',
                                                    borderRadius: 3
                                                }} />
                                            </div>
                                        </div>

                                        {/* API Keys */}
                                        <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: '0.95rem' }}>
                                                    <Key size={18} /> <span>Active API Keys</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.95rem' }}>
                                                    <span style={{ color: 'white' }}>{apiKeys.filter(k => k.status === 'active').length}</span>
                                                    <span style={{ color: '#64748b' }}>/ {currentSub.usage.max_api_keys === -1 ? '8' : (currentSub.usage.max_api_keys || 20)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Team Seats */}
                                        <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: '0.95rem' }}>
                                                    <Users size={18} /> <span>Team Seats</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.95rem' }}>
                                                    <span style={{ color: 'white' }}>{currentSub.usage.team_members || 1}</span>
                                                    <span style={{ color: '#64748b' }}>/ {currentSub.usage.max_team_members === -1 ? '8' : (currentSub.usage.max_team_members || 200)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tech Specs */}
                                    {currentSub.tech_specs && (
                                        <div style={{ marginTop: 32 }}>
                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                                                POWERING YOUR AI
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>Model Precision</div>
                                                    <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>{currentSub.tech_specs.vector_dimensions}-dim</div>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>Analytics</div>
                                                    <div style={{ color: currentSub.tech_specs.analytics_enabled ? '#10b981' : '#9ca3af', fontWeight: 600, fontSize: '0.95rem' }}>
                                                        {currentSub.tech_specs.analytics_enabled ? 'Active' : 'Disabled'}
                                                    </div>
                                                </div>
                                            </div>
                                            {currentSub.usage.renews_at && (
                                                <div style={{ marginTop: 16, fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                                                    Renews on {currentSub.usage.renews_at}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 80, color: '#64748b' }}>
                                Could not load subscription data. Please refresh...
                            </div>
                        )}
                    </div>
                )}

                {
                    activeTab === 'documents' && (
                        <>
                            {/* Section 1: Upload */}
                            <section className="glass-card" style={{ padding: 32, marginBottom: 32 }}>
                                <h3 style={{ fontSize: "1.25rem", marginBottom: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                                    <Upload size={24} color="rgba(255,255,255,0.75)" /> Upload Knowledge
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
                                            border: isDragging ? "2px solid #e2e8f0" : "2px dashed rgba(255,255,255,0.15)",
                                            background: isDragging ? "rgba(255, 255, 255, 0.1)" : "rgba(255,255,255,0.02)",
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
                                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)";
                                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = isDragging ? "#e2e8f0" : "rgba(255,255,255,0.15)";
                                            e.currentTarget.style.background = isDragging ? "rgba(255, 255, 255, 0.1)" : "rgba(255,255,255,0.02)";
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
                                                <div style={{ fontWeight: 700, color: "rgba(255,255,255,0.75)", fontSize: "1.1rem" }}>{selectedFile.name}</div>
                                                <div style={{ fontSize: "0.9rem", color: "#64748b", marginTop: 6, fontFamily: "monospace" }}>
                                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                                </div>
                                                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{
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
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                                        disabled={uploading}
                                                        style={{
                                                            padding: "8px",
                                                            background: "rgba(239, 68, 68, 0.15)",
                                                            border: "1px solid rgba(239, 68, 68, 0.3)",
                                                            borderRadius: "50%",
                                                            color: "#ef4444",
                                                            cursor: uploading ? "not-allowed" : "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            transition: "all 0.2s ease",
                                                            opacity: uploading ? 0.5 : 1
                                                        }}
                                                        title="Remove File"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{
                                                    marginBottom: 20,
                                                    opacity: isDragging ? 1 : 0.8,
                                                    transform: isDragging ? "scale(1.1)" : "scale(1)",
                                                    transition: "all 0.3s ease",
                                                    color: isDragging ? "#e2e8f0" : "#64748b"
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
                                            <CustomCategorySelect
                                                category={docType}
                                                setCategory={setDocType}
                                                disabled={!selectedFile || uploading}
                                            />
                                        </div>

                                        <CustomUploadBtn
                                            onClick={handleUpload}
                                            disabled={!selectedFile || uploading}
                                            uploading={uploading}
                                        />
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
                                            <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>
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
                                                background: "linear-gradient(90deg, #6366f1, #a78bfa, #6366f1)",
                                                backgroundSize: "200% 100%",
                                                animation: "shimmer 2s infinite linear",
                                                transition: "width 0.3s ease",
                                                borderRadius: 99,
                                                boxShadow: "0 0 10px rgba(255, 255, 255, 0.5)"
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
                                        <Database size={24} color="rgba(255,255,255,0.75)" /> Repository Index
                                        <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 400, background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: 99 }}>
                                            {documents.length} files
                                        </span>
                                    </h3>
                                    <button onClick={loadDocuments} className="glass-btn" style={{ padding: "10px 16px", borderRadius: 8, color: "rgba(255,255,255,0.75)", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6 }}>
                                        <RefreshCw size={16} /> Refresh List
                                    </button>
                                </div>

                                {loadingDocs ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {[...Array(3)].map((_, i) => (
                                            <SkeletonLoader key={i} height="80px" borderRadius="12px" />
                                        ))}
                                    </div>
                                ) : documents.length === 0 ? (
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
                                                    <th style={{ textAlign: "left", padding: "12px 20px", color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1 }}>Size</th>
                                                    <th style={{ textAlign: "left", padding: "12px 20px", color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1 }}>Vector Dim.</th>
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
                                                        <td style={{ padding: "16px 20px", color: "#94a3b8", fontSize: "0.9rem", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                                                            {doc.file_size ? (doc.file_size / 1024).toFixed(1) + " KB" : "-"}
                                                        </td>
                                                        <td style={{ padding: "16px 20px" }}>
                                                            {doc.dimensions ? (
                                                                <span style={{
                                                                    padding: "4px 8px",
                                                                    borderRadius: 6,
                                                                    fontSize: "0.75rem",
                                                                    fontWeight: 700,
                                                                    background: doc.dimensions === 1024 ? "rgba(251, 191, 36, 0.2)" :
                                                                        doc.dimensions === 768 ? "rgba(255, 255, 255, 0.2)" : "rgba(148, 163, 184, 0.2)",
                                                                    color: doc.dimensions === 1024 ? "#fbbf24" :
                                                                        doc.dimensions === 768 ? "rgba(255,255,255,0.5)" : "#94a3b8",
                                                                    border: `1px solid ${doc.dimensions === 1024 ? "rgba(251, 191, 36, 0.3)" :
                                                                        doc.dimensions === 768 ? "rgba(255, 255, 255, 0.3)" : "rgba(148, 163, 184, 0.3)"}`
                                                                }}>
                                                                    {doc.dimensions}d
                                                                </span>
                                                            ) : (
                                                                <span style={{ fontSize: "0.8rem", color: "#64748b", opacity: 0.5 }}>-</span>
                                                            )}
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
                    )
                }

                {
                    activeTab === 'api-keys' && (
                        <section style={{ width: '100%' }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                                <div>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                                        <Shield size={24} color="rgba(255,255,255,0.75)" /> API Access Management
                                    </h3>
                                    <p style={{ color: "#94a3b8", marginTop: 8, fontSize: "0.95rem" }}>
                                        Manage API keys for accessing the CORPWISE platform programmatically.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginBottom: 32 }}>
                                {/* Generate New Key */}
                                <div style={{ width: "100%", background: "rgba(255,255,255,0.02)", padding: 24, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column" }}>
                                    <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                                        <Key size={20} color="rgba(255,255,255,0.75)" /> Create New API Key
                                    </h4>
                                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: "auto" }}>
                                        <input
                                            type="text"
                                            placeholder="Key Name (e.g. Production App)"
                                            value={newKeyName}
                                            onChange={(e) => setNewKeyName(e.target.value)}
                                            style={{
                                                flex: 1,
                                                minWidth: 200,
                                                padding: "12px 16px",
                                                borderRadius: 12,
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                background: "rgba(0,0,0,0.2)",
                                                color: "white",
                                                fontSize: "0.95rem"
                                            }}
                                        />
                                        <button
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = "translateY(-2px)";
                                                e.currentTarget.style.background = "#ffffff";
                                                e.currentTarget.style.color = "#000000";
                                                e.currentTarget.style.borderColor = "#ffffff";
                                                e.currentTarget.style.boxShadow = "0 0 30px rgba(255, 255, 255, 0.6)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = "translateY(0)";
                                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                                                e.currentTarget.style.color = "#ffffff";
                                                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                                                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.2)";
                                            }}
                                            onClick={handleGenerateKey}
                                            className="glass-btn hover-glow-white"
                                            style={{
                                                padding: "12px 24px",
                                                borderRadius: 12,
                                                background: "rgba(255, 255, 255, 0.03)",
                                                color: "#ffffff",
                                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                                fontFamily: "var(--font-body)",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                fontWeight: 500,
                                                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
                                                backdropFilter: "blur(10px)",
                                                WebkitBackdropFilter: "blur(10px)",
                                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                                            }}
                                        >
                                            <Plus size={18} /> Generate Key
                                        </button>
                                    </div>
                                    {generatedKey && (
                                        <div style={{ marginTop: 24, padding: 20, background: "rgba(16, 185, 129, 0.1)", borderRadius: 12, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                                            <div style={{ color: "#34d399", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                                                <Shield size={18} /> New API Key Generated
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <code style={{ flex: 1, background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: 8, fontFamily: "monospace", color: "white", wordBreak: "break-all" }}>
                                                    {generatedKey.key}
                                                </code>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(generatedKey.key);
                                                        localStorage.setItem('corpwise_api_key', generatedKey.key);
                                                        alert("Copied & saved! The chat widget on this site will now use this key.");
                                                    }}
                                                    style={{ padding: "12px", borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "none", color: "white", cursor: "pointer" }}
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                            <p style={{ color: "#d1fae5", fontSize: "0.85rem", marginTop: 12 }}>
                                                ⚠️ Copy this key now. You won't be able to see it again!
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Global Embed Code Snippet */}
                                <div style={{ width: "100%", background: "rgba(255,255,255,0.02)", padding: 32, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                        {/* Instructions */}
                                        <div>
                                            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 10, color: "white" }}>
                                                <FileCode size={22} color="#fbbf24" /> Website Integration Code
                                            </h4>
                                            <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.6, maxWidth: "800px" }}>
                                                To add the CORPWISE AI chat widget to your website, place this code just before the closing <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4 }}>&lt;/body&gt;</code> tag on your pages. It automatically connects the widget to your company's isolated knowledge base.
                                            </p>
                                        </div>

                                        {/* Snippet Block (FULL WIDTH) */}
                                        <div style={{ position: "relative", width: "100%" }}>
                                            <pre style={{
                                                background: "rgba(0,0,0,0.6)",
                                                padding: 24,
                                                borderRadius: 12,
                                                overflowX: "auto",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                fontFamily: "monospace",
                                                fontSize: "0.9rem",
                                                color: "#e2e8f0",
                                                lineHeight: 1.6,
                                                margin: 0,
                                                width: "100%"
                                            }}>
                                                {`<!-- CORPWISE AI Search Widget Integration -->
<script>
  window.CORPWISE_COMPANY_ID = "${companyId}";
  window.CORPWISE_API_KEY = "${generatedKey ? generatedKey.key : "YOUR_API_KEY_HERE"}";
</script>
<script src="https://corpwise.app/widget.js"></script>`}
                                            </pre>
                                            <button
                                                onClick={() => {
                                                    const code = `<!-- CORPWISE AI Search Widget Integration -->\n<script>\n  window.CORPWISE_COMPANY_ID = "${companyId}";\n  window.CORPWISE_API_KEY = "${generatedKey ? generatedKey.key : "YOUR_API_KEY_HERE"}";\n</script>\n<script src="https://corpwise.app/widget.js"></script>`;
                                                    navigator.clipboard.writeText(code);
                                                    toast.success("Embed code copied to clipboard!");
                                                }}
                                                style={{
                                                    position: "absolute",
                                                    top: 16,
                                                    right: 16,
                                                    padding: "10px 16px",
                                                    borderRadius: 8,
                                                    background: "rgba(255,255,255,0.1)",
                                                    border: "none",
                                                    color: "white",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    fontSize: "0.85rem",
                                                    fontWeight: 600
                                                }}
                                                className="glass-btn hover-glow-white"
                                            >
                                                <Copy size={16} /> Copy Code
                                            </button>
                                        </div>

                                        {/* Warnings Below Snippet */}
                                        {!generatedKey && (
                                            <div style={{ background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.2)", padding: 16, borderRadius: 8, width: "100%" }}>
                                                <p style={{ color: "#fbbf24", fontSize: "0.9rem", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                                                    <span style={{ fontSize: "1.2rem" }}>⚠️</span> Generate an API key above to see your embed code populated with a real key.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* API Keys List */}
                            {loadingKeys ? (
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    {[...Array(2)].map((_, i) => (
                                        <SkeletonLoader key={i} height="120px" borderRadius="16px" />
                                    ))}
                                </div>
                            ) : apiKeys.length === 0 ? (
                                <div style={{ textAlign: "center", padding: 40, color: "#64748b", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12 }}>
                                    No API keys found. Generate one to get started.
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
                                    {apiKeys.map((key) => (
                                        <div key={key.key_id} className="glass-btn" style={{
                                            flex: '1 1 300px',
                                            padding: "24px",
                                            borderRadius: 16,
                                            border: `1px solid ${key.status === 'active' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                                            background: key.status === 'active' ? "rgba(52, 211, 153, 0.04)" : "rgba(255,255,255,0.02)",
                                            display: 'flex', flexDirection: 'column', gap: 16
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ color: "white", fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>{key.name}</div>
                                                    <div style={{ color: "#64748b", fontSize: "0.8rem", fontFamily: "monospace" }}>
                                                        {key.prefix}••••••••
                                                    </div>
                                                </div>
                                                <span style={{
                                                    fontSize: "0.75rem",
                                                    padding: "4px 10px",
                                                    borderRadius: 99,
                                                    background: key.status === "active" ? "rgba(52, 211, 153, 0.15)" : "rgba(239, 68, 68, 0.1)",
                                                    color: key.status === "active" ? "#34d399" : "#ef4444",
                                                    border: `1px solid ${key.status === "active" ? "rgba(52, 211, 153, 0.3)" : "rgba(239, 68, 68, 0.2)"}`
                                                }}>
                                                    {key.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                Created {new Date(key.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </div>
                                            <button
                                                onClick={() => handleRevokeKey(key.key_id)}
                                                className="glass-btn"
                                                style={{
                                                    padding: "8px 16px",
                                                    borderRadius: 8,
                                                    color: "#ef4444",
                                                    border: "1px solid rgba(239, 68, 68, 0.2)",
                                                    background: "rgba(239, 68, 68, 0.05)",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    fontSize: '0.85rem',
                                                    width: 'fit-content'
                                                }}
                                            >
                                                <Trash2 size={14} /> Revoke Key
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )
                }

                {
                    activeTab === 'chat-history' && (
                        <section style={{ width: '100%' }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                                <div>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                                        <MessageSquare size={24} color="rgba(255,255,255,0.5)" /> Chat Logs
                                    </h3>
                                    <p style={{ color: "#94a3b8", marginTop: 8, fontSize: "0.95rem" }}>
                                        Review user conversations to improve retrieval and answers.
                                    </p>
                                </div>
                                <button onClick={loadConversations} className="glass-btn" style={{ padding: "10px 16px", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6 }}>
                                    <RefreshCw size={16} /> Refresh
                                </button>
                            </div>

                            {chatLoading && conversations.length === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <SkeletonLoader height="40px" borderRadius="8px" />
                                    <SkeletonLoader height="60px" borderRadius="8px" />
                                    <SkeletonLoader height="60px" borderRadius="8px" />
                                    <SkeletonLoader height="60px" borderRadius="8px" />
                                </div>
                            ) : conversations.length === 0 ? (
                                <div style={{ textAlign: "center", padding: 80, color: "#64748b", border: "2px dashed rgba(255,255,255,0.05)", borderRadius: 16 }}>
                                    <div style={{ marginBottom: 16, opacity: 0.3, display: 'flex', justifyContent: 'center' }}>
                                        <History size={64} />
                                    </div>
                                    <div style={{ fontSize: "1.1rem", marginBottom: 8, color: "#94a3b8" }}>No conversations yet</div>
                                    <div style={{ fontSize: "0.9rem", opacity: 0.7 }}>Start chatting with the bot to see logs here.</div>
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: "left", padding: "12px", color: "#64748b", fontSize: "0.85rem" }}>Conversation</th>
                                                <th style={{ textAlign: "center", padding: "12px", color: "#64748b", fontSize: "0.85rem" }}>Msgs</th>
                                                <th style={{ textAlign: "left", padding: "12px", color: "#64748b", fontSize: "0.85rem" }}>Last Activity</th>
                                                <th style={{ textAlign: "left", padding: "12px", color: "#64748b", fontSize: "0.85rem" }}>Preview</th>
                                                <th style={{ textAlign: "right", padding: "12px", color: "#64748b", fontSize: "0.85rem" }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {conversations.map((convo) => (
                                                <tr key={convo.conversation_id} style={{ background: "rgba(255,255,255,0.02)", transition: "all 0.2s" }} className="hover-glass-row">
                                                    <td style={{ padding: "16px", borderRadius: "8px 0 0 8px", color: "white", fontWeight: 500 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "rgba(255, 255, 255, 0.1)", borderRadius: 6 }}>
                                                                <MessageSquare size={14} color="rgba(255,255,255,0.5)" />
                                                            </div>
                                                            <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
                                                                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px", lineHeight: "1.2" }}>
                                                                    {convo.title || "Untitled"}
                                                                </span>
                                                                <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "monospace", lineHeight: "1" }}>#{convo.conversation_id.slice(0, 6)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "16px", textAlign: "center" }}>
                                                        <span style={{ padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", fontSize: "0.8rem", color: "#cbd5e1" }}>
                                                            {convo.message_count}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "16px", color: "#94a3b8", fontSize: "0.9rem" }}>
                                                        {new Date(convo.updated_at).toLocaleDateString()} <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{new Date(convo.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </td>
                                                    <td style={{ padding: "16px", color: "#94a3b8", fontSize: "0.9rem", maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                        {convo.preview}
                                                    </td>
                                                    <td style={{ padding: "16px", textAlign: "right", borderRadius: "0 8px 8px 0" }}>
                                                        <button
                                                            onClick={() => handleViewConversation(convo.conversation_id)}
                                                            className="glass-btn"
                                                            style={{
                                                                padding: "6px 12px",
                                                                borderRadius: 8,
                                                                color: "rgba(255,255,255,0.5)",
                                                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                                                background: "rgba(255, 255, 255, 0.05)",
                                                                cursor: "pointer",
                                                                fontSize: "0.85rem"
                                                            }}
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Pagination (Simple) */}
                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, gap: 12 }}>
                                        <button
                                            disabled={chatPage === 1}
                                            onClick={() => { setChatPage(p => p - 1); loadConversations(); }}
                                            style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, color: "white", cursor: "pointer", opacity: chatPage === 1 ? 0.5 : 1 }}
                                        >
                                            Previous
                                        </button>
                                        <span style={{ padding: "8px 12px", color: "#94a3b8" }}>Page {chatPage}</span>
                                        <button
                                            disabled={conversations.length < 20}
                                            onClick={() => { setChatPage(p => p + 1); loadConversations(); }}
                                            style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, color: "white", cursor: "pointer", opacity: conversations.length < 20 ? 0.5 : 1 }}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Conversation Detail Overlay */}
                            {selectedConversation && (
                                <div style={{
                                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                                    background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
                                    zIndex: 50, display: "flex", justifyContent: "center", alignItems: "center"
                                }}>
                                    <div style={{
                                        width: "600px", maxWidth: "95%", height: "80vh",
                                        background: "#0f172a", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)",
                                        display: "flex", flexDirection: "column", boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
                                    }}>
                                        {/* Header */}
                                        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "white" }}>Conversation Details</h3>
                                                <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>ID: {selectedConversation.conversation_id}</div>
                                            </div>
                                            <button onClick={() => setSelectedConversation(null)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer" }}>
                                                <X size={24} />
                                            </button>
                                        </div>

                                        {/* Messages */}
                                        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
                                            {selectedConversation.messages.map((msg, idx) => (
                                                <div key={idx} style={{
                                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                                    maxWidth: "80%"
                                                }}>
                                                    <div style={{
                                                        background: msg.role === 'user' ? "rgba(255, 255, 255, 0.2)" : "rgba(255,255,255,0.05)",
                                                        padding: "12px 16px", borderRadius: 12,
                                                        border: `1px solid ${msg.role === 'user' ? "rgba(255, 255, 255, 0.2)" : "rgba(255,255,255,0.05)"}`,
                                                        color: "white", fontSize: "0.95rem", lineHeight: 1.5
                                                    }}>
                                                        {msg.content}
                                                    </div>
                                                    <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                                                        {msg.role.toUpperCase()} • {new Date(msg.timestamp).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    )
                }

                {
                    activeTab === 'search-debug' && (
                        <section className="glass-card" style={{ padding: 32 }}>
                            <div style={{ marginBottom: 32 }}>
                                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                                    <Search size={24} color="#34d399" /> Test Retrieval & Confidence Scores
                                </h3>
                                <p style={{ color: "#94a3b8", marginTop: 8, fontSize: "0.95rem" }}>
                                    Simulate a user query to see which document chunks are retrieved and their vector similarity scores.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: 16, marginBottom: 32, alignItems: 'stretch' }}>
                                <input
                                    type="text"
                                    placeholder="Enter test query (e.g. 'What is the refund policy?')"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch();
                                        }
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: "16px",
                                        borderRadius: 12,
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        color: "white",
                                        fontSize: "1rem",
                                        fontFamily: "inherit"
                                    }}
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={searchLoading || !searchQuery.trim()}
                                    className="glass-btn hover-glow-green"
                                    style={{
                                        flexShrink: 0,
                                        padding: "0 32px",
                                        borderRadius: 12,
                                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                        color: "white",
                                        fontWeight: 600,
                                        border: "none",
                                        cursor: searchLoading ? "not-allowed" : "pointer",
                                        display: "flex",
                                        alignItems: 'center',
                                        gap: 8,
                                        opacity: searchLoading ? 0.7 : 1
                                    }}
                                >
                                    {searchLoading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                                    Test Retrieval
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {searchResults.map((result, idx) => (
                                    <div key={idx} style={{
                                        background: "rgba(255,255,255,0.02)",
                                        border: "1px solid rgba(255,255,255,0.05)",
                                        borderRadius: 12,
                                        padding: 20,
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                <span style={{
                                                    fontSize: "0.85rem",
                                                    fontWeight: 700,
                                                    color: result.score > 0.7 ? "#34d399" : result.score > 0.5 ? "#fbbf24" : "#94a3b8",
                                                    background: result.score > 0.7 ? "rgba(52, 211, 153, 0.1)" : result.score > 0.5 ? "rgba(251, 191, 36, 0.1)" : "rgba(148, 163, 184, 0.1)",
                                                    padding: "4px 8px",
                                                    borderRadius: 6,
                                                    border: `1px solid ${result.score > 0.7 ? "rgba(52, 211, 153, 0.2)" : result.score > 0.5 ? "rgba(251, 191, 36, 0.2)" : "rgba(148, 163, 184, 0.2)"}`
                                                }}>
                                                    Score: {result.score.toFixed(4)}
                                                </span>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <span style={{ fontSize: "0.85rem", color: "#64748b", fontFamily: "monospace" }}>
                                                        {result.source}
                                                    </span>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: "0.8rem", color: "#94a3b8", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4 }}>
                                                {result.section}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "0.95rem", color: "#e2e8f0", lineHeight: 1.6 }}>
                                            {result.text}
                                        </div>
                                    </div>
                                ))}
                                {searchResults.length === 0 && !searchLoading && searchQuery && (
                                    <div style={{ textAlign: "center", color: "#64748b", padding: 40 }}>
                                        No results found. Try a different query.
                                    </div>
                                )}
                            </div>
                        </section>
                    )
                }

                {
                    activeTab === 'billing' && (
                        <div style={{ padding: 0, animation: 'slideUp 0.4s ease' }}>
                            {/* Header with Help Me Choose button */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 16 }}>
                                <div>
                                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <CreditCard size={26} color="#818cf8" /> Choose Your Plan
                                    </h2>
                                    <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: 8, maxWidth: 560 }}>
                                        {currentSub
                                            ? `You're currently on the ${currentSub.subscription_tier} plan. Select a different plan to switch.`
                                            : 'Select the perfect subscription tier for your organization.'
                                        }
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowOnboarding(!showOnboarding)}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: 12,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        background: showOnboarding ? 'rgba(234, 179, 8, 0.15)' : 'rgba(234, 179, 8, 0.08)',
                                        border: `1px solid ${showOnboarding ? 'rgba(234, 179, 8, 0.4)' : 'rgba(234, 179, 8, 0.2)'}`,
                                        color: '#eab308',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <Lightbulb size={18} />
                                    {showOnboarding ? 'Hide Wizard' : 'Help Me Choose'}
                                </button>
                            </div>

                            {/* OnboardingStepper Wizard (Modal Overlay) */}
                            {showOnboarding && (
                                <div style={{
                                    position: 'fixed',
                                    inset: 0,
                                    zIndex: 9999,
                                    background: 'rgba(0, 0, 0, 0.75)',
                                    backdropFilter: 'blur(8px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '20px' // Ensure padding so modal doesn't touch screen edges
                                }}>
                                    <div className="onboarding-section" style={{
                                        background: '#121216', // Darker elegant background
                                        border: '1px solid rgba(234, 179, 8, 0.25)',
                                        borderRadius: 20, // Match modern rounded corners
                                        boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
                                        padding: '24px 24px 8px',
                                        position: 'relative',
                                        width: '100%',
                                        maxWidth: '700px', // Restrict max width of the wizard modal
                                        maxHeight: '90vh',
                                        overflowY: 'auto' // Handle tall step content
                                    }}>
                                        <button
                                            onClick={() => setShowOnboarding(false)}
                                            style={{
                                                position: 'absolute',
                                                top: 16,
                                                right: 16,
                                                background: 'rgba(255,255,255,0.08)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '50%',
                                                width: 32,
                                                height: 32,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                zIndex: 10,
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                            }}
                                        >
                                            <X size={16} />
                                        </button>
                                        <OnboardingStepper
                                            onComplete={(data: any, tier: string) => {
                                                setRecommendedTier(tier);
                                                setSelectedTierId(tier);
                                                setShowOnboarding(false);
                                                toast.success(`We recommend the ${tiers[tier]?.name || tier} plan for your needs!`);
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Recommended tier banner */}
                            {recommendedTier && tiers[recommendedTier] && (
                                <div style={{
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.08))',
                                    border: '1px solid rgba(99, 102, 241, 0.25)',
                                    borderRadius: 12,
                                    padding: '14px 20px',
                                    marginBottom: 24,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    fontSize: '0.95rem'
                                }}>
                                    <Sparkles size={20} color="#818cf8" />
                                    <span style={{ color: '#e2e8f0' }}>
                                        Based on your answers, we recommend the{' '}
                                        <strong style={{ color: '#a5b4fc' }}>{tiers[recommendedTier].name}</strong> plan.
                                    </span>
                                    <button
                                        onClick={() => setRecommendedTier(null)}
                                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            {/* Tier Cards Grid */}
                            {loadingOverview ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 16 }}>
                                    <SkeletonLoader height="480px" borderRadius="16px" />
                                    <SkeletonLoader height="480px" borderRadius="16px" />
                                    <SkeletonLoader height="480px" borderRadius="16px" />
                                </div>
                            ) : Object.keys(tiers).length > 0 ? (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${Math.min(Object.keys(tiers).length, 3)}, 1fr)`,
                                    gap: 24,
                                    marginTop: 16,
                                    alignItems: 'start'
                                }}>
                                    {Object.entries(tiers).map(([tierId, tier]) => {
                                        const isCurrent = currentSub?.subscription_tier === tierId;
                                        const isRecommended = recommendedTier === tierId;
                                        return (
                                            <div key={tierId} style={{
                                                position: 'relative',
                                            }}>
                                                <PremiumTierCard
                                                    tierId={tierId}
                                                    tierName={tier.name}
                                                    price={tier.price_display}
                                                    description={tier.description}
                                                    isPopular={tierId === 'professional'}
                                                    isRecommended={recommendedTier === tierId && !isCurrent}
                                                    isCurrent={isCurrent}
                                                    isLoading={tierUpdating && selectedTierId === tierId}
                                                    disabled={isCurrent}
                                                    onSelect={async (id: string) => {
                                                        if (isCurrent) return;
                                                        setSelectedTierId(id);
                                                        setTierUpdating(true);
                                                        try {
                                                            const currentCompanyId = localStorage.getItem('admin_company_id') || companyId;
                                                            if (!currentCompanyId) throw new Error('Please log in again');
                                                            await updateSubscriptionTier(id, currentCompanyId);
                                                            setSuccessMessage(`Plan updated to ${tier.name}!`);
                                                            setShowSuccessModal(true);
                                                            setTimeout(() => {
                                                                setShowSuccessModal(false);
                                                                loadOverview();
                                                            }, 2000);
                                                        } catch (err: any) {
                                                            toast.error('Failed to update plan: ' + (err?.message || err));
                                                        } finally {
                                                            setTierUpdating(false);
                                                        }
                                                    }}
                                                    features={[
                                                        {
                                                            text: tier.max_documents === -1 ? 'Unlimited Documents' : `${tier.max_documents} Documents`,
                                                            enabled: true
                                                        },
                                                        {
                                                            text: tier.max_queries_per_month === -1 ? 'Unlimited Queries' : `${tier.max_queries_per_month.toLocaleString()} Queries/month`,
                                                            enabled: true
                                                        },
                                                        { text: 'Advanced Analytics', enabled: tier.analytics_enabled },
                                                        { text: 'Custom Branding', enabled: tier.custom_branding },
                                                        { text: 'Priority Support', enabled: tierId === 'enterprise' },
                                                    ]}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 80, color: '#64748b' }}>
                                    Could not load subscription tiers. Please refresh...
                                </div>
                            )}

                            {/* Success Modal */}
                            {showSuccessModal && (
                                <div style={{
                                    position: 'fixed',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.7)',
                                    backdropFilter: 'blur(4px)',
                                    zIndex: 200,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{
                                        background: '#1a1a1a',
                                        border: '1px solid rgba(99, 102, 241, 0.3)',
                                        borderRadius: 20,
                                        padding: '48px 40px',
                                        textAlign: 'center',
                                        maxWidth: 400,
                                        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                                    }}>
                                        <div style={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 20px',
                                            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)'
                                        }}>
                                            <Check size={32} color="#fff" />
                                        </div>
                                        <h3 style={{ color: 'white', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
                                            {successMessage}
                                        </h3>
                                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                            Your workspace is being reconfigured...
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }
            </main >

            {/* New Key Modal */}
            {
                showKeyModal && generatedKey && (
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
                                    <code style={{ flex: 1, padding: 12, color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace', fontSize: '1rem', overflowX: 'auto' }}>
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
                                    background: '#6366f1',
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
                )
            }
        </>
    );
}

