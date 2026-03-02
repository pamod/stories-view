# WSO2 Identity Server — Setup Guide

This document covers the manual configuration steps required in WSO2 IS to
support the Device-Aware Banking Authentication platform.

---

## Prerequisites

- WSO2 IS 7.x running (via docker-compose or standalone)
- Admin console accessible at: `https://localhost:9443/carbon`
- Default credentials: `admin` / `admin`
- Device Enrollment Service (DES) running at `http://localhost:8080`

---

## Step 1 — Enable Self-Service User Registration

WSO2 IS 7.x enables self-registration by default. To verify:

1. Log in to the admin console: `https://localhost:9443/carbon`
2. Navigate to **Identity** → **Identity Providers** → **Resident**
3. Expand **User Onboarding** → **Self Registration**
4. Ensure **Enable Self User Registration** is checked
5. Save

Users can then register at:
`https://localhost:9443/accountrecoveryendpoint/register.do`

---

## Step 2 — Register the Banking App as an OIDC Service Provider

### Via New Console (IS 7.x)

1. Go to `https://localhost:9443/console`
2. Navigate to **Applications** → **+ New Application**
3. Select **Standard-Based Application** → **OpenID Connect**
4. Fill in:
   - **Name**: `BankingApp`
   - **Grant types**: Authorization Code (ensure PKCE is enabled)
   - **Callback URL**: `http://localhost:3000/callback`
5. Click **Register**
6. Note down the **Client ID** and **Client Secret**
   - Add these to your `.env` file: `BANKING_APP_CLIENT_ID` and `BANKING_APP_CLIENT_SECRET`
7. Under **Access** tab:
   - Add allowed origin: `http://localhost:3000`
   - Set requested scopes: `openid`, `profile`, `email`

### Allow the `device_id` Query Parameter

WSO2 IS 7.x filters out unrecognised query parameters before they reach
`context.request.params` in the adaptive script. You must whitelist `device_id`:

1. Open the `BankingApp` application in the new console (`https://localhost:9443/console`)
2. Go to the **Protocol** tab (OAuth2/OpenID Connect)
3. Scroll down to **Additional Query Parameters** (also labelled
   "Allowed Additional Query Parameters" in some IS builds)
4. Click **Add Parameter** and enter `device_id`
5. Click **Update**

Without this, `context.request.params.device_id` will always be `undefined`
even when the banking app sends the parameter.

### Configure Adaptive Authentication on the SP

1. Open the `BankingApp` application
2. Go to the **Sign-In Method** tab
3. Click **Add Authentication** → select **Username & Password**
4. Toggle **Conditional Authentication** → click **Editor**
5. Paste the full content of `adaptive-script.js` into the editor
6. Update the two variables at the top of the script:
   ```javascript
   var DES_BASE_URL = "http://des-service:8080";          // inside Docker
   var DES_INTERNAL_API_KEY = "your-key-from-.env";
   ```
7. Click **Update** → **Save**

---

## Step 3 — Allow Outbound HTTP Calls from the Adaptive Script

WSO2 IS 7.x restricts outbound HTTP calls from adaptive scripts by default.
You must whitelist the DES hostname.

1. Open `<IS_HOME>/repository/conf/deployment.toml`
   (or mount a custom one via docker-compose)
2. Add:
   ```toml
   [authentication.adaptive.http]
   allowed_endpoints = ["http://des-service:8080"]
   ```
3. Restart WSO2 IS

---

## Step 4 — (Optional) Create a Test User via API

If you prefer to create users programmatically via SCIM2:

```bash
curl -k -X POST https://localhost:9443/scim2/Users \
  -H "Content-Type: application/json" \
  -u admin:admin \
  -d '{
    "schemas": [],
    "name": { "familyName": "Doe", "givenName": "John" },
    "userName": "PRIMARY/johndoe",
    "password": "SecureP@ss1",
    "emails": [{ "value": "john@example.com", "primary": true }]
  }'
```

---

## Step 5 — Verify OIDC Discovery

Confirm the OIDC discovery endpoint is reachable:

```bash
curl -k https://localhost:9443/oauth2/token/.well-known/openid-configuration
```

Key endpoints to note for the React app configuration:
- **Authorization endpoint**: `https://localhost:9443/oauth2/authorize`
- **Token endpoint**: `https://localhost:9443/oauth2/token`
- **JWKS URI**: `https://localhost:9443/oauth2/jwks`
- **Userinfo endpoint**: `https://localhost:9443/oauth2/userinfo`

---

## Step 6 — Testing the Adaptive Script

Use the WSO2 script editor's **Try** button (IS 7.x) or test end-to-end:

```bash
# Attempt an authorize request with a device_id
open "https://localhost:9443/oauth2/authorize?\
client_id=YOUR_CLIENT_ID&\
response_type=code&\
redirect_uri=http://localhost:3000/callback&\
scope=openid+profile&\
device_id=ENROLLED_DEVICE_UUID"
```

Expected results:
- Valid enrolled device → redirect back to callback with `code`
- Unknown/revoked device → redirect with `error=DEVICE_NOT_PERMITTED`
- No device_id → redirect with `error=DEVICE_ID_MISSING`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Adaptive script error "DES_UNREACHABLE" | Verify DES is running; check IS allowed_endpoints whitelist |
| `httpGet is not defined` | Your IS version uses `callChoreo` — see the inline comment in the script |
| Self-registration page 404 | Verify `accountrecoveryendpoint` webapp is deployed |
| CORS error on token endpoint | Add `http://localhost:3000` to allowed origins in the SP |
| JWT validation fails in DES | Ensure DES uses `https://wso2-is:9443/oauth2/jwks` as JWKS URL |
