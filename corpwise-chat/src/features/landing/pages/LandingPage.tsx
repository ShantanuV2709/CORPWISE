import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, Zap, Database, ArrowRight, Brain,
    FileText, MessageSquare, Users, BarChart2, Code2,
    CheckCircle2, ChevronRight, Building2, Cpu, Globe
} from 'lucide-react';
import { fetchSubscriptionTiers, type SubscriptionTier } from '../../onboarding/api/subscription';
import { PremiumTierCard } from '../../onboarding/components/PremiumTierCard';
import SpotlightCard from '../../../components/SpotlightCard';
import StickyStack from '../../../components/StickyStack';
import { AuthSheet } from '../../auth/components/AuthSheet';
import { ArrowUpRightIcon } from 'lucide-react';
import { CraftButton, CraftButtonLabel, CraftButtonIcon } from '../../../components/ui/craft-button';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { useRef } from 'react';
import NeuralBackground from '../components/NeuralBackground';
import './LandingPage.css';

export function LandingPage() {
    const navigate = useNavigate();
    const [tiers, setTiers] = useState<Record<string, SubscriptionTier>>({});
    const [loadingTiers, setLoadingTiers] = useState(true);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

    const openAuth = (mode: 'login' | 'register') => {
        setAuthMode(mode);
        setIsAuthOpen(true);
    };

    useEffect(() => {
        const loadTiers = async () => {
            try {
                const data = await fetchSubscriptionTiers();
                setTiers(data.tiers);
            } catch (err) {
                console.error('Failed to load tiers:', err);
            } finally {
                setLoadingTiers(false);
            }
        };
        loadTiers();
    }, []);

    // --- Frame Motion Scroll Setup ---
    const rootScrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLocked, setIsLocked] = useState(false);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        container: rootScrollRef,
        offset: ["start start", "end end"]
    });

    useEffect(() => {
        const unsubscribe = scrollYProgress.on("change", (latest) => {
            // Once we reach the very end, lock the animation logic out entirely
            if (latest > 0.99 && !isLocked) {
                setIsLocked(true);
                if (rootScrollRef.current) {
                    rootScrollRef.current.scrollTop = 0;
                }
            }
        });
        return () => unsubscribe();
    }, [scrollYProgress, isLocked]);

    // Phase 1: Ingestion
    // Use scrollYProgress directly to allow icons to "fly back" on scroll up
    const strictProgress = scrollYProgress;

    // Randomize icon entrance delays and spawn positions on every visit
    const iconData = useMemo(() => {
        const baseDelays = [0.8, 1.1, 1.4, 1.7].sort(() => Math.random() - 0.5);

        // Spawn icons at random edges (Left, Right, Top, Bottom)
        const spawns = [
            { x: "-40vw", y: "-40vh" }, // Top Left
            { x: "40vw", y: "-40vh" },  // Top Right
            { x: "-40vw", y: "40vh" },   // Bottom Left
            { x: "40vw", y: "40vh" }    // Bottom Right
        ];

        // Jitter the spawns slightly for true randomness
        const randomizedSpawns = spawns.map(s => ({
            x: `${parseInt(s.x) + (Math.random() * 20 - 10)}vw`,
            y: `${parseInt(s.y) + (Math.random() * 20 - 10)}vh`
        })).sort(() => Math.random() - 0.5);

        return baseDelays.map((delay, i) => ({
            delay,
            startX: randomizedSpawns[i].x,
            startY: randomizedSpawns[i].y
        }));
    }, []);

    const f1X = useTransform(strictProgress, [0.0, 0.70], [iconData[0].startX, "0vw"]);
    const f1Y = useTransform(strictProgress, [0.0, 0.70], [iconData[0].startY, "0vh"]);
    const f1OpacityIngest = useTransform(strictProgress, [0.0, 0.65, 0.70], [1, 1, 0]);

    const f2X = useTransform(strictProgress, [0.0, 0.70], [iconData[1].startX, "0vw"]);
    const f2Y = useTransform(strictProgress, [0.0, 0.70], [iconData[1].startY, "0vh"]);
    const f2OpacityIngest = useTransform(strictProgress, [0.0, 0.65, 0.70], [1, 1, 0]);

    const f3X = useTransform(strictProgress, [0.0, 0.70], [iconData[2].startX, "0vw"]);
    const f3Y = useTransform(strictProgress, [0.0, 0.70], [iconData[2].startY, "0vh"]);
    const f3OpacityIngest = useTransform(strictProgress, [0.0, 0.65, 0.70], [1, 1, 0]);

    const f4X = useTransform(strictProgress, [0.0, 0.70], [iconData[3].startX, "0vw"]);
    const f4Y = useTransform(strictProgress, [0.0, 0.70], [iconData[3].startY, "0vh"]);
    const f4OpacityIngest = useTransform(strictProgress, [0.0, 0.65, 0.70], [1, 1, 0]);

    // Logo Blinking as files are ingested (brief scale ups)
    const logoScale = useTransform(strictProgress,
        [0, 0.60, 0.65, 0.70, 0.75],
        [1, 1, 1.15, 1, 1]
    );

    // Phase 2: 0.70 to 0.90 (Logo jumps to Taskbar Navbar scale & position)
    const centerLogoX = useTransform(strictProgress, [0.70, 0.90], ["0vw", "-42vw"]);
    const centerLogoY = useTransform(strictProgress, [0.70, 0.90], ["0vh", "-45vh"]);
    const centerLogoOverallScale = useTransform(strictProgress, [0.70, 0.90], [1, 0.25]);

    // Fast Handoff to actual Navbar completely at 0.90
    const centerLogoOpacity = useTransform(strictProgress, [0.0, 0.90, 0.93], [1, 1, 0]);

    // Phase 3: 0.80 to 1.0 (Rest of Hero Content fades in below)
    const heroRestOpacity = useTransform(strictProgress, [0.0, 0.80, 0.95], [0, 0, 1]);
    const heroRestY = useTransform(strictProgress, [0.0, 0.80, 0.95], [40, 40, 0]);

    // Navbar fades in slightly later
    const navOpacity = useTransform(strictProgress, [0.0, 0.85, 0.98], [0, 0, 1]);

    const features = [
        {
            icon: <Brain size={28} />,
            title: 'Intelligent RAG Engine',
            desc: 'Context-aware multi-dimension embeddings (384 to 1024-dim) retrieve pinpoint answers from your private documents in milliseconds.',
            colorClass: 'bg-blue',
            spotlightColor: 'rgba(96, 165, 250, 0.18)',
        },
        {
            icon: <Shield size={28} />,
            title: 'Zero-Trust Security',
            desc: 'Complete tenant isolation — your vectors, documents, and histories are fully siloed with cryptographic namespace separation.',
            colorClass: 'bg-green',
            spotlightColor: 'rgba(52, 211, 153, 0.18)',
        },
        {
            icon: <Zap size={28} />,
            title: 'Fast Vector Search',
            desc: 'Built on FastAPI and Pinecone — optimised query pipelines deliver near-instant results even at enterprise knowledge base scale.',
            colorClass: 'bg-purple',
            spotlightColor: 'rgba(255, 255, 255, 0.18)',
        },
        {
            icon: <BarChart2 size={28} />,
            title: 'Usage Analytics',
            desc: "Admin dashboards track query counts, document coverage, and confidence scores so you can monitor your knowledge base.",
            colorClass: 'bg-orange',
            spotlightColor: 'rgba(251, 146, 60, 0.18)',
        },
        {
            icon: <Code2 size={28} />,
            title: 'One-Line Embed',
            desc: 'A single script tag deploys the chat widget onto any webpage. No backend changes, no DevOps overhead.',
            colorClass: 'bg-teal',
            spotlightColor: 'rgba(45, 212, 191, 0.18)',
        },
        {
            icon: <Globe size={28} />,
            title: 'Multi-Tenant SaaS',
            desc: 'Each company gets their own isolated workspace, API keys, and admin portal — fully managed per account.',
            colorClass: 'bg-pink',
            spotlightColor: 'rgba(244, 114, 182, 0.18)',
        },
    ];

    const useCases = [
        {
            color: '#60a5fa',
            title: 'Customer Support',
            icon: <MessageSquare size={22} color="#60a5fa" />,
            desc: 'Surface answers from product manuals and past tickets instantly — without agents searching through folders.',
            bullets: ['Automated Response Drafting', 'Troubleshooting Playbooks', 'Policy Document Lookup'],
        },
        {
            color: '#a78bfa',
            title: 'HR & Onboarding',
            icon: <Users size={22} color="#a78bfa" />,
            desc: 'Let new hires find answers to benefits, policies, and IT setup themselves — any time, no HR queue.',
            bullets: ['Employee Handbook Q&A', 'IT Setup Instructions', 'Compliance Reference'],
        },
        {
            color: '#34d399',
            title: 'Sales & Legal',
            icon: <FileText size={22} color="#34d399" />,
            desc: 'Give your team instant access to contract templates, battlecards, and legal precedents.',
            bullets: ['Contract Lookup', 'RFP Reference', 'Competitor Comparison'],
        },
    ];

    return (
        <>
            <div className="landing-container" ref={rootScrollRef}>
                {/* Background orbs */}
                <div className="lp-orb lp-orb-blue" />
                <div className="lp-orb lp-orb-purple" />
                <div className="lp-orb lp-orb-green" />

                {/* Header - Opacity controlled by scroll OR locked */}
                <motion.header className="landing-header" style={{ opacity: isLocked ? 1 : navOpacity, pointerEvents: "auto" }}>
                    <div className="landing-logo">
                        <span className="brand-title">CORPWISE</span>
                    </div>
                    <nav className="landing-nav">
                        <a href="#features" className="nav-link">Features</a>
                        <a href="#how-it-works" className="nav-link">How It Works</a>
                        <a href="#pricing" className="nav-link">Pricing</a>
                    </nav>
                    <div className="landing-header-actions">
                        <button className="glass-btn login-btn" onClick={() => openAuth('login')} style={{ border: 'none' }}>
                            Sign In
                        </button>
                        <CraftButton onClick={() => openAuth('register')}>
                            <CraftButtonLabel>Get Started</CraftButtonLabel>
                            <CraftButtonIcon>
                                <ArrowUpRightIcon />
                            </CraftButtonIcon>
                        </CraftButton>
                    </div>
                </motion.header>

                {/* Conditional Rendering: Only show the animation sequence if not locked */}
                {!isLocked ? (
                    <div ref={containerRef} className="hero-scroll-track" style={{ height: "400vh", position: "relative" }}>
                        {/* Sticky Container holds the hero view while scrolling */}
                        <div className="hero-sticky-container" style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <motion.section className="hero-section" style={{ position: "relative", zIndex: 10, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {/* Animated Center Logo */}
                                <motion.div style={{ position: "absolute", display: "flex", justifyContent: "center", alignItems: "center", opacity: centerLogoOpacity, x: centerLogoX, y: centerLogoY, scale: centerLogoOverallScale, zIndex: 100 }}>
                                    {/* Document Ingestion Icons (Random Spawns) */}
                                    <motion.img
                                        src="/pdf-icon.png"
                                        alt="PDF"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: iconData[0].delay, duration: 0.5 }}
                                        style={{ x: f1X, y: f1Y, opacity: f1OpacityIngest, rotate: -6, width: 110, height: 110, position: 'absolute', objectFit: 'contain' }}
                                    />
                                    <motion.img
                                        src="/docs-icon.png"
                                        alt="Docs"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: iconData[1].delay, duration: 0.5 }}
                                        style={{ x: f2X, y: f2Y, opacity: f2OpacityIngest, rotate: 4, width: 140, height: 140, position: 'absolute', objectFit: 'contain' }}
                                    />
                                    <motion.img
                                        src="/slack-icon.png"
                                        alt="Slack"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: iconData[2].delay, duration: 0.5 }}
                                        style={{ x: f3X, y: f3Y, opacity: f3OpacityIngest, rotate: -4, width: 110, height: 110, position: 'absolute', objectFit: 'contain' }}
                                    />
                                    <motion.img
                                        src="/txt-icon.png"
                                        alt="TXT"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: iconData[3].delay, duration: 0.5 }}
                                        style={{ x: f4X, y: f4Y, opacity: f4OpacityIngest, rotate: 5, width: 110, height: 110, position: 'absolute', objectFit: 'contain' }}
                                    />

                                    <motion.div style={{ display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none", zIndex: 10 }}>
                                        <motion.h1
                                            className="hero-title"
                                            initial={{ filter: "blur(15px)", opacity: 0 }}
                                            animate={{ filter: "blur(0px)", opacity: 1 }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                            style={{ scale: logoScale, margin: 0 }}
                                        >
                                            <span className="brand-title" style={{ fontSize: "6rem", fontWeight: 900, background: "linear-gradient(135deg, #fff 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", color: "transparent", letterSpacing: "-0.04em", lineHeight: 1 }}>
                                                CORPWISE
                                            </span>
                                        </motion.h1>
                                    </motion.div>
                                </motion.div>

                                {/* Rest of Hero Content (Hidden initially) */}
                                <motion.div style={{ opacity: heroRestOpacity, y: heroRestY, textAlign: "center", marginTop: "10rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <h2 className="hero-subtitle">
                                        Your company's brain.<br />
                                        <span className="subtitle-gradient">Fully encrypted. Always private.</span>
                                    </h2>
                                </motion.div>
                            </motion.section>
                        </div>
                    </div>
                ) : (
                    /* Final Clean Hero Section (Once Animation is locked) */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ height: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative", overflow: "hidden" }}
                    >
                        <NeuralBackground />
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 2 }}>
                            <h2 className="hero-subtitle">
                                Your company's brain.<br />
                                <span className="subtitle-gradient">Fully encrypted. Always private.</span>
                            </h2>
                        </div>
                    </motion.div>
                )}

                {/* Main Content flows normally AFTER the 400vh track */}
                <main className="landing-main" style={{ paddingTop: 40 }}>
                    {/* Features Grid with SpotlightCard */}
                    <section id="features" className="features-section">
                        <div className="section-header">
                            <div className="section-label">
                                <Zap size={14} />
                                Capabilities
                            </div>
                            <h2 className="section-title">Everything you need to go live</h2>
                            <p className="section-subtitle">
                                Enterprise-grade AI infrastructure that deploys in minutes, not months.
                            </p>
                        </div>
                        <div className="features-grid">
                            {features.map((f, i) => (
                                <SpotlightCard
                                    key={i}
                                    className="feature-spotlight-card"
                                    spotlightColor={f.spotlightColor}
                                >
                                    <div className={`feature-icon ${f.colorClass}`}>{f.icon}</div>
                                    <h3 className="feature-title">{f.title}</h3>
                                    <p className="feature-desc">{f.desc}</p>
                                </SpotlightCard>
                            ))}
                        </div>
                    </section>

                    {/* How It Works */}
                    <section id="how-it-works" className="how-it-works-section" style={{ padding: '80px 20px 0', maxWidth: '1200px', margin: '0 auto', position: 'relative', width: '100%' }}>
                        <div style={{ position: 'sticky', top: '10vh', textAlign: 'center', zIndex: 10 }}>
                            <div className="section-label" style={{ justifyContent: 'center', display: 'inline-flex' }}>
                                <ChevronRight size={14} />
                                3 Steps
                            </div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', marginTop: 12 }}>Deploy your enterprise brain</h2>
                            <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '560px', margin: '12px auto 0', paddingBottom: '40px' }}>
                                From zero to production in under 10 minutes.
                            </p>
                        </div>

                        <StickyStack
                            topOffset={160}
                            items={[
                                {
                                    children: (
                                        <>
                                            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'rgba(255,255,255,0.04)', position: 'absolute', top: 16, right: 24 }}>01</div>
                                            <div style={{ background: 'rgba(96, 165, 250, 0.12)', padding: '16px', borderRadius: '16px', display: 'inline-flex', marginBottom: '24px', border: '1px solid rgba(96,165,250,0.2)' }}>
                                                <Database size={32} color="#60a5fa" />
                                            </div>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '12px' }}>Upload Knowledge</h3>
                                            <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '1rem' }}>Ingest PDFs, Markdown, and TXT files into your secure, isolated tenant vector database with one click from the admin panel.</p>
                                        </>
                                    )
                                },
                                {
                                    children: (
                                        <>
                                            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'rgba(255,255,255,0.04)', position: 'absolute', top: 16, right: 24 }}>02</div>
                                            <div style={{ background: 'rgba(255, 255, 255, 0.12)', padding: '16px', borderRadius: '16px', display: 'inline-flex', marginBottom: '24px', border: '1px solid rgba(167,139,250,0.2)' }}>
                                                <Zap size={32} color="#a78bfa" />
                                            </div>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '12px' }}>Automatic Indexing</h3>
                                            <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '1rem' }}>CORPWISE chunks, embeds, and indexes your documents automatically using Gemini embeddings and Pinecone — no configuration needed.</p>
                                        </>
                                    )
                                },
                                {
                                    children: (
                                        <>
                                            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'rgba(255,255,255,0.04)', position: 'absolute', top: 16, right: 24 }}>03</div>
                                            <div style={{ background: 'rgba(52, 211, 153, 0.12)', padding: '16px', borderRadius: '16px', display: 'inline-flex', marginBottom: '24px', border: '1px solid rgba(52,211,153,0.2)' }}>
                                                <Code2 size={32} color="#34d399" />
                                            </div>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '12px' }}>Embed & Go Live</h3>
                                            <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '1rem' }}>Copy your API key, drop one script tag into any webpage — your AI assistant is live and answering questions instantly.</p>
                                        </>
                                    )
                                }
                            ]}
                        />
                    </section>

                    {/* Use Cases */}
                    <section className="use-cases-section" style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                        <div className="section-header">
                            <div className="section-label" style={{ justifyContent: 'center', display: 'inline-flex' }}>
                                <Building2 size={14} />
                                Use Cases
                            </div>
                            <h2 className="section-title">Built for every department</h2>
                            <p className="section-subtitle">One central knowledge base. Unlimited applications.</p>
                        </div>

                        <div className="use-cases-grid">
                            {useCases.map((uc, i) => (
                                <div key={i} className="glass-card use-case-card" style={{ borderTop: `3px solid ${uc.color}`, padding: '32px', borderRadius: '20px' }}>
                                    <div style={{ background: `${uc.color}15`, border: `1px solid ${uc.color}30`, width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                        {uc.icon}
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px', color: 'white' }}>{uc.title}</h3>
                                    <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '20px', fontSize: '0.95rem' }}>{uc.desc}</p>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {uc.bullets.map((b, j) => (
                                            <li key={j} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                                <CheckCircle2 size={14} color={uc.color} style={{ flexShrink: 0 }} /> {b}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Pricing */}
                    <section id="pricing" className="pricing-section" style={{ padding: '80px 40px', width: '100%', boxSizing: 'border-box' }}>
                        <div className="section-header">
                            <div className="section-label" style={{ justifyContent: 'center', display: 'inline-flex' }}>
                                <Database size={14} />
                                Pricing
                            </div>
                            <h2 className="section-title">Simple, transparent pricing</h2>
                            <p className="section-subtitle">Three tiers. No hidden fees. Upgrade anytime.</p>
                        </div>

                        {loadingTiers ? (
                            <div className="pricing-loading">
                                <div className="pricing-skeleton" />
                                <div className="pricing-skeleton" />
                                <div className="pricing-skeleton" />
                            </div>
                        ) : (
                            <div className="ob-grid" style={{ maxWidth: '72rem', margin: '0 auto' }}>
                                {Object.entries(tiers).map(([tierId, tier]) => (
                                    <PremiumTierCard
                                        key={tierId}
                                        tierId={tierId}
                                        tierName={tier.name}
                                        price={tier.price_display}
                                        description={tier.description}
                                        isPopular={tierId === 'professional'}
                                        onSelect={() => openAuth('register')}
                                        features={[
                                            { text: tier.max_documents === -1 ? 'Unlimited Documents' : `${tier.max_documents} Documents`, enabled: true },
                                            { text: tier.max_queries_per_month === -1 ? 'Unlimited Queries' : `${tier.max_queries_per_month.toLocaleString()} Queries/month`, enabled: true },
                                            { text: 'Advanced Analytics', enabled: tier.analytics_enabled },
                                            { text: 'Custom Branding', enabled: tier.custom_branding },
                                            { text: 'Priority Support', enabled: tier.priority_support }
                                        ]}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Bottom CTA */}
                    <section className="bottom-cta-section">
                        <div className="bottom-cta-glow" />
                        <div className="section-label" style={{ justifyContent: 'center', display: 'inline-flex', marginBottom: 24 }}>
                            <Zap size={14} />
                            Ready to start?
                        </div>
                        <h2 className="bottom-cta-title">
                            Empower your workforce<br />
                            <span className="text-gradient">with enterprise intelligence</span>
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '1.15rem', maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.6 }}>
                            Deploy a private AI assistant on your company data. No data leaves your tenant. No third-party training.
                        </p>
                        <div className="hero-ctas">
                            <CraftButton onClick={() => openAuth('register')}>
                                <CraftButtonLabel>Get Started</CraftButtonLabel>
                                <CraftButtonIcon>
                                    <ArrowUpRightIcon />
                                </CraftButtonIcon>
                            </CraftButton>
                        </div>
                        <div className="footer-bar">
                            <span>© 2026 CORPWISE</span>
                            <span className="footer-dot" />
                            <span className="footer-link">Privacy</span>
                            <span className="footer-dot" />
                            <span className="footer-link">Terms</span>
                        </div>
                    </section>
                </main>
            </div>

            <AuthSheet
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                defaultMode={authMode}
                onAuthenticated={(companyId, isNewUser) => {
                    setIsAuthOpen(false);
                    // New registrations go to dedicated onboarding, logins go to overview
                    if (isNewUser) {
                        navigate('/onboarding');
                    } else {
                        navigate('/admin/overview');
                    }
                }}
                onSuperAdmin={(_token) => {
                    setIsAuthOpen(false);
                    navigate('/super-admin');
                }}
            />
        </>

    );
}
