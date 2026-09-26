"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';
import Image from 'next/image';
import { useSession, signIn } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

export default function GlobalPasswordProtection({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const t = useTranslations("Auth");
    const locale = useLocale();
    const isPublicRoute = pathname?.includes('/architecture') || pathname?.includes('/flowchart') || pathname?.includes('/login') || pathname?.includes('/register');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isChecking, setIsChecking] = useState<boolean>(true);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [shake, setShake] = useState(false);
    const { status } = useSession();

    const pinRef = useRef(pin);
    const isAuthLoadingRef = useRef(isAuthLoading);
    const pinErrorRef = useRef(pinError);
    const isMountedRef = useRef(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        pinRef.current = pin;
    }, [pin]);

    useEffect(() => {
        isAuthLoadingRef.current = isAuthLoading;
    }, [isAuthLoading]);

    useEffect(() => {
        pinErrorRef.current = pinError;
    }, [pinError]);

    // Track mounted status and clean up timers on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const authTime = localStorage.getItem('publishai_global_auth_time_v2');
        const now = new Date().getTime();
        
        // 24 hours in milliseconds = 86400000
        if (authTime && (now - parseInt(authTime, 10)) < 86400000) {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
            localStorage.removeItem('publishai_global_auth_time_v2');
        }
        setIsChecking(false);
    }, []);

    const verifyPin = useCallback(async (currentPin: string) => {
        if (isAuthLoadingRef.current) return;
        setIsAuthLoading(true);
        isAuthLoadingRef.current = true;
        
        await new Promise(resolve => setTimeout(resolve, 400));
        if (!isMountedRef.current) return;
        
        if (currentPin === (process.env.NEXT_PUBLIC_SITE_PIN || '2580')) {
            localStorage.setItem('publishai_global_auth_time_v2', new Date().getTime().toString());
            setIsAuthenticated(true);
            setIsAuthLoading(false);
            isAuthLoadingRef.current = false;
        } else {
            setPinError(true);
            pinErrorRef.current = true;
            setShake(true);
            timeoutRef.current = setTimeout(() => {
                if (!isMountedRef.current) return;
                setShake(false);
                pinRef.current = '';
                setPin('');
                setPinError(false);
                pinErrorRef.current = false;
                setIsAuthLoading(false);
                isAuthLoadingRef.current = false;
            }, 400);
        }
    }, []);

    const handleKeyPress = useCallback((num: string) => {
        if (pinRef.current.length < 4 && !isAuthLoadingRef.current && !pinErrorRef.current) {
            const newPin = pinRef.current + num;
            pinRef.current = newPin;
            setPin(newPin);
            if (newPin.length === 4) {
                verifyPin(newPin);
            }
        }
    }, [verifyPin]);

    const handleDelete = useCallback(() => {
        if (isAuthLoadingRef.current || pinErrorRef.current || pinRef.current.length === 0) return;
        const newPin = pinRef.current.slice(0, -1);
        pinRef.current = newPin;
        setPin(newPin);
    }, []);

    // Physical keyboard listener for PIN input
    useEffect(() => {
        if (isAuthenticated || isChecking) return;

        const handlePhysicalKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return;
            }

            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                handleKeyPress(e.key);
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                handleDelete();
            }
        };

        window.addEventListener('keydown', handlePhysicalKeyDown);
        return () => window.removeEventListener('keydown', handlePhysicalKeyDown);
    }, [isAuthenticated, isChecking, handleKeyPress, handleDelete]);

    if (isChecking) {
        return (
            <div 
                className="fixed inset-0 z-[100] min-h-screen w-full bg-white/80 flex items-center justify-center"
                role="status"
                aria-live="polite"
            >
                <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" aria-hidden="true" />
                <span className="sr-only">{t("loading")}</span>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div 
                className="fixed inset-0 z-[100] min-h-[100dvh] w-full bg-transparent flex items-center justify-center overflow-y-auto p-4 sm:p-6" 
                dir={locale === 'he' ? 'rtl' : 'ltr'}
                role="dialog"
                aria-modal="true"
                aria-labelledby="pin-security-title"
            >
                {/* Live region announcing entered digits or error to screen readers */}
                <div className="sr-only" role="status" aria-live="polite">
                    {pinError 
                        ? t("invalidPin") 
                        : pin.length > 0 
                            ? t("digitsEntered", { count: pin.length }) 
                            : t("enterPin")}
                </div>
                
                <motion.div 
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="z-10 w-full max-w-md my-auto py-4"
                >
                    <div className="backdrop-blur-2xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent opacity-50" aria-hidden="true" />
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <motion.div 
                                initial={{ scale: 1, opacity: 1 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="w-44 sm:w-56 h-auto flex items-center justify-center mb-4 sm:mb-6"
                            >
                                <Image src="/logo.png" alt="PublishAI Logo" width={224} height={224} className="w-full h-auto object-contain" priority />
                            </motion.div>
                            
                            <p id="pin-security-title" className="text-slate-600 font-medium text-xs sm:text-sm mb-6 sm:mb-8 tracking-widest text-center w-full block uppercase">{t("secureArea")}</p>

                            <div className="w-full flex flex-col items-center">
                                {/* PIN Dots */}
                                <motion.div 
                                    animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                                    transition={{ duration: 0.4 }}
                                    className="flex gap-4 sm:gap-6 mb-6 sm:mb-8 mt-1 justify-center"
                                    dir="ltr"
                                    aria-hidden="true"
                                >
                                    {[0, 1, 2, 3].map(i => (
                                        <div 
                                            key={i} 
                                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 transition-all duration-200 ${
                                                pinError ? 'border-red-400 bg-red-400' :
                                                i < pin.length ? 'border-slate-800 bg-slate-800' : 'border-slate-300 bg-transparent'
                                            }`} 
                                        />
                                    ))}
                                </motion.div>

                                {/* Keypad */}
                                <div className="grid grid-cols-3 gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-3 sm:gap-y-5 md:gap-y-6 w-full max-w-[280px] place-items-center" dir="ltr">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                        <button
                                            key={num}
                                            type="button"
                                            aria-label={num.toString()}
                                            onClick={() => handleKeyPress(num.toString())}
                                            disabled={isAuthLoading}
                                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-50/50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-xl sm:text-2xl font-medium text-slate-800 transition-colors active:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-50"
                                        >
                                            {num}
                                        </button>
                                    ))}
                                    <div aria-hidden="true"></div>
                                    <button
                                        type="button"
                                        aria-label="0"
                                        onClick={() => handleKeyPress('0')}
                                        disabled={isAuthLoading}
                                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-50/50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-xl sm:text-2xl font-medium text-slate-800 transition-colors active:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-50"
                                    >
                                        0
                                    </button>
                                    <button
                                        type="button"
                                        aria-label={t("deleteDigit")}
                                        title={t("deleteDigit")}
                                        onClick={handleDelete}
                                        disabled={isAuthLoading || pin.length === 0}
                                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        <Delete className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (status === 'loading') {
        return (
            <div 
                className="fixed inset-0 z-[100] min-h-screen w-full bg-white/80 flex items-center justify-center"
                role="status"
                aria-live="polite"
            >
                <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" aria-hidden="true" />
                <span className="sr-only">{t("loading")}</span>
            </div>
        );
    }

    if (status === 'unauthenticated' && !isPublicRoute) {
        return (
            <div 
                className="fixed inset-0 z-[100] min-h-[100dvh] w-full bg-transparent flex items-center justify-center overflow-y-auto p-4 sm:p-6" 
                dir={locale === 'he' ? 'rtl' : 'ltr'}
                role="dialog"
                aria-modal="true"
                aria-labelledby="auth-signin-title"
            >
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="z-10 w-full max-w-md my-auto py-4"
                >
                    <div className="backdrop-blur-2xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent opacity-50" aria-hidden="true"></div>
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="w-44 sm:w-56 h-auto flex items-center justify-center mb-4 sm:mb-6"
                            >
                                <Image src="/logo.png" alt="PublishAI Logo" width={224} height={224} className="w-full h-auto object-contain" priority />
                            </motion.div>
                            
                            <p id="auth-signin-title" className="text-slate-600 font-medium text-xs sm:text-sm mb-6 sm:mb-8 tracking-widest text-center w-full block uppercase">{t("signInTitle")}</p>

                            <div className="w-full flex flex-col items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => signIn('google', { callbackUrl: pathname || '/' })}
                                    className="flex w-full items-center justify-center gap-3 px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl font-medium text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 transition-all shadow-xs active:scale-[0.98]"
                                >
                                    <svg className="h-5 w-5 shrink-0" aria-hidden="true" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                        <path d="M1 1h22v22H1z" fill="none" />
                                    </svg>
                                    <span>{t("signInWithGoogle")}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return <>{children}</>;
}
