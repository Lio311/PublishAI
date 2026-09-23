"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, animate, useTransform } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';

export default function GlobalPasswordProtection({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(false);
    const [token, setToken] = useState('');
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [authError, setAuthError] = useState<string | false>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    const x = useMotionValue(0);
    const background = useTransform(
        x,
        [0, Math.max(1, containerWidth - 56)],
        ['rgba(0, 0, 0, 0.02)', 'rgba(0, 0, 0, 0.1)']
    );

    useEffect(() => {
        // Bypass for E2E testing
        if (process.env.NEXT_PUBLIC_E2E_TEST === 'true') {
            setIsAuthenticated(true);
            return;
        }

        const auth = sessionStorage.getItem('publishai_global_auth');
        if (auth === 'true') {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
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
            sessionStorage.setItem('publishai_global_auth', 'true');
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
            <div className="fixed inset-0 z-[100] min-h-screen w-full bg-slate-50 flex items-center justify-center overflow-hidden" dir="ltr">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-slate-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40"></div>
                
                <motion.div 
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="z-10 w-full max-w-md p-8"
                >
                    <div className="backdrop-blur-2xl bg-white border border-slate-200 rounded-3xl p-10 shadow-xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent opacity-50"></div>
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <motion.div 
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 border border-slate-100 shadow-sm overflow-hidden p-2"
                            >
                                <Image src="/logo.png" alt="PublishAI Logo" width={48} height={48} className="w-full h-full object-contain" />
                            </motion.div>
                            
                            <h2 className="text-slate-800 text-2xl font-bold tracking-wider mb-2 uppercase">PublishAI</h2>
                            
                            <p className="text-slate-500 text-sm mb-8 tracking-widest text-center w-full block uppercase">אזור מאובטח</p>

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

                                    <div dir="ltr" ref={containerRef} className="relative w-full h-14 bg-slate-50 rounded-full overflow-hidden flex items-center justify-center border border-slate-200 mt-4 touch-none">
                                        <motion.div style={{ background }} className="absolute inset-0 z-0" />
                                        <span className="text-slate-400 font-medium z-0 select-none text-sm tracking-wider uppercase pointer-events-none">
                                            {isAuthLoading ? 'Unlocking...' : 'Slide to unlock'}
                                        </span>
                                        
                                        {!isAuthLoading && (
                                            <motion.div
                                                drag={disabled ? false : "x"}
                                                dragConstraints={{ left: 0, right: Math.max(1, containerWidth - 56) }}
                                                dragElastic={0.05}
                                                onDragEnd={handleDragEnd}
                                                style={{ x }}
                                                className={`absolute left-1 w-12 h-12 bg-white rounded-full z-10 flex items-center justify-center shadow-md border border-slate-100 touch-none ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                                            >
                                                <ChevronRight className="w-5 h-5 text-slate-800 pointer-events-none" />
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
