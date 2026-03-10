import React, { useRef, useEffect, useCallback } from 'react';

interface Node {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    pulsePhase: number;
    pulseSpeed: number;
    opacity: number;
}

const NeuralBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const nodesRef = useRef<Node[]>([]);
    const mouseRef = useRef({ x: -1000, y: -1000 });

    const CONNECTION_DIST = 160;
    const NODE_COUNT = 80;
    const MOUSE_RADIUS = 200;

    const initNodes = useCallback((w: number, h: number) => {
        const nodes: Node[] = [];
        for (let i = 0; i < NODE_COUNT; i++) {
            nodes.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                radius: 1.5 + Math.random() * 2,
                pulsePhase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.3 + Math.random() * 0.5,
                opacity: 0.3 + Math.random() * 0.4,
            });
        }
        nodesRef.current = nodes;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            if (nodesRef.current.length === 0) {
                initNodes(rect.width, rect.height);
            }
        };

        const handleMouse = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };

        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 };
        };

        resize();
        window.addEventListener('resize', resize);
        canvas.addEventListener('mousemove', handleMouse);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        let time = 0;

        const draw = () => {
            const w = canvas.getBoundingClientRect().width;
            const h = canvas.getBoundingClientRect().height;
            ctx.clearRect(0, 0, w, h);

            time += 0.016;
            const nodes = nodesRef.current;
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;

            // Update positions
            for (const node of nodes) {
                node.x += node.vx;
                node.y += node.vy;

                // Wrap around edges
                if (node.x < -20) node.x = w + 20;
                if (node.x > w + 20) node.x = -20;
                if (node.y < -20) node.y = h + 20;
                if (node.y > h + 20) node.y = -20;

                // Mouse repulsion (gentle)
                const dx = node.x - mx;
                const dy = node.y - my;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MOUSE_RADIUS && dist > 0) {
                    const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * 0.008;
                    node.vx += (dx / dist) * force;
                    node.vy += (dy / dist) * force;
                }

                // Damping
                node.vx *= 0.999;
                node.vy *= 0.999;
            }

            // Draw connections
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < CONNECTION_DIST) {
                        const alpha = (1 - dist / CONNECTION_DIST) * 0.15;

                        // Pulse traveling along connection
                        const pulse = Math.sin(time * 2 + i * 0.3 + j * 0.2) * 0.5 + 0.5;
                        const finalAlpha = alpha * (0.4 + pulse * 0.6);

                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);

                        // Gradient line
                        const gradient = ctx.createLinearGradient(
                            nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y
                        );
                        gradient.addColorStop(0, `rgba(99, 102, 241, ${finalAlpha})`);
                        gradient.addColorStop(0.5, `rgba(129, 140, 248, ${finalAlpha * 1.3})`);
                        gradient.addColorStop(1, `rgba(99, 102, 241, ${finalAlpha})`);

                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }

            // Draw nodes
            for (const node of nodes) {
                const pulse = Math.sin(time * node.pulseSpeed + node.pulsePhase) * 0.5 + 0.5;
                const glowRadius = node.radius + pulse * 3;
                const alpha = node.opacity * (0.5 + pulse * 0.5);

                // Outer glow
                const glow = ctx.createRadialGradient(
                    node.x, node.y, 0,
                    node.x, node.y, glowRadius * 3
                );
                glow.addColorStop(0, `rgba(129, 140, 248, ${alpha * 0.4})`);
                glow.addColorStop(0.5, `rgba(99, 102, 241, ${alpha * 0.1})`);
                glow.addColorStop(1, 'rgba(99, 102, 241, 0)');

                ctx.beginPath();
                ctx.arc(node.x, node.y, glowRadius * 3, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();

                // Core dot
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(165, 180, 252, ${alpha})`;
                ctx.fill();
            }

            // Central radial glow (spotlight behind text)
            const centerGlow = ctx.createRadialGradient(
                w / 2, h / 2, 0,
                w / 2, h / 2, Math.max(w, h) * 0.4
            );
            centerGlow.addColorStop(0, 'rgba(79, 70, 229, 0.08)');
            centerGlow.addColorStop(0.4, 'rgba(67, 56, 202, 0.04)');
            centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = centerGlow;
            ctx.fillRect(0, 0, w, h);

            animRef.current = requestAnimationFrame(draw);
        };

        animRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousemove', handleMouse);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [initNodes]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
                zIndex: 0,
            }}
        />
    );
};

export default NeuralBackground;
