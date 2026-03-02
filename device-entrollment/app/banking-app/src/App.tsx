import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import axios from 'axios';
import {
    BanknotesIcon,
    CreditCardIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ArrowRightOnRectangleIcon,
    ShieldCheckIcon,
    DevicePhoneMobileIcon,
    ComputerDesktopIcon,
    ExclamationCircleIcon,
    BuildingLibraryIcon,
    UserCircleIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DES_BASE_URL: string = import.meta.env.VITE_DES_BASE_URL ?? 'http://localhost:8080';

// localStorage key used to persist the device ID across the SSO redirect
const LS_DEVICE_ID = 'banking_device_id';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EnrolledDevice {
    Id: string;
    deviceName: string;
    deviceType: string;
}

interface Transaction {
    id: number;
    desc: string;
    amount: number;
    date: string;
    category: string;
}

// ---------------------------------------------------------------------------
// Mock banking data
// ---------------------------------------------------------------------------

const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 1, desc: 'Netflix Subscription',  amount: -15.99,  date: '2026-02-26', category: 'Entertainment' },
    { id: 2, desc: 'Payroll Deposit',        amount: 3500.00, date: '2026-02-25', category: 'Income'         },
    { id: 3, desc: 'Whole Foods Market',     amount: -87.43,  date: '2026-02-24', category: 'Grocery'        },
    { id: 4, desc: 'Electric Bill',          amount: -124.00, date: '2026-02-23', category: 'Utilities'      },
    { id: 5, desc: 'Coffee Shop',            amount: -6.50,   date: '2026-02-22', category: 'Food & Drink'   },
    { id: 6, desc: 'ATM Withdrawal',         amount: -200.00, date: '2026-02-21', category: 'Cash'           },
    { id: 7, desc: 'Amazon Purchase',        amount: -49.99,  date: '2026-02-20', category: 'Shopping'       },
];

// ---------------------------------------------------------------------------
// App component
// ---------------------------------------------------------------------------

