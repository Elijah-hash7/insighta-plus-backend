# Insighta Labs+ (Stage 3)

Insighta Labs+ is a secure, role-based demographic intelligence platform consisting of a NestJS backend, a React web portal, and a Node.js CLI tool. This repository contains the core API system that orchestrates authentication, role enforcement, and data querying.

## System Architecture

The system is built with a strictly typed **NestJS** backend utilizing **PostgreSQL** (via Supabase) for persistence. The architecture follows a multi-interface, single-backend paradigm:
1. **Backend**: Exposes versioned (`/api/v1`) REST endpoints secured by JWTs.
2. **Web Portal**: A React/Vite frontend that communicates with the backend via HTTP-only cookies and CSRF protection.
3. **CLI Tool**: A Node.js command-line interface that authenticates and saves JWTs to the local filesystem (`~/.insighta/credentials.json`).

The architecture ensures that both clients consume the exact same business logic while adhering to client-specific security best practices.

## Authentication Flow

We implemented a stateless authentication strategy using **GitHub OAuth with PKCE (Proof Key for Code Exchange)**.

1. The client (Web or CLI) redirects the user to GitHub to authorize the app.
2. The client receives a `code` from GitHub.
3. The client sends the `code` and a `code_verifier` (PKCE) to the backend `POST /api/v1/auth/github`.
4. The backend verifies the code with GitHub and issues two JWTs:
   - **Access Token** (15-minute expiry)
   - **Refresh Token** (7-day expiry, hashed in the database)
5. The backend sets these tokens as **HTTP-only, Secure cookies** (for the web) AND returns them in the **JSON response body** (for the CLI).

## Token Handling Approach

Because the backend serves two different clients, we utilize a dual-extraction strategy:
- **Web Portal**: Uses HTTP-only cookies. JavaScript is blocked from reading the token, eliminating XSS vulnerabilities.
- **CLI Tool**: Saves the tokens to `~/.insighta/credentials.json` and sends the Access Token via the `Authorization: Bearer <token>` header.
- **Backend `JwtStrategy`**: Automatically checks for the token in the Cookie first, and falls back to the Bearer header if no cookie is present.

## Role Enforcement Logic

Access control is managed via Role-Based Access Control (RBAC).
- We use a custom `@Roles()` decorator paired with a `RolesGuard`.
- The `RolesGuard` utilizes NestJS Reflector to check the metadata of the requested route against the `role` payload embedded inside the JWT.
- Example: Only users with the `ADMIN` or `ANALYST` role can access the demographic profiles endpoints.

## CLI Usage

The CLI tool acts as a dedicated terminal client for analysts.

```bash
# Login via GitHub OAuth
insighta login

# View your profile and role
insighta me

# Browse and filter profiles
insighta profiles --gender female --limit 10

# Export filtered data to CSV
insighta export --country NG

# Logout and destroy local credentials
insighta logout
```

## Natural Language Parsing Approach

The system includes a custom natural language parser for querying demographics (e.g., *"young males from nigeria"*). 
- The parser tokenizes the search string and matches keywords against known demographic dictionaries (age ranges, gender, country codes).
- It dynamically maps these tokens into structured SQL `WHERE` clauses (e.g., mapping "young" to `age < 30`).
- This allows non-technical analysts to query complex datasets without writing strict filter parameters.

## Security Features
- **Rate Limiting**: Globally restricted to 100 requests per minute per IP via `@nestjs/throttler`.
- **Request Logging**: Custom middleware logging method, path, status, User-Agent, and IP.
- **CSRF Protection**: Ensured via the `csurf` library for web requests.
