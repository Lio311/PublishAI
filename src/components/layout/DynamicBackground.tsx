"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring, useReducedMotion } from 'framer-motion';

export default function DynamicBackground() {
    const shouldReduceMotion = useReducedMotion();
    const [mounted, setMounted] = useState(false);

    // Mouse parallax effects for background blobs
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    
    const springConfig = { damping: 25, stiffness: 120 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    const blob1X = useTransform(springX, v => v * 1.2);
    const blob1Y = useTransform(springY, v => v * 1.2);

    const blob2X = useTransform(springX, v => v * -0.8);
    const blob2Y = useTransform(springY, v => v * -0.8);

    const blob3X = useTransform(springX, v => v * 0.5);
    const blob3Y = useTransform(springY, v => v * 0.5);

    const rafId = useRef<number | null>(null);

    useEffect(() => {
        setMounted(true);

        if (shouldReduceMotion) return;

        // Skip mouse tracking on devices with no fine pointer (e.g., pure touchscreens/mobile)
        if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
            return;
        }

        let innerWidth = window.innerWidth;
        let innerHeight = window.innerHeight;

        const handleResize = () => {
            innerWidth = window.innerWidth;
            innerHeight = window.innerHeight;
        };

        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (rafId.current) return;
            
            rafId.current = requestAnimationFrame(() => {
                const { clientX, clientY } = e;
                const moveX = (clientX - innerWidth / 2) * 1.2;
                const moveY = (clientY - innerHeight / 2) * 1.2;
                mouseX.set(moveX);
                mouseY.set(moveY);
                rafId.current = null;
            });
        };

        window.addEventListener('resize', handleResize, { passive: true });
        window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
            }
        };
    }, [mouseX, mouseY, shouldReduceMotion]);

    const disableMotion = !mounted || shouldReduceMotion;

    return (
        <div 
            className="fixed inset-0 z-[-1] min-h-screen w-full bg-slate-50 overflow-hidden pointer-events-none" 
            dir="ltr"
            aria-hidden="true"
        >
            {/* Dynamic animated background */}
            <motion.div 
                style={{ x: disableMotion ? 0 : blob1X, y: disableMotion ? 0 : blob1Y }} 
                className="absolute top-0 left-0 w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] will-change-transform"
            >
                <motion.div 
                    animate={disableMotion ? undefined : { 
                        x: [0, 100, -100, 0],
                        y: [0, 50, -50, 0],
                        scale: [1, 1.2, 0.8, 1]
                    }}
                    transition={disableMotion ? undefined : { repeat: Infinity, duration: 15, ease: "linear" }}
                    className="w-full h-full bg-blue-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-40"
                />
            </motion.div>

            <motion.div 
                style={{ x: disableMotion ? 0 : blob2X, y: disableMotion ? 0 : blob2Y }} 
                className="absolute bottom-0 right-0 w-[60vw] h-[60vw] max-w-[900px] max-h-[900px] will-change-transform"
            >
                <motion.div 
                    animate={disableMotion ? undefined : { 
                        x: [0, -150, 100, 0],
                        y: [0, -100, 100, 0],
                        scale: [1, 1.5, 1, 1]
                    }}
                    transition={disableMotion ? undefined : { repeat: Infinity, duration: 20, ease: "linear" }}
                    className="w-full h-full bg-blue-300 rounded-full mix-blend-multiply filter blur-[150px] opacity-40"
                />
            </motion.div>

            <motion.div 
                style={{ x: disableMotion ? 0 : blob3X, y: disableMotion ? 0 : blob3Y }} 
                className="absolute top-1/2 left-1/4 w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] will-change-transform"
            >
                <motion.div 
                    animate={disableMotion ? undefined : { 
                        x: [0, 50, -150, 0],
                        y: [0, 150, -50, 0],
                        scale: [1, 0.9, 1.3, 1]
                    }}
                    transition={disableMotion ? undefined : { repeat: Infinity, duration: 18, ease: "linear" }}
                    className="w-full h-full bg-cyan-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-50"
                />
            </motion.div>
            
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[10px]" />
        </div>
    );
}
