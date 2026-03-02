# Device-Aware Banking Authentication Platform

A multi-tier platform that enforces **device-bound authentication** for a banking application using WSO2 Identity Server. Users can only log in to the banking app from a device they have previously enrolled via the Device Manager portal.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│                                                              │
│  ┌────────────────────────────┐  ┌─────────────────────────┐ │
│  │  Device Manager UI         │  │  Banking App            │ │
│  │  app/my-device-manager     │  │  banking-app (port 3000)│ │
│  │  (port 5173)               │  │                         │ │
│  │                            │  │                         │ │
│  │  • Sign in via WSO2 OIDC   │  │  • Enter Device ID      │ │
│  │  • Enroll Mobile / PC      │  │  • SSO → WSO2 IS        │ │
│  │  • View & delete devices   │  │  • Banking dashboard    │ │
│  └────────────┬───────────────┘  └───────────┬─────────────┘ │
└───────────────┼──────────────────────────────┼───────────────┘
                │ OIDC Auth Code + PKCE         │ OIDC + device_id param
                ▼                               ▼
┌───────────────────────────────────────────────────────────────┐
│                  WSO2 Identity Server (port 9443)             │
│                                                               │
│  OAuth2 / OIDC  ·  Self-Service Registration                  │
│  Adaptive Auth Script ──────────────────────────────────┐     │
└─────────────────────────────────────────────────────────┼─────┘
                                                          │ HTTP (x-api-key)
                                                          ▼
┌──────────────────────────────────────────────────────────────┐
│              Device Enrollment Service — DES (port 8080)     │
│              Ballerina  ·  pamod/des v0.1.0                  │
│                                                              │
│  POST /device                   GET  /device/verify/…        │
│  GET  /device/devices/{user}    POST /device/authenticated/… │
│  DELETE /device/{id}/{user}     POST /device/logout/…        │
└──────────────────────────────────────────┬───────────────────┘
                                           │
                                           ▼
                              ┌─────────────────────┐
                              │  MySQL 8.0 (port 3306)│
                              │  database: device_    │
                              │           enrollment  │
                              └─────────────────────┘
```

---

## Technology Stack

| Component | Technology | Port |
|-----------|-----------|------|
| Identity & Access Management | WSO2 Identity Server 7.2.0 | 9443 |
| Device Enrollment Service | Ballerina (Swan Lake) | 8080 |
| Database | MySQL 8.0 | 3306 |
| Device Manager UI | React 19 + Vite + Tailwind + Asgardeo | 5173 |
| Banking App | React 19 + Vite + Tailwind + Asgardeo | 3000 |

---

## Repository Structure

```
Device-Enrollment/
├── .env.example                   # Environment variable template
├── docker-compose.yml             # Orchestrates all services
├── PLAN.md                        # Detailed architecture spec
│
├── database/
│   └── des.sql                    # MySQL schema (devices + device_users tables)
│
├── integration/                   # Ballerina integrator services
│   └── des/                       # Device Enrollment Service (Ballerina)
│       ├── main.bal               # HTTP service + all REST endpoints
│       ├── functions.bal          # Business logic (8 core functions)
│       ├── types.bal              # Request / response record types
│       ├── config.bal             # Port, DB config, maxLoginCount
│       ├── connections.bal        # MySQL client
│       ├── Ballerina.toml
│       ├── Config.toml            # Runtime overrides (DB host for Docker)
│       └── Dockerfile
│
├── app/                           # React UIs
│   └── my-device-manager/         # Device Manager React App
│       ├── src/
│       │   ├── main.tsx           # AuthProvider + Asgardeo OIDC config
│       │   └── App.tsx            # Enroll / list / delete devices UI
│       ├── package.json
│       └── Dockerfile
│
├── banking-app/                   # Banking App React Client
│   ├── src/
│   │   ├── main.tsx               # AuthProvider (BankingApp SP config)
│   │   └── App.tsx                # Login page + banking dashboard
│   ├── .env.example
│   └── package.json
│
└── identity/                      # Identity server configuration artifacts
    ├── adaptive-script.js         # WSO2 IS adaptive authentication script
    └── README.md                  # Step-by-step IS setup guide
