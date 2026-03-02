import React, { useState, useEffect } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import axios from "axios";
import {
    DevicePhoneMobileIcon,
    ComputerDesktopIcon,
    TrashIcon,
    ArrowRightOnRectangleIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    SignalIcon
} from "@heroicons/react/24/outline";

// --- Types & Interfaces based on Service Definition ---
interface Device {
    Id: string;
    deviceName: string;
    deviceType: string;
}

interface ActiveLogin {
    Id: string;
    deviceName: string;
    loginTimestamp: string;
}

const API_BASE_URL = "http://localhost:8080";

const App: React.FC = () => {
    const { state, signIn, signOut } = useAuthContext();

    // Form and Data State
    const [deviceName, setDeviceName] = useState<string>("");
    const [devices, setDevices] = useState<Device[]>([]);
    const [activeLogins, setActiveLogins] = useState<ActiveLogin[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // --- API Functions ---

    // Fetch all registered devices [cite: 3]
    // Fetch all registered devices 
    const fetchDevices = async () => {
        if (state.username) {
            try {
                const res = await axios.get(`${API_BASE_URL}/device/devices/${state.username}`);

                // Safety Check: Only set state if the response is a valid array 
                if (Array.isArray(res.data)) {
                    setDevices(res.data);
                    setError(null); // Clear any previous device-loading errors
                } else {
                    // If Ballerina returns an error object, treat it as an empty list 
                    setDevices([]);
                }
            } catch (err: any) {
                console.error("Failed to fetch devices", err);
                setDevices([]); // Fallback to empty list on 404/500 errors
                setError(err.response?.data?.error || "Unable to connect to device service.");
            }
        }
    };

    // Fetch active logins [cite: 3]
    const fetchActiveLogins = async () => {
        if (state.username) {
            try {
                const res = await axios.get(`${API_BASE_URL}/device/active_logins/${state.username}`);
                // Ensure the data is an array before setting state 
                if (Array.isArray(res.data)) {
                    setActiveLogins(res.data);
                } else {
                    setActiveLogins([]); // Fallback to empty array if it's a single object error
                }
            } catch (err) {
                console.error("Failed to fetch active logins");
                setActiveLogins([]); // Reset to empty array on 404/500 errors 
            }
        }
    };

    useEffect(() => {
        if (state.isAuthenticated) {
            fetchDevices();
            fetchActiveLogins();
        }
    }, [state.isAuthenticated, state.username]);

    // Enrollment Handler [cite: 3]
    const handleEnroll = async (type: "Mobile" | "PC") => {
        if (!deviceName.trim()) {
            setError("Please enter a device name.");
            return;
        }

        const payload = {
            deviceName: deviceName.trim(),
            deviceType: type === "Mobile" ? "Smartphone" : "Laptop", // Mapping for API consistency [cite: 3]
            userName: state.username,
            Id: `${Date.now()}`
        };

        try {
            await axios.post(`${API_BASE_URL}/device`, payload);
            setSuccess(`${deviceName} successfully enrolled!`);
            setDeviceName("");
            setError(null);
            fetchDevices(); // Refresh list
        } catch (err: any) {
            setError(err.response?.data?.error || "Enrollment failed (Max limit: 2).");
        }
    };

    // Deletion Handler [cite: 3]
    const handleDelete = async (deviceId: string) => {
        try {
            await axios.delete(`${API_BASE_URL}/device/${deviceId}/${state.username}`);
            setSuccess("Device removed.");
            fetchDevices(); // Refresh list
        } catch (err) {
            setError("Failed to delete device.");
        }
    };

    // --- Views ---

    // 1. Centered Login View
    if (!state.isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-12 text-center border border-slate-100">
                    <div className="w-20 h-20 bg-[oklch(0.6_0.25_250)] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                        <ComputerDesktopIcon className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Device Portal</h1>
                    <p className="text-slate-500 mb-10 font-medium leading-relaxed">Enroll and manage your authorized hardware securely.</p>

                    <button
                        onClick={() => signIn()}
                        className="w-full py-5 rounded-full font-black text-black uppercase tracking-widest text-xs
                       bg-gradient-to-tr from-[#40E0FF] to-[#00d2ff]
                       shadow-[0_15px_30px_-10px_rgba(64,224,255,0.6)]
                       hover:shadow-[0_20px_40px_-10px_rgba(64,224,255,0.8)]
                       transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
                    >
                        Sign in with WSO2
                    </button>
                </div>
            </div>
        );
    }

    // 2. Centered Dashboard View
    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <SignalIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black text-xl tracking-tighter">DEVICEMANAGER</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-slate-600 font-bold bg-slate-100 px-4 py-1 rounded-full text-sm">{state.username}</span>
                    <button onClick={() => signOut()} className="text-slate-400 hover:text-red-500 transition-colors">
                        <ArrowRightOnRectangleIcon className="w-6 h-6" />
                    </button>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto p-8">
                {/* Enrollment Card */}
                <section className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-10 mb-12">
                    <h2 className="text-2xl font-black text-slate-900 mb-8">Enroll New Device</h2>
                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            className="flex-1 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-400 transition-all font-medium bg-slate-50 text-black"
                            placeholder="e.g. Pamod's Laptop"
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleEnroll("Mobile")}
                                className="bg-slate-100 text-black px-8 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all flex items-center gap-2 border border-transparent hover:border-blue-100"
                            >
                                <DevicePhoneMobileIcon className="w-5 h-5" /> MOBILE
                            </button>
                            <button
                                onClick={() => handleEnroll("PC")}
                                className="bg-slate-200 text-black px-8 py-4 rounded-2xl font-black hover:bg-slate-300 transition-all shadow-lg flex items-center gap-2"
                            >
                                <ComputerDesktopIcon className="w-5 h-5" /> PC
                            </button>
                        </div>
                    </div>
                    {error && <div className="mt-4 text-red-600 font-bold text-sm flex items-center gap-2"><ExclamationCircleIcon className="w-5 h-5" /> {error}</div>}
                    {success && <div className="mt-4 text-emerald-600 font-bold text-sm flex items-center gap-2"><CheckCircleIcon className="w-5 h-5" /> {success}</div>}
                </section>

                {/* Device Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Registered Devices List */}
                    <div>
                        <h2 className="text-xl font-black text-slate-900 mb-6">Registered Hardware</h2>
                        <div className="space-y-4">
                            {devices.map((device) => (
                                <div key={device.Id} className="bg-white p-6 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                                            {device.deviceType === "Smartphone" ? <DevicePhoneMobileIcon className="w-6 h-6" /> : <ComputerDesktopIcon className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{device.deviceName}</h3>
                                            <p className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">ID: {device.Id}</p>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{device.deviceType}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(device.Id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                        <TrashIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Logins List [cite: 3] */}
                    {/* <div>
                        <h2 className="text-xl font-black text-slate-900 mb-6">Active Sessions</h2>
                        <div className="space-y-4">
                            {activeLogins.map((login) => (
                                <div key={login.Id} className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <SignalIcon className="w-6 h-6 text-emerald-600 animate-pulse" />
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-emerald-900">{login.deviceName}</h3>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase">Online Since: {new Date(login.loginTimestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div> */}
                    {/* Replace the current .map block with this safe version */}
                    <div className="space-y-4">
                        {Array.isArray(activeLogins) && activeLogins.length > 0 ? (
                            activeLogins.map((login) => (
                                <div key={login.Id} className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <SignalIcon className="w-6 h-6 text-emerald-600 animate-pulse" />
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-emerald-900">{login.deviceName}</h3>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase">
                                                Online Since: {new Date(login.loginTimestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-400 italic text-center py-4">No active sessions found.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;