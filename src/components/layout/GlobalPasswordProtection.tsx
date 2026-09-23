"use client";
import React, { useState, useEffect } from 'react';

export default function GlobalPasswordProtection({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (process.env.NEXT_PUBLIC_E2E_TEST === 'true') {
            setIsAuthenticated(true);
            return;
        }
        const auth = sessionStorage.getItem('publishai_global_auth');
        setIsAuthenticated(auth === 'true');
    }, []);

    if (!mounted) {
        return <div style={{background: 'red', color: 'white', padding: '20px'}}>LOADING AUTH...</div>;
    }

    if (!isAuthenticated) {
        return (
            <div style={{background: 'blue', color: 'white', padding: '20px'}}>
                <h1>PLEASE LOGIN</h1>
                <button onClick={() => {
                    sessionStorage.setItem('publishai_global_auth', 'true');
                    setIsAuthenticated(true);
                }}>Login</button>
            </div>
        );
    }

    return <>{children}</>;
}