```

---

## Prerequisites

- **Docker & Docker Compose** — for running WSO2 IS, MySQL, and DES
- **Node.js ≥ 20** — for running the React apps locally
- **Ballerina Swan Lake** — only needed if running DES outside Docker

---

## Quick Start (Docker Compose)

### 1. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `MYSQL_ROOT_PASSWORD` | MySQL root password (default: `wso2@123`) |
| `DES_INTERNAL_API_KEY` | Secret shared between WSO2 adaptive script and DES |
| `BANKING_APP_CLIENT_ID` | Client ID from the BankingApp SP in WSO2 IS |
| `DES_UI_CLIENT_ID` | Client ID from the DeviceManagerApp SP in WSO2 IS |

### 2. Start all backend services

```bash
docker-compose up --build
```

Services start in dependency order: MySQL → WSO2 IS → DES → Device Manager UI.

> WSO2 IS takes 2–3 minutes to fully boot. Wait for the health check to pass before proceeding.

| Service | URL |
|---------|-----|
| WSO2 IS Admin Console | https://localhost:9443/carbon |
| WSO2 Self-Registration | https://localhost:9443/accountrecoveryendpoint/register.do |
| Device Enrollment API | http://localhost:8080 |
| Device Manager UI | http://localhost:5173 |

### 3. Configure WSO2 IS

Follow **[identity/README.md](identity/README.md)** for the full step-by-step guide. In summary:

1. Register **DeviceManagerApp** as an OIDC SP (callback: `http://localhost:5173`)
2. Register **BankingApp** as an OIDC SP (callback: `http://localhost:3000/callback`)
3. Attach the adaptive auth script (`identity/adaptive-script.js`) to the **BankingApp** SP
4. Update the two variables at the top of the script:
   ```javascript
   var DES_BASE_URL = "http://des-service:8080";
   var DES_INTERNAL_API_KEY = "your-key-from-.env";
   ```
5. Whitelist the DES endpoint for outbound HTTP calls in `deployment.toml`

### 4. Start the Banking App

```bash
cd banking-app
cp .env.example .env          # fill in VITE_CLIENT_ID + VITE_WSO2_BASE_URL
npm install
npm run dev
# → http://localhost:3000
```

---

## End-to-End User Flow

### Step 1 — Register an account

Visit the WSO2 self-service portal and create an account:

```
https://localhost:9443/accountrecoveryendpoint/register.do
```

### Step 2 — Enroll a device

1. Open the **Device Manager** at `http://localhost:5173`
2. Sign in with your WSO2 credentials
3. Enter a device name (e.g. `My Laptop`) and click **PC** or **MOBILE**
4. The enrolled device appears in the list with its **Device ID**
5. **Copy the Device ID** — you will need it to log in to the banking app

### Step 3 — Log in to the banking app

1. Open the **Banking App** at `http://localhost:3000`
2. Paste your **Device ID** into the field
3. Click **Authenticate with SSO →**
4. You are redirected to the WSO2 IS login page
5. Enter your credentials

**What happens behind the scenes:**

```
Browser → WSO2 IS /oauth2/authorize?...&device_id=<your-id>
                 ↓
         [Step 1] Username + Password validated
                 ↓
         [Adaptive Script]
           GET http://des-service:8080/device/verify/<device_id>/<username>
                 ↓
         DES checks:
           • Device is enrolled for this user  ✓
           • Active login count < maxLoginCount ✓
                 ↓
         [Success] POST /device/authenticated/<device_id>/<username>
                 ↓
         WSO2 issues OAuth2 tokens → redirect to http://localhost:3000/callback
                 ↓
         Banking dashboard shown
```

If the device is **not enrolled**, or the **max concurrent sessions** (3) is reached, the login is rejected and an error is shown on the login page.

### Step 4 — Explore the banking dashboard

The dashboard shows:
- **Active device badge** — confirms which enrolled device was used
- **Account balances** — Checking and Savings (mock data)
- **Recent transactions** (mock data)

### Step 5 — Sign out

Clicking **Sign Out** in the banking app:
1. Calls `POST http://localhost:8080/device/logout/<device_id>/<username>` — decrements the active session count in DES
2. Calls Asgardeo `signOut()` — clears the OIDC session and terminates the WSO2 IS session

---

## Banking App Configuration

Copy `banking-app/.env.example` to `banking-app/.env`:

```bash
# WSO2 IS base URL visible from the browser
VITE_WSO2_BASE_URL=https://localhost:9443

# Client ID from the BankingApp SP in WSO2 IS console
VITE_CLIENT_ID=your-banking-app-client-id-here

# Must match the Callback URL set in the BankingApp SP
VITE_CALLBACK_URL=http://localhost:3000/callback

# Post-logout redirect
VITE_APP_URL=http://localhost:3000

# DES base URL visible from the browser
VITE_DES_BASE_URL=http://localhost:8080
```

The `device_id` is passed to WSO2 IS at sign-in time as a custom OIDC authorize parameter:

