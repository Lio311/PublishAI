"use client";

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Delete } from 'lucide-react';
import Image from 'next/image';

export default function GlobalPasswordProtection({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [shake, setShake] = useState(false);

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
        const moveX = (clientX - window.innerWidth / 2) * 0.4;
        const moveY = (clientY - window.innerHeight / 2) * 0.4;
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

    const verifyPin = async (currentPin: string) => {
        if (isAuthLoading) return;
        setIsAuthLoading(true);
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        if (currentPin === '3197') {
            localStorage.setItem('publishai_global_auth_time', new Date().getTime().toString());
            setIsAuthenticated(true);
        } else {
            setPinError(true);
            setShake(true);
            setTimeout(() => {
                setShake(false);
                setPin('');
                setPinError(false);
            }, 400);
        }
        setIsAuthLoading(false);
    };

    const handleKeyPress = (num: string) => {
        if (pin.length < 4 && !isAuthLoading && !pinError) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                verifyPin(newPin);
            }
        }
    };

    const handleDelete = () => {
        if (isAuthLoading || pinError) return;
        setPin(prev => prev.slice(0, -1));
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
                                <Image src="/logo.png" alt="PublishAI Logo" width={224} height={224} className="w-full h-auto object-contain" priority />
                            </motion.div>
                            
                            <p className="text-slate-600 font-medium text-sm mb-8 tracking-widest text-center w-full block uppercase">אזור מאובטח</p>

                            <div className="w-full flex flex-col items-center">
                                {/* PIN Dots */}
                                <motion.div 
                                    animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                                    transition={{ duration: 0.4 }}
                                    className="flex gap-6 mb-8 mt-2 justify-center"
                                    dir="ltr"
                                >
                                    {[0, 1, 2, 3].map(i => (
                                        <div 
                                            key={i} 
                                            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                                                pinError ? 'border-red-400 bg-red-400' :
                                                i < pin.length ? 'border-slate-800 bg-slate-800' : 'border-slate-300 bg-transparent'
                                            }`} 
                                        />
                                    ))}
                                </motion.div>

                                {/* Keypad */}
                                <div className="grid grid-cols-3 gap-x-8 gap-y-6 w-full max-w-[280px]" dir="ltr">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => handleKeyPress(num.toString())}
                                            disabled={isAuthLoading}
                                            className="w-16 h-16 rounded-full bg-slate-50/50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl font-medium text-slate-800 transition-colors active:bg-slate-200 disabled:opacity-50"
                                        >
                                            {num}
                                        </button>
                                    ))}
                                    <div></div>
                                    <button
                                        onClick={() => handleKeyPress('0')}
                                        disabled={isAuthLoading}
                                        className="w-16 h-16 rounded-full bg-slate-50/50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl font-medium text-slate-800 transition-colors active:bg-slate-200 disabled:opacity-50"
                                    >
                                        0
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isAuthLoading || pin.length === 0}
                                        className="w-16 h-16 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors active:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        <Delete className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return <>{children}</>;
}
