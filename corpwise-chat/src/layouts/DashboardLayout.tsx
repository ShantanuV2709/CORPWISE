import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Key, MessageSquare, CreditCard, LogOut, Menu, X, Bell, Search, Bug } from 'lucide-react';
import { AdminAuth } from '../features/auth/components/AdminAuth';
import './DashboardLayout.css';

// Routes that map to search queries
const SEARCH_ROUTES: { keywords: string[]; path: string; label: string; description: string; icon: React.ReactNode }[] = [
    { keywords: ['overview', 'stats', 'usage', 'dashboard', 'home'], path: '/admin/overview', label: 'Overview', description: 'Usage stats & analytics', icon: <LayoutDashboard size={16} /> },
    { keywords: ['doc', 'pdf', 'file', 'upload', 'knowledge', 'ingest'], path: '/admin/documents', label: 'Documents', description: 'Upload & manage files', icon: <FileText size={16} /> },
    { keywords: ['key', 'api', 'token', 'secret', 'credential'], path: '/admin/apikeys', label: 'API Keys', description: 'Manage API credentials', icon: <Key size={16} /> },
    { keywords: ['chat', 'log', 'message', 'conversation', 'history'], path: '/admin/logs', label: 'Chat Logs', description: 'Conversation history', icon: <MessageSquare size={16} /> },
    { keywords: ['search', 'debug', 'test', 'query', 'vector'], path: '/admin/search-debug', label: 'Search Debug', description: 'Test search queries', icon: <Bug size={16} /> },
    { keywords: ['bill', 'pay', 'invoice', 'plan', 'subscription', 'pricing'], path: '/admin/billing', label: 'Billing', description: 'Plans & payments', icon: <CreditCard size={16} /> },
];

function resolveSearchPath(query: string): string {
    const q = query.toLowerCase();
    for (const route of SEARCH_ROUTES) {
        if (route.keywords.some(kw => q.includes(kw))) return route.path;
    }
    return '/admin/documents';
}

export function DashboardLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [companyId, setCompanyId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchHint, setShowSearchHint] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const searchRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Filtered routes based on search query
    const filteredRoutes = SEARCH_ROUTES.filter(r =>
        !searchQuery || r.keywords.some(kw => kw.includes(searchQuery.toLowerCase())) || r.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Reset active index when query changes
    useEffect(() => {
        setActiveIndex(searchQuery ? 0 : -1);
    }, [searchQuery]);

    // ⌘K / Ctrl+K global shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => Math.min(prev + 1, filteredRoutes.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < filteredRoutes.length) {
                navigate(filteredRoutes[activeIndex].path);
            } else if (searchQuery.trim()) {
                navigate(resolveSearchPath(searchQuery.trim()));
            }
            setShowSearchHint(false);
            setSearchQuery('');
            setActiveIndex(-1);
            searchRef.current?.blur();
        } else if (e.key === 'Escape') {
            setShowSearchHint(false);
            setSearchQuery('');
            setActiveIndex(-1);
            searchRef.current?.blur();
        }
    };

    const navigateToRoute = useCallback((path: string) => {
        navigate(path);
        setSearchQuery('');
        setShowSearchHint(false);
        setActiveIndex(-1);
    }, [navigate]);

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
                                onBlur={() => setTimeout(() => { setShowSearchHint(false); setActiveIndex(-1); }, 200)}
                                onKeyDown={handleSearchKeyDown}
                            />
                            {!showSearchHint && !searchQuery && (
                                <kbd className="search-shortcut">⌘K</kbd>
                            )}
                            {/* Dropdown */}
                            {showSearchHint && (
                                <div ref={dropdownRef} className="search-dropdown">
                                    <div className="search-dropdown-header">
                                        {searchQuery ? 'Results' : 'Quick Navigation'}
                                    </div>
                                    <div className="search-dropdown-list">
                                        {filteredRoutes.map((route, idx) => (
                                            <button
                                                key={route.path}
                                                className={`search-dropdown-item ${idx === activeIndex ? 'active' : ''}`}
                                                onMouseDown={() => navigateToRoute(route.path)}
                                                onMouseEnter={() => setActiveIndex(idx)}
                                            >
                                                <div className="search-dropdown-item-icon">
                                                    {route.icon}
                                                </div>
                                                <div className="search-dropdown-item-text">
                                                    <span className="search-dropdown-item-label">{route.label}</span>
                                                    <span className="search-dropdown-item-desc">{route.description}</span>
                                                </div>
                                                {idx === activeIndex && (
                                                    <span className="search-dropdown-item-hint">↵</span>
                                                )}
                                            </button>
                                        ))}
                                        {filteredRoutes.length === 0 && (
                                            <div className="search-dropdown-empty">
                                                No matching pages found
                                            </div>
                                        )}
                                    </div>
                                    <div className="search-dropdown-footer">
                                        <span><kbd>↑↓</kbd> navigate</span>
                                        <span><kbd>↵</kbd> open</span>
                                        <span><kbd>esc</kbd> close</span>
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
