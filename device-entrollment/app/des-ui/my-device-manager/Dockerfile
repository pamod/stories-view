# =============================================================================
# Device Manager UI — React 19 + Vite 7 dev server
# =============================================================================
#
# Runs the Vite development server so that VITE_* environment variables
# injected by docker-compose are read at startup (not baked in at build time).
# The dev server is bound to 0.0.0.0 via --host so it's reachable from the host.
#
# VITE_* vars expected (set in docker-compose / .env):
#   VITE_WSO2_BASE_URL  — e.g. https://localhost:9443
#   VITE_CLIENT_ID      — OIDC client ID registered in WSO2 IS
#   VITE_DES_BASE_URL   — e.g. http://localhost:8080
#
# NOTE: main.tsx currently hard-codes the Asgardeo authConfig. Update it to
# read from import.meta.env.VITE_* to make the container fully configurable.

FROM node:20-alpine

WORKDIR /app

# Install dependencies in a cacheable layer before copying source
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source
COPY . .

EXPOSE 5173

# --host binds the dev server to 0.0.0.0 so Docker port-mapping works
CMD ["npm", "run", "dev", "--", "--host"]
