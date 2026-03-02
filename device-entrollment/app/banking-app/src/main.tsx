import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from '@asgardeo/auth-react';
import App from './App';
import './index.css';

/**
 * OIDC configuration for the BankingApp service provider registered in WSO2 IS.
 *
 * signInRedirectURL must match the Callback URL set in the WSO2 IS SP:
 *   Console → Applications → BankingApp → Protocol → Callback URLs
 *
 * Override these at runtime by copying .env.example → .env and setting:
 *   VITE_CLIENT_ID, VITE_WSO2_BASE_URL
 *
 * The device_id parameter is NOT set here — it is passed dynamically in
 * App.tsx via signIn({ device_id: "<id>" }) so that each login carries the
 * device the user selected on the login page.
 */
const authConfig = {
    signInRedirectURL: import.meta.env.VITE_CALLBACK_URL ?? 'http://localhost:3000/callback',
    signOutRedirectURL: import.meta.env.VITE_APP_URL ?? 'http://localhost:3000',
    clientID: import.meta.env.VITE_CLIENT_ID ?? 'YOUR_BANKING_APP_CLIENT_ID',
    baseUrl: import.meta.env.VITE_WSO2_BASE_URL ?? 'https://localhost:9443',
    scope: ['openid', 'profile', 'email'],
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AuthProvider config={authConfig}>
            <App />
        </AuthProvider>
    </React.StrictMode>
);
