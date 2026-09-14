"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, useSpring } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';

export default function GlobalPasswordProtection({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [token, setToken] = useState('');
    const [authError, setAuthError] = useState<string | false>(false);
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    const x = useMotionValue(0);
    const background = useTransform(
        x,
        [0, containerWidth > 0 ? containerWidth - 56 : 0],
        ['rgba(0, 0, 0, 0.02)', 'rgba(0, 0, 0, 0.1)']
    );

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

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const moveX = (clientX - window.innerWidth / 2) * 0.1;
        const moveY = (clientY - window.innerHeight / 2) * 0.1;
        mouseX.set(moveX);
        mouseY.set(moveY);
    };

    useEffect(() => {
        const authTime = localStorage.getItem('publishai_global_auth_time');
        const now = new Date().getTime();
        
        // 24 hours in milliseconds = 86400000
        if (authTime && (now - parseInt(authTime, 10)) < 86400000) {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
            localStorage.removeItem('publishai_global_auth_time');
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated && containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth);
        }
    }, [isAuthenticated]);

    const handleLogin = async () => {
        if (isAuthLoading || token.length < 1) return;
        setAuthError(false);
        setIsAuthLoading(true);

        await new Promise(resolve => setTimeout(resolve, 500));

        if (token === 'חבוב') {
            localStorage.setItem('publishai_global_auth_time', new Date().getTime().toString());
            setIsAuthenticated(true);
        } else {
            setAuthError('סיסמה שגויה');
            setToken('');
            animate(x, 0, { type: 'spring', bounce: 0.2 });
        }
        setIsAuthLoading(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleLogin();
    };

    const disabled = isAuthLoading || token.length < 1;

    const handleDragEnd = () => {
        if (x.get() > containerWidth * 0.55 && !disabled) {
            handleLogin();
            animate(x, containerWidth - 56, { type: 'spring', bounce: 0, duration: 0.3 });
        } else {
            animate(x, 0, { type: 'spring', bounce: 0.2, duration: 0.4 });
        }
    };

    if (isAuthenticated === null) return null;

    if (!isAuthenticated) {
        return (
            <div 
                className="fixed inset-0 z-[100] min-h-screen w-full bg-slate-50 flex items-center justify-center overflow-hidden" 
                dir="ltr"
                onMouseMove={handleMouseMove}
            >
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
                
                <div className="absolute inset-0 bg-white/30 backdrop-blur-[10px] pointer-events-none"></div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="z-10 w-full max-w-md p-8"
                >
                    <div className="backdrop-blur-2xl bg-white border border-slate-200 rounded-3xl p-10 shadow-xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent opacity-50"></div>
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="w-56 h-auto flex items-center justify-center mb-6"
                            >
                                <Image src="/logo.png" alt="PublishAI Logo" width={224} height={224} className="w-full h-auto object-contain drop-shadow-xl" priority />
                            </motion.div>
                            
                            <p className="text-slate-600 font-medium text-sm mb-8 tracking-widest text-center w-full block uppercase">אזור מאובטח</p>

                            <form onSubmit={handleSubmit} className="w-full">
                                <div className="relative mb-6" dir="rtl">
                                    <input
                                        type="password"
                                        value={token}
                                        onChange={(e) => {
                                            setToken(e.target.value);
                                            setAuthError(false);
                                            animate(x, 0, { type: 'spring', bounce: 0.2 });
                                        }}
                                        className={`w-full bg-slate-50 border text-center text-xl tracking-wider font-mono ${authError ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-slate-300'} rounded-xl py-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 ${authError ? 'focus:ring-red-100' : 'focus:ring-slate-100'} transition-all duration-300`}
                                        placeholder="סיסמה"
                                        disabled={isAuthLoading}
                                        autoFocus
                                    />
                                    {authError && <p className="text-red-500 text-sm mt-2 text-center">{authError}</p>}
                                </div>

                                <div dir="ltr" ref={containerRef} className="relative w-full h-14 bg-slate-50 rounded-full overflow-hidden flex items-center justify-center border border-slate-200 mt-4">
                                    <motion.div style={{ background }} className="absolute inset-0 z-0" />
                                    <span className="text-slate-400 font-medium z-0 select-none text-sm tracking-wider uppercase">
                                        {isAuthLoading ? 'Unlocking...' : 'Slide to unlock'}
                                    </span>
                                    
                                    {!isAuthLoading && (
                                        <motion.div
                                            drag={disabled ? false : "x"}
                                            dragConstraints={{ left: 0, right: containerWidth > 0 ? containerWidth - 56 : 0 }}
                                            dragElastic={0.05}
                                            onDragEnd={handleDragEnd}
                                            style={{ x }}
                                            className={`absolute left-1 w-12 h-12 bg-white rounded-full z-10 flex items-center justify-center shadow-md border border-slate-100 ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                                        >
                                            <ChevronRight className="w-5 h-5 text-slate-800" />
                                        </motion.div>
                                    )}
                                    {isAuthLoading && (
                                        <div className="absolute right-1 w-12 h-12 bg-white rounded-full z-10 flex items-center justify-center shadow-md border border-slate-100">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                className="w-5 h-5 border-2 border-slate-200 border-t-slate-800 rounded-full"
                                            />
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return <>{children}</>;
}
