# FAPI-Viewer: Financial-Grade API Security with WSO2 IAM

A React.js reference implementation that walks through a complete FAPI 2.0-compliant authorization flow against WSO2 Identity Server. Designed for developers at financial institutions and TPPs who want to understand or prototype FAPI security in practice.

---

## What This Demonstrates

- **Dynamic Client Registration (DCR)** — registering a FAPI-compliant client with signed JWKS and certificate binding
- **Push Authorization Request (PAR)** — sending signed, back-channel authorization requests so no sensitive parameters appear in the browser URL
- **Signed Request Objects** — PS256-signed JWTs carrying all authorization parameters, tamper-proof from the client to the server
- **Private Key JWT Client Authentication** — cryptographic client identity at every endpoint, no shared secrets
- **PKCE** — code challenge/verifier binding to prevent authorization code interception
- **Encrypted ID Tokens (JWE)** — RSA-OAEP + A128GCM encrypted tokens whose claims are unreadable without the client's private key
- **Mutual TLS readiness** — client certificate registered at DCR for certificate-bound token validation

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Node.js 18+ | For running the React app |
| WSO2 Identity Server 7.x | See setup below |
| OpenSSL | For certificate generation |
| Java 11+ | Required by WSO2 IS |

---

## Part 1 — Set Up WSO2 Identity Server

### 1.1 Download and Start

