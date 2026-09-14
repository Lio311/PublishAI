"use client";

import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

export default function DynamicBackground() {
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

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const moveX = (clientX - window.innerWidth / 2) * 1.2;
            const moveY = (clientY - window.innerHeight / 2) * 1.2;
            mouseX.set(moveX);
            mouseY.set(moveY);
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
    }, [mouseX, mouseY]);

    return (
        <div className="fixed inset-0 z-[-1] min-h-screen w-full bg-slate-50 overflow-hidden pointer-events-none" dir="ltr">
            {/* Dynamic animated background */}
            <motion.div style={{ x: blob1X, y: blob1Y }} className="absolute top-0 left-0 w-[50vw] h-[50vw] max-w-[800px] max-h-[800px]">
                <motion.div 
                    animate={{ 
                        x: [0, 100, -100, 0],
                        y: [0, 50, -50, 0],
                        scale: [1, 1.2, 0.8, 1]
                    }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    className="w-full h-full bg-blue-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-40"
                />
            </motion.div>

            <motion.div style={{ x: blob2X, y: blob2Y }} className="absolute bottom-0 right-0 w-[60vw] h-[60vw] max-w-[900px] max-h-[900px]">
                <motion.div 
                    animate={{ 
                        x: [0, -150, 100, 0],
                        y: [0, -100, 100, 0],
                        scale: [1, 1.5, 1, 1]
                    }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="w-full h-full bg-indigo-300 rounded-full mix-blend-multiply filter blur-[150px] opacity-40"
                />
            </motion.div>

            <motion.div style={{ x: blob3X, y: blob3Y }} className="absolute top-1/2 left-1/4 w-[40vw] h-[40vw] max-w-[600px] max-h-[600px]">
                <motion.div 
                    animate={{ 
                        x: [0, 50, -150, 0],
                        y: [0, 150, -50, 0],
                        scale: [1, 0.9, 1.3, 1]
                    }}
                    transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                    className="w-full h-full bg-cyan-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-50"
                />
            </motion.div>
            
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[10px]"></div>
        </div>
    );
}
