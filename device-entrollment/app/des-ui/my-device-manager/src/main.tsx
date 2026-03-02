import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from "@asgardeo/auth-react";
import App from './App';
import './index.css';

const authConfig = {
    signInRedirectURL: "http://localhost:5173",
    signOutRedirectURL: "http://localhost:5173",
    clientID: "96f8arNbKdWvRdZbRxf1Vp4d414a",
    baseUrl: "https://localhost:9443",
    scope: ["openid", "groups", "profile"]
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider config={authConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