```typescript
// banking-app/src/App.tsx
await signIn({ device_id: id });
// → https://localhost:9443/oauth2/authorize?...&device_id=<id>
```

The WSO2 IS adaptive script reads it via `context.request.params.device_id[0]`.

---

## Device Manager Configuration

The Device Manager UI uses hardcoded values in `src/main.tsx`. To change the WSO2 IS URL or Client ID, update that file directly:

```typescript
// app/my-device-manager/src/main.tsx
const authConfig = {
    signInRedirectURL: "http://localhost:5173",
    signOutRedirectURL: "http://localhost:5173",
    clientID: "your-device-manager-client-id",
    baseUrl: "https://localhost:9443",
    scope: ["openid", "groups", "profile"]
};
```

---

## DES API Reference

**Base URL:** `http://localhost:8080`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/device` | Enroll a new device |
| `GET` | `/device/devices/{user_id}` | List all enrolled devices for a user |
| `DELETE` | `/device/{device_id}/{user_id}` | Remove an enrolled device |
| `GET` | `/device/verify/{device_id}/{user_id}` | Verify device access (called by adaptive script via `x-api-key`) |
| `POST` | `/device/authenticated/{device_id}/{user_id}` | Increment active login count |
| `POST` | `/device/logout/{device_id}/{user_id}` | Decrement active login count |
| `GET` | `/device/active_logins/{user_id}` | List active sessions |

**Enroll request body:**
```json
{
  "Id": "1753123456789",
  "deviceName": "My Laptop",
  "deviceType": "Laptop",
  "userName": "alice"
}
```

**Verify response:**
```json
{ "status": "successful" }
// or
{ "status": "error", "details": "Max login count exceeded for device." }
```

---

## Database Schema

**Database:** `device_enrollment`

### `devices`

| Column | Type | Description |
|--------|------|-------------|
| `device_id` | VARCHAR(255) PK | UUID set at enrollment time |
| `device_name` | VARCHAR(255) | User-supplied label |
| `device_type` | VARCHAR(255) | `"Smartphone"` or `"Laptop"` |
| `user_name` | VARCHAR(255) | WSO2 IS username |
| `created_at` | TIMESTAMP | Auto-set |
| `updated_at` | TIMESTAMP | Auto-updated |

### `device_users`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT AUTO_INCREMENT PK | |
| `device_id` | VARCHAR(255) FK | References `devices.device_id` (CASCADE DELETE) |
| `user_id` | VARCHAR(255) | WSO2 IS username |
| `is_authorized` | BOOLEAN | Default `TRUE` |
| `is_active` | BOOLEAN | `TRUE` while a session is live |
| `created_at` | TIMESTAMP | |

---

## Adaptive Authentication Script

**File:** `identity/adaptive-script.js`

The script runs inside WSO2 IS on every login attempt to the BankingApp SP:

1. Executes Step 1 — username + password
2. Extracts `device_id` from the authorize request params
3. Calls `GET /device/verify/{device_id}/{username}` (authenticated with `x-api-key`)
4. On success → calls `POST /device/authenticated/…` and issues tokens
5. On failure → rejects login with one of:

| Error Code | Cause |
|------------|-------|
| `DEVICE_ID_MISSING` | No `device_id` parameter in the authorize request |
| `DEVICE_NOT_PERMITTED` | Device not enrolled, or max concurrent logins reached |
| `DES_UNREACHABLE` | DES service is down or not whitelisted |
| `DES_INVALID_RESPONSE` | DES returned unexpected JSON |

---

## Troubleshooting

| Symptom | Solution |
|---------|----------|
| `DEVICE_ID_MISSING` error on banking login | The `device_id` field was left empty — paste your Device ID from the Device Manager |
| `DEVICE_NOT_PERMITTED` error | Device is not enrolled, or 3 concurrent sessions are already active |
| `DES_UNREACHABLE` in adaptive script | Add `http://des-service:8080` to `allowed_endpoints` in WSO2 IS `deployment.toml` |
| Banking app shows blank page at `/callback` | Ensure the SP Callback URL is `http://localhost:3000/callback` and the origin `http://localhost:3000` is allowed |
| WSO2 IS self-registration page 404 | Verify the `accountrecoveryendpoint` webapp is deployed (check IS logs) |
| CORS error calling DES from browser | DES has CORS open (`*`) by default; verify DES is running on port 8080 |
| `docker-compose up` fails for DES | WSO2 IS health check takes ~3 min; DES depends on it — wait or increase `start_period` |

For detailed WSO2 IS setup steps see **[identity/README.md](identity/README.md)**.