const App: React.FC = () => {
    const { state, signIn, signOut } = useAuthContext();

    // Device ID the user types before signing in.  Seeded from localStorage so
    // the field is pre-filled if the user has authenticated before.
    const [deviceId, setDeviceId] = useState<string>(
        () => localStorage.getItem(LS_DEVICE_ID) ?? ''
    );
    const [deviceError, setDeviceError] = useState<string | null>(null);

    // Rich device info fetched from DES after login (shown in the dashboard badge)
    const [activeDevice, setActiveDevice] = useState<EnrolledDevice | null>(null);

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Read error params injected by the adaptive script via sendError() redirect.
    // WSO2 IS redirects to this app with ?status=...&statusMsg=... when device
    // authentication fails. We capture them once on mount and immediately strip them
    // from the URL so they don't persist in browser history.
    const [adaptiveError, setAdaptiveError] = useState<{ status: string; statusMsg: string | null } | null>(() => {
        const p = new URLSearchParams(window.location.search);
        const status = p.get('status');
        if (!status) return null;
        const clean = new URL(window.location.href);
        ['status', 'statusMsg', 'i18nkey'].forEach(k => clean.searchParams.delete(k));
        window.history.replaceState({}, '', clean.toString());
        return { status, statusMsg: p.get('statusMsg') };
    });

    const handleRetry = () => setAdaptiveError(null);

    // Parse any OAuth error that WSO2 IS redirected back (e.g. DEVICE_NOT_PERMITTED)
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');
    const oauthErrorDesc = urlParams.get('error_description');

    // After a successful SSO callback:
    //  1. Clean the URL (remove /callback + code params)
    //  2. Fetch device info from DES so the dashboard badge shows the device name
    useEffect(() => {
        if (!state.isAuthenticated) return;

        if (window.location.pathname === '/callback') {
            window.history.replaceState({}, '', '/');
        }

        const storedId = localStorage.getItem(LS_DEVICE_ID);
        if (storedId && state.username) {
            fetchDeviceInfo(storedId);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.isAuthenticated, state.username]);

    // Fetch the enrolled device record from DES to get its display name / type
    const fetchDeviceInfo = async (devId: string): Promise<void> => {
        try {
            const res = await axios.get<EnrolledDevice[]>(
                `${DES_BASE_URL}/device/devices/${state.username}`
            );
            if (Array.isArray(res.data)) {
                const match = res.data.find((d) => d.Id === devId);
                if (match) setActiveDevice(match);
            }
        } catch {
            // Non-critical — the badge falls back to showing the raw device ID
        }
    };

    // ── Sign-in handler ─────────────────────────────────────────────────────────
    const handleSignIn = async (): Promise<void> => {
        const id = deviceId.trim();
        if (!id) {
            setDeviceError('Please enter your Device ID to continue.');
            return;
        }
        setDeviceError(null);

        // Persist so the field is pre-filled after the SSO redirect brings us back
        localStorage.setItem(LS_DEVICE_ID, id);

        // Pass device_id as a custom query parameter to the OIDC authorize request.
        // WSO2 IS reads it in the adaptive script via:
        //   context.request.params.device_id[0]
        // and validates the device against DES before issuing tokens.
        await signIn({ device_id: id });
    };

    // ── Logout handler ──────────────────────────────────────────────────────────
    const handleLogout = async (): Promise<void> => {
        setIsLoggingOut(true);
        const storedId = localStorage.getItem(LS_DEVICE_ID);

        // Notify DES so the active-login counter is decremented for this device
        if (storedId && state.username) {
            try {
                await axios.post(
                    `${DES_BASE_URL}/device/logout/${storedId}/${state.username}`,
                    { status: 'logout' }
                );
            } catch {
                // Non-fatal — proceed with signOut even if DES is unreachable
            }
        }

        localStorage.removeItem(LS_DEVICE_ID);
        await signOut(import.meta.env.VITE_APP_URL ?? window.location.origin);
    };

    // ── Loading / callback-processing state ─────────────────────────────────────
    if (state.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="text-center">
                    <ArrowPathIcon className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-sm font-medium tracking-wide">
                        Completing sign-in…
                    </p>
                </div>
            </div>
        );
    }

    // ── Adaptive authentication error page ──────────────────────────────────────
    // Shown when WSO2 IS redirects back with ?status=...&statusMsg=... after the
    // adaptive script calls sendError() (device not permitted, missing ID, etc.)
    if (adaptiveError && !state.isAuthenticated) {
        const ERROR_TITLES: Record<string, string> = {
            DEVICE_ID_MISSING:      'Device ID Required',
            DEVICE_NOT_PERMITTED:   'Device Not Authorised',
            DES_UNREACHABLE:        'Verification Service Unavailable',
        };
        const errorTitle = ERROR_TITLES[adaptiveError.status] ?? 'Authentication Failed';

        return (
            <div className="flex min-h-screen bg-slate-900 items-center justify-center p-8">
                <div className="w-full max-w-md">

                    {/* Branding */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <BuildingLibraryIcon className="w-9 h-9 text-white" />
                        </div>
                        <span className="font-black text-xl text-white tracking-tighter">SECUREBANK</span>
                    </div>

                    {/* Error card */}
                    <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8">

                        {/* Icon */}
                        <div className="w-16 h-16 bg-red-950/80 border border-red-800/60 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <ExclamationCircleIcon className="w-10 h-10 text-red-400" />
                        </div>

                        <h2 className="text-xl font-black text-white text-center mb-2">{errorTitle}</h2>
                        <p className="text-slate-400 text-sm text-center mb-6 leading-relaxed">
                            Your login attempt was blocked by the security policy.
                        </p>

                        {/* Error details */}
                        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 mb-6">
                            <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-1">Error Code</p>
                            <p className="text-red-300 font-mono text-sm font-bold mb-4">{adaptiveError.status}</p>
                            {adaptiveError.statusMsg && (
                                <>
                                    <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-1">Details</p>
                                    <p className="text-red-200 text-sm leading-relaxed">{adaptiveError.statusMsg}</p>
                                </>
                            )}
                        </div>

                        <button
                            onClick={handleRetry}
                            className="w-full py-3.5 rounded-xl font-black text-white text-sm uppercase tracking-widest
                                       bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all duration-150
                                       shadow-lg shadow-emerald-900/40"
                        >
                            ← Try Again
                        </button>
                    </div>

                    <div className="mt-5 flex items-center justify-center gap-2 text-slate-600 text-xs">
                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                        <span>Secured by WSO2 Identity Server</span>
                    </div>
                </div>
            </div>
        );
    }

    // ── Login page ───────────────────────────────────────────────────────────────
    if (!state.isAuthenticated) {
        return (
            <div className="flex min-h-screen bg-slate-900">

                {/* ── Left branding panel (desktop only) ── */}
                <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 flex-col justify-center items-center p-16 relative overflow-hidden">
                    {/* Dot-grid background */}
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                        }}
                    />
                    <div className="relative z-10 text-center max-w-sm">
                        <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30">
                            <BuildingLibraryIcon className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-white mb-3">SecureBank</h1>
                        <p className="text-emerald-300 text-base font-medium mb-12 leading-relaxed">
                            Device-Aware Banking Authentication
                        </p>
                        <div className="space-y-5 text-left">
                            {[
                                'Device-bound login — only your enrolled hardware',
                                'Concurrent session limits per device',
                                'Real-time fraud prevention via WSO2 IS',
                            ].map((feature) => (
                                <div key={feature} className="flex items-start gap-3 text-slate-300">
                                    <ShieldCheckIcon className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm font-medium leading-snug">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right login form ── */}
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-full max-w-md">

                        {/* Mobile-only logo */}
                        <div className="lg:hidden text-center mb-10">
                            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <BuildingLibraryIcon className="w-9 h-9 text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-white">SecureBank</h1>
                        </div>

                        <h2 className="text-3xl font-black text-white mb-1">Sign In</h2>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            Enter your enrolled{' '}
                            <span className="text-emerald-400 font-semibold">Device ID</span>, then
                            authenticate via your organisation's SSO.
                        </p>

                        {/* OAuth error banner (WSO2 IS redirected back with an error) */}
                        {oauthError && (
                            <div className="mb-6 bg-red-950/60 border border-red-800 rounded-xl p-4 flex items-start gap-3">
                                <ExclamationCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-red-300 text-sm font-bold">
                                        {oauthError.replace(/_/g, ' ')}
                                    </p>
                                    {oauthErrorDesc && (
                                        <p className="text-red-400 text-xs mt-1">
                                            {decodeURIComponent(oauthErrorDesc)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Device ID field */}
                        <div className="mb-5">
                            <label className="block text-slate-300 text-xs font-bold uppercase tracking-widest mb-2">
                                Device ID
                            </label>
                            <input
                                type="text"
                                value={deviceId}
                                onChange={(e) => {
                                    setDeviceId(e.target.value);
                                    setDeviceError(null);
                                }}
                                onKeyDown={(e) => { if (e.key === 'Enter') void handleSignIn(); }}
                                placeholder="e.g. 1753123456789"
                                className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3.5
                                           text-white placeholder-slate-500 font-mono text-sm outline-none
                                           focus:border-emerald-500 transition-colors"
                            />
                            {deviceError && (
                                <p className="flex items-center gap-1.5 mt-2 text-red-400 text-xs font-medium">
                                    <ExclamationCircleIcon className="w-4 h-4" />
                                    {deviceError}
                                </p>
                            )}
                            <p className="mt-2 text-slate-500 text-xs">
                                Find your Device ID in the{' '}
                                <span className="text-emerald-500 font-semibold">Device Manager</span> portal
                                (port 5173).
                            </p>
                        </div>

                        {/* Sign-in button */}
                        <button
                            onClick={() => { void handleSignIn(); }}
                            className="w-full py-4 rounded-xl font-black text-white text-sm uppercase tracking-widest
                                       bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all duration-150
                                       shadow-lg shadow-emerald-900/40"
                        >
                            Authenticate with SSO →
                        </button>

                        <div className="mt-5 flex items-center justify-center gap-2 text-slate-600 text-xs">
                            <ShieldCheckIcon className="w-3.5 h-3.5" />
                            <span>Secured by WSO2 Identity Server</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Banking dashboard ────────────────────────────────────────────────────────
    const storedDeviceId = localStorage.getItem(LS_DEVICE_ID) ?? deviceId;
    const firstName = (state.displayName || state.username || 'User').split(' ')[0];

    return (
        <div className="min-h-screen bg-slate-50">

            {/* Nav */}
            <nav className="bg-slate-900 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <BuildingLibraryIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black text-xl text-white tracking-tighter">SECUREBANK</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full">
                        <UserCircleIcon className="w-4 h-4 text-emerald-400" />
                        <span className="text-white text-xs font-bold">{state.username}</span>
                    </div>
                    <button
                        onClick={() => { void handleLogout(); }}
                        disabled={isLoggingOut}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors
                                   text-sm font-medium disabled:opacity-50"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">
                            {isLoggingOut ? 'Signing out…' : 'Sign Out'}
                        </span>
                    </button>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto p-6 md:p-10">

                {/* Welcome row + active device badge */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">
                            Welcome back, {firstName}!
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>

                    {/* Active device badge — shows device name once fetched from DES */}
                    <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5 self-start sm:self-auto">
                        {activeDevice?.deviceType === 'Smartphone'
                            ? <DevicePhoneMobileIcon className="w-5 h-5 text-emerald-600" />
                            : <ComputerDesktopIcon className="w-5 h-5 text-emerald-600" />
                        }
                        <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                Active Device
                            </p>
                            <p className="text-sm font-bold text-emerald-900 leading-tight">
                                {activeDevice ? activeDevice.deviceName : storedDeviceId}
                            </p>
                        </div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    </div>
                </div>

                {/* Account cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                    {/* Checking */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                                    Checking Account
                                </p>
                                <p className="text-slate-400 text-xs mt-1 font-mono">•••• •••• •••• 4821</p>
                            </div>
                            <CreditCardIcon className="w-8 h-8 text-slate-500" />
                        </div>
                        <p className="text-4xl font-black">$12,450.87</p>
                        <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs font-bold">
                            <ArrowDownIcon className="w-4 h-4" />
                            +$3,500.00 this month
                        </div>
                    </div>

                    {/* Savings */}
                    <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-3xl p-8 text-white shadow-xl">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest">
                                    Savings Account
                                </p>
                                <p className="text-emerald-300 text-xs mt-1 font-mono">•••• •••• •••• 2934</p>
                            </div>
                            <BanknotesIcon className="w-8 h-8 text-emerald-300" />
                        </div>
                        <p className="text-4xl font-black">$8,200.00</p>
                        <div className="flex items-center gap-1 mt-2 text-emerald-300 text-xs font-bold">
                            <ArrowUpIcon className="w-4 h-4" />
                            2.5% APY — high-yield savings
                        </div>
                    </div>
                </div>

                {/* Recent transactions */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100">
                        <h2 className="text-lg font-black text-slate-900">Recent Transactions</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {MOCK_TRANSACTIONS.map((tx) => (
                            <div
                                key={tx.id}
                                className="flex items-center justify-between px-8 py-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${tx.amount > 0 ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                        {tx.amount > 0
                                            ? <ArrowDownIcon className="w-5 h-5 text-emerald-600" />
                                            : <ArrowUpIcon className="w-5 h-5 text-slate-500" />
                                        }
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{tx.desc}</p>
                                        <p className="text-xs text-slate-400">{tx.date} · {tx.category}</p>
                                    </div>
                                </div>
                                <p className={`font-black text-sm ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                                    {tx.amount > 0 ? '+' : '−'}${Math.abs(tx.amount).toFixed(2)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
