import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Key, MessageSquare, CreditCard, LogOut, Menu, X, Bell, Search } from 'lucide-react';
import { AdminAuth } from '../features/auth/components/AdminAuth';
import './DashboardLayout.css';

// Routes that map to search queries
const SEARCH_ROUTES: { keywords: string[]; path: string; label: string; icon: string }[] = [
    { keywords: ['doc', 'pdf', 'file', 'upload', 'knowledge'], path: '/admin/documents', label: 'Documents', icon: '📄' },
    { keywords: ['key', 'api', 'token', 'secret'], path: '/admin/apikeys', label: 'API Keys', icon: '🔑' },
    { keywords: ['chat', 'log', 'message', 'conversation', 'history'], path: '/admin/logs', label: 'Chat Logs', icon: '💬' },
    { keywords: ['bill', 'pay', 'invoice', 'plan', 'subscription'], path: '/admin/billing', label: 'Billing', icon: '💳' },
    { keywords: ['overview', 'stats', 'usage', 'dashboard'], path: '/admin/overview', label: 'Overview', icon: '📊' },
];

function resolveSearchPath(query: string): string {
    const q = query.toLowerCase();
    for (const route of SEARCH_ROUTES) {
        if (route.keywords.some(kw => q.includes(kw))) return route.path;
    }
    return '/admin/documents'; // default
}

export function DashboardLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [companyId, setCompanyId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchHint, setShowSearchHint] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const savedId = localStorage.getItem("admin_company_id");
        if (savedId) {
            setCompanyId(savedId);
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("admin_company_id");
        navigate('/');
    };

    if (!isAuthenticated) {
        return <AdminAuth onAuthenticated={(id) => {
            localStorage.setItem("admin_company_id", id);
            setCompanyId(id);
            setIsAuthenticated(true);
        }} />;
    }

    const navItems = [
        { name: 'Overview', path: '/admin/overview', icon: <LayoutDashboard size={20} /> },
        { name: 'Documents', path: '/admin/documents', icon: <FileText size={20} /> },
        { name: 'API Keys', path: '/admin/apikeys', icon: <Key size={20} /> },
        { name: 'Chat Logs', path: '/admin/logs', icon: <MessageSquare size={20} /> },
        { name: 'Search Debug', path: '/admin/search-debug', icon: <Search size={20} /> },
        { name: 'Billing', path: '/admin/billing', icon: <CreditCard size={20} /> },
    ];

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <span className="brand-title">CORPWISE</span>
                    <button className="mobile-close" onClick={() => setIsMobileMenuOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <div className="nav-icon">{item.icon}</div>
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item logout-btn" onClick={handleLogout}>
                        <div className="nav-icon"><LogOut size={20} /></div>
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                {/* Top Header */}
                <header className="dashboard-header">
                    <div className="header-left">
                        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div className="search-bar" style={{ position: 'relative' }}>
                            <Search size={18} className="search-icon" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Search resources..."
                                className="search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setShowSearchHint(true)}
                                onBlur={() => setTimeout(() => setShowSearchHint(false), 150)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && searchQuery.trim()) {
                                        const path = resolveSearchPath(searchQuery.trim());
                                        setShowSearchHint(false);
                                        setSearchQuery('');
                                        navigate(path);
                                    }
                                    if (e.key === 'Escape') {
                                        setShowSearchHint(false);
                                        setSearchQuery('');
                                        searchRef.current?.blur();
                                    }
                                }}
                            />
                            {/* Dropdown: show when focused */}
                            {showSearchHint && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                                    background: 'rgba(10,10,14,0.97)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 12, overflow: 'hidden', zIndex: 200,
                                    backdropFilter: 'blur(20px)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)'
                                }}>
                                    <div style={{ padding: '8px 12px 4px', fontSize: '0.7rem', color: '#475569', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                        {searchQuery ? 'Jump to' : 'Navigate to'}
                                    </div>
                                    {SEARCH_ROUTES.filter(r =>
                                        !searchQuery || r.keywords.some(kw => kw.includes(searchQuery.toLowerCase())) || r.label.toLowerCase().includes(searchQuery.toLowerCase())
                                    ).map((route) => {
                                        const isBestMatch = searchQuery ? resolveSearchPath(searchQuery) === route.path : false;
                                        return (
                                            <button
                                                key={route.path}
                                                onMouseDown={() => {
                                                    navigate(route.path);
                                                    setSearchQuery('');
                                                    setShowSearchHint(false);
                                                }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                                    padding: '9px 14px', background: isBestMatch ? 'rgba(99,102,241,0.1)' : 'transparent',
                                                    border: 'none', cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                onMouseLeave={e => e.currentTarget.style.background = isBestMatch ? 'rgba(99,102,241,0.1)' : 'transparent'}
                                            >
                                                <Search size={14} color={isBestMatch ? '#818cf8' : '#475569'} />
                                                <span style={{ color: isBestMatch ? '#e2e8f0' : '#94a3b8', fontSize: '0.9rem', fontWeight: isBestMatch ? 600 : 400 }}>
                                                    {route.label}
                                                </span>
                                                {isBestMatch && (
                                                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#6366f1', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: 99 }}>
                                                        Best match
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                    <div style={{ padding: '6px 12px 8px', fontSize: '0.72rem', color: '#334155', borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 4 }}>
                                        Press <kbd style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 4, fontSize: '0.7rem' }}>Enter</kbd> to jump · <kbd style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 4, fontSize: '0.7rem' }}>Esc</kbd> to close
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="header-right">
                        <button className="icon-btn relative">
                            <Bell size={20} />
                            <span className="notification-dot"></span>
                        </button>
                        <div className="user-profile">
                            <div className="avatar user-avatar">{companyId.substring(0, 2).toUpperCase()}</div>
                            <div className="user-info">
                                <span className="user-name">{companyId || "Admin User"}</span>
                                <span className="user-role">Workspace Owner</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dynamic View Content */}
                <div className="dashboard-content">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
            )}
        </div>
    );
}