Download WSO2 Identity Server from [wso2.com/identity-server](https://wso2.com/identity-server/). Extract the archive and start the server:

```bash
cd wso2is-<version>/bin
./wso2server.sh start        # Linux / macOS
wso2server.bat start         # Windows
```

The server starts at `https://localhost:9443`. The default admin credentials are `admin` / `admin`.

> **Port note:** The FAPI-Viewer defaults to `https://localhost:30003`. If you are running WSO2 IS on the standard port 9443, update the endpoint URLs in `src/pages/DCR.jsx`, `src/pages/PushAuthRequest.jsx`, and `src/pages/TokenRequest.jsx` to use `https://localhost:9443`. Alternatively, configure a reverse proxy or port mapping to expose IS on `30003`.

### 1.2 Enable FAPI 2.0 in deployment.toml

Open `repository/conf/deployment.toml` and add or update the following configuration blocks:

```toml
[oauth]
# Enable FAPI 2.0 security profile
fapi_conformance_enabled = true

[oauth.dcr]
# Allow Dynamic Client Registration
enable_dcr = true

[oauth.par]
# Require Pushed Authorization Requests
enable = true
expiry_time = 60

[oauth.oidc]
# Enable hybrid flow (code id_token)
supported_response_types = ["code", "id_token", "token", "code id_token", "code token", "id_token token", "code id_token token"]

[oauth.token_endpoint_auth]
# Allow private_key_jwt client authentication
allowed_client_auth_methods = ["private_key_jwt", "tls_client_auth"]

[transport.https.properties]
port = 9443
```

Save the file and restart the server:

```bash
./wso2server.sh restart
```

### 1.3 Configure MTLS (Mutual TLS)

FAPI requires client certificate validation at the token endpoint.

1. Log in to the WSO2 IS Management Console at `https://localhost:9443/carbon` (admin / admin).
2. Navigate to **Identity Providers → Resident → Inbound Authentication → OAuth2/OpenID Connect**.
3. Enable **TLS Client Authentication**.
4. Under **Advanced**, confirm that **Require PKCE** and **Require signed request object** are enabled.

### 1.4 Trust the Client Certificate

For the demo certificates shipped in `src/certs/`, add the certificate to the WSO2 IS client truststore:

```bash
keytool -import -alias fapi-demo-client \
  -file path/to/wso2demo.cert \
  -keystore wso2is-<version>/repository/resources/security/client-truststore.jks \
  -storepass wso2carbon
```

Restart the server after importing.

---

## Part 2 — Generate Certificates

The application ships with demo certificates in `src/certs/` that work immediately for local testing. **Do not use these in any non-demo environment.**

To generate your own certificates:

```bash
# Generate RSA 2048 private key
openssl genrsa 2048 > client-private.key
chmod 400 client-private.key

# Generate self-signed X.509 certificate (valid 1 year)
openssl req -new -x509 -nodes -sha256 -days 365 \
  -key client-private.key \
  -out wso2demo.cert \
  -subj "/C=SL/ST=WP/L=Colombo/O=YourOrg/CN=YourName"

# Export DER format (if you have an existing JKS keystore)
keytool -v -export -file wso2demoCA.cer \
  -keystore clientstore.jks -alias wso2demoCA
openssl x509 -inform DER -in wso2demoCA.cer -out wso2demo.crt

# Extract public key (for JWKS construction)
openssl x509 -in wso2demo.cert -outform PEM -out wso2demo.pem
openssl x509 -in wso2demo.pem -pubkey -out wso2demo-public.pem

# View certificate details
openssl x509 -in wso2demo.cert -text -noout
```

### Update the App with Your Certificates

After generating certificates, update three files:

**`src/pages/DCR.jsx`** — replace the JWKS payload with your public key and certificate details:
- `n`, `e` — RSA public key modulus and exponent (Base64url encoded)
- `x5c` — Base64-encoded DER certificate chain
- `x5t` — SHA-1 thumbprint of the certificate
- `x5t#S256` — SHA-256 thumbprint

**`src/pages/PushAuthRequest.jsx`** and **`src/pages/TokenRequest.jsx`** — replace the hardcoded `PKCS8_PRIVATE_KEY` constant with the contents of your `client-private.key` file.

---

## Part 3 — Run the Application

```bash
cd FAPI/fapi-viewer
npm install
npm start
```

The app opens at `http://localhost:3000`. The navbar shows the three steps of the flow.

---

## Part 4 — Execute the FAPI Flow

### Step 1 — Register the Client (`/dcr`)

Open `http://localhost:3000/dcr`.

The request body is pre-populated with a FAPI-compliant DCR payload:

| Parameter | Value | Purpose |
|---|---|---|
| `request_object_signing_alg` | PS256 | All authorization requests must be signed |
| `id_token_encrypted_response_alg` | RSA-OAEP | ID tokens are encrypted, not just signed |
| `id_token_encrypted_response_enc` | A128GCM | Symmetric encryption algorithm for ID token payload |
| `require_pushed_authorization_requests` | true | PAR is mandatory |
| `require_signed_request_object` | true | Unsigned requests are rejected |
| `subject_type` | pairwise | User identifiers are pseudonymous per-client |
| `response_types` | `code id_token` | Hybrid flow |
| `tls_client_auth_subject_dn` | cert subject DN | Client identity bound to certificate |

Click **Send**. Copy the `client_id` from the response — you will need it in the next steps.

After registration, upload your client certificate to the registered application in the WSO2 IS Management Console under **Service Providers → [your app] → Inbound Authentication → OAuth2 → Certificate**.

---

### Step 2 — Push Authorization Request (`/par`)

Open `http://localhost:3000/par` and enter the `client_id` from Step 1.

**Sign Request** — packages the authorization parameters into a PS256-signed JWT. The payload includes:
- PKCE `code_challenge` (SHA-256 of a random verifier)
- Financial claims: `sharing_duration`, `acr`, `family_name`, `email`, `address`, `phone_number`
- `response_type: code id_token` (hybrid flow)
- `nonce` and `state` for replay and CSRF protection

**Sign Assertion** — creates a `private_key_jwt` assertion signed with the client's private key. This is how the client proves its identity at the PAR endpoint — no password, no secret.

**Send** — POSTs both the signed request object and the client assertion (form-encoded) directly to the PAR endpoint. WSO2 IS validates both signatures and returns a `request_uri`.

**Get ID Token** — redirects the browser to the authorization endpoint with only `client_id` and `request_uri`. No authorization parameters are present in the redirect URL. After the user authenticates and consents, WSO2 IS redirects back to `/token` with the authorization code and an encrypted ID token in the URL fragment.

---

### Step 3 — Exchange for Access Token (`/token`)

The page automatically extracts the `code` and encrypted `id_token` from the URL fragment on load.

Enter the `client_id`, click **Sign Assertion**, then click **Send**. The token request includes:
- `code` — the authorization code
- `code_verifier` — proves this client initiated the PAR request (PKCE)
- `client_assertion` — signed `private_key_jwt` for client authentication
- `grant_type: authorization_code`

On success, WSO2 IS returns the access token.

**Inspect tokens using the built-in decoder:**
- Click **Decode** on the access token to view its claims (subject, scope, expiry, certificate thumbprint).
- Click **Decode** on the ID token — you will see the JWE structure (five Base64url segments). The payload is opaque encrypted ciphertext. Unlike a standard OIDC ID token, pasting this into [jwt.io](https://jwt.io) reveals nothing — the identity claims are only accessible to the client that holds the matching private key. This is intentional and is one of the core FAPI protections.

---

## Project Structure

```
FAPI/fapi-viewer/
├── src/
│   ├── pages/
│   │   ├── Home.jsx              # Landing page
│   │   ├── DCR.jsx               # Step 1: Dynamic Client Registration
│   │   ├── PushAuthRequest.jsx   # Step 2: Push Authorization Request
│   │   └── TokenRequest.jsx      # Step 3: Token Exchange
│   ├── components/
│   │   └── NavBar.jsx            # Step navigation bar
│   └── certs/
│       ├── client-private.key    # Demo RSA 2048 private key (replace in production)
│       └── wso2demo.cert         # Demo X.509 certificate (replace in production)
├── config-overrides.js           # Webpack Node.js polyfills for browser crypto
└── package.json
```

---

## Troubleshooting

**`net::ERR_CERT_AUTHORITY_INVALID` in the browser**
The WSO2 IS default certificate is self-signed. Accept the security exception at `https://localhost:9443` (or your configured port) before using the app, or import the IS certificate into your browser's trusted store.

**`401 Unauthorized` on DCR**
The DCR endpoint requires `Authorization: Basic <base64(admin:admin)>`. Verify your admin credentials are correct in the DCR page URL field.

**`invalid_request: Request object is required` on PAR**
WSO2 IS is enforcing signed request objects. Ensure you clicked **Sign Request** before **Send**.

**`invalid_client` on token exchange**
The client assertion signature did not validate. Confirm the private key in `TokenRequest.jsx` matches the public key registered in the DCR JWKS.

**Encrypted ID token shows only ciphertext**
This is correct behaviour. The ID token is JWE-encrypted for the registered client. To decrypt it, the client application would use the private key corresponding to the encryption key in the DCR JWKS. The demo app intentionally does not decrypt it — the point is to demonstrate that the payload is protected.

---

## Repository

Full source and related projects: [https://github.com/pamod/stories-view](https://github.com/pamod/stories-view)

## Contributing

Pull requests with improvements or bug fixes are welcome.
