# Architecture & Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│                                                                  │
│  ┌────────────────┐          ┌─────────────────────────────┐   │
│  │  User Access   │          │   Standalone Login Pages    │   │
│  │  /#/login      │ ────────▶│                             │   │
│  └────────────────┘          │  ┌───────────────────────┐  │   │
│         │                    │  │ login-advanced.html   │  │   │
│         ▼                    │  │  (Professional UI)    │  │   │
│  ┌────────────────┐          │  └───────────────────────┘  │   │
│  │  src/login.js  │          │                             │   │
│  │  (Aurelia)     │          │  ┌───────────────────────┐  │   │
│  └────────────────┘          │  │ login-standalone.html │  │   │
│         │                    │  │  (Simple UI)          │  │   │
│         │ Check config       │  └───────────────────────┘  │   │
│         ▼                    └─────────────────────────────┘   │
│  ┌────────────────┐                      │                     │
│  │ login-config.js│                      │                     │
│  │ mode: standalone◀──────────────────────┘                    │
│  └────────────────┘                                            │
│         │                                                       │
│         ▼ Redirect                                              │
│  ┌──────────────────────────────────────────────────┐          │
│  │         Standalone Login Page                    │          │
│  │  ┌─────────────────────────────────────────┐    │          │
│  │  │  1. Encrypt credentials (RSA)           │    │          │
│  │  │  2. POST /authenticate                  │    │          │
│  │  │  3. Receive JWT token                   │    │          │
│  │  │  4. GET /me (profile)                   │    │          │
│  │  │  5. Save to localStorage:               │    │          │
│  │  │     - aurelia_token                     │    │          │
│  │  │     - aurelia_profile                   │    │          │
│  │  │  6. Redirect to /index.html             │    │          │
│  │  └─────────────────────────────────────────┘    │          │
│  └──────────────────────────────────────────────────┘          │
│         │                                                       │
│         ▼                                                       │
│  ┌────────────────┐                                            │
│  │  index.html    │                                            │
│  │  (Aurelia App) │                                            │
│  └────────────────┘                                            │
│         │                                                       │
│         ▼ Check token                                          │
│  ┌────────────────┐                                            │
│  │ localStorage   │                                            │
│  │ aurelia_token  │ ✓ Valid ─▶ Authenticated                  │
│  └────────────────┘                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                             │
                             ▼
                   
┌─────────────────────────────────────────────────────────────────┐
│                    External API Services                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Auth Service (Azure)                                  │    │
│  │  https://com-danliris-service-auth-v8-dev              │    │
│  │                                                         │    │
│  │  Endpoints:                                             │    │
│  │  • POST /v1/authenticate                               │    │
│  │    ├─ Input: { authEncrypted }                        │    │
│  │    └─ Output: { data: "JWT_TOKEN" }                   │    │
│  │                                                         │    │
│  │  • GET /v1/me                                          │    │
│  │    ├─ Header: Authorization: Bearer TOKEN             │    │
│  │    └─ Output: { user profile object }                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
┌──────────┐
│  START   │
└────┬─────┘
     │
     ▼
┌────────────────────────┐
│ User enters username   │
│ and password           │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ Create credentials obj │
│ {                      │
│   username,            │
│   password,            │
│   nonce: UUID(),       │
│   timestamp: ISO       │
│ }                      │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ Encrypt with RSA       │
│ Public Key (2048-bit)  │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ POST to API            │
│ /authenticate          │
│ { authEncrypted }      │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ API validates &        │
│ returns JWT token      │
└────┬───────────────────┘
     │
     ├─── ✗ Failed ─────┐
     │                   ▼
     │            ┌──────────────┐
     │            │ Show Error   │
     │            │ Message      │
     │            └──────────────┘
     │
     └─── ✓ Success
          │
          ▼
     ┌────────────────────────┐
     │ GET User Profile       │
     │ with Bearer Token      │
     └────┬───────────────────┘
          │
          ▼
     ┌────────────────────────┐
     │ Save to localStorage:  │
     │ - aurelia_token        │
     │ - aurelia_profile      │
     │ - login_timestamp      │
     └────┬───────────────────┘
          │
          ▼
     ┌────────────────────────┐
     │ Show Success Message   │
     │ "Login successful!"    │
     └────┬───────────────────┘
          │
          ▼
     ┌────────────────────────┐
     │ Wait 1.5 seconds       │
     │ (Show animation)       │
     └────┬───────────────────┘
          │
          ▼
     ┌────────────────────────┐
     │ Redirect to            │
     │ /index.html            │
     └────┬───────────────────┘
          │
          ▼
     ┌────────────────────────┐
     │ Aurelia App Loads      │
     │ - Detects token        │
     │ - Sets authenticated   │
     │ - Load user routes     │
     └────┬───────────────────┘
          │
          ▼
     ┌──────────┐
     │   END    │
     │ (Logged) │
     └──────────┘
```

---

## Routing Decision Flow

```
                    ┌─────────────────────┐
                    │  User Access Login  │
                    │    /#/login         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Aurelia Router     │
                    │  loads src/login.js │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Login.attached()   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Check LOGIN_CONFIG  │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
            ▼                                     ▼
┌───────────────────────┐          ┌───────────────────────┐
│  mode = 'standalone'  │          │  mode = 'aurelia'     │
└───────────┬───────────┘          └───────────┬───────────┘
            │                                   │
            ▼                                   ▼
┌───────────────────────┐          ┌───────────────────────┐
│ window.location.href  │          │ Stay in Aurelia       │
│ = standaloneLoginUrl  │          │ login component       │
└───────────┬───────────┘          └───────────┬───────────┘
            │                                   │
            ▼                                   ▼
┌───────────────────────┐          ┌───────────────────────┐
│ Redirect to:          │          │ Use Aurelia login.js  │
│ /login-advanced.html  │          │ & login.html          │
│ or                    │          │                       │
│ /login-standalone.html│          │ (Original behavior)   │
└───────────┬───────────┘          └───────────┬───────────┘
            │                                   │
            │                                   │
            └───────────────┬───────────────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │  User Login Process │
                 └─────────────────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │  Token Saved        │
                 └─────────────────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │  Redirect to App    │
                 │  /index.html        │
                 └─────────────────────┘
```

---

## Data Storage Structure

```
localStorage
├── aurelia_token
│   └── "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
│       └── JWT Token from API
│           ├── Contains user claims
│           ├── Expiration time
│           └── Used for API authorization
│
├── aurelia_profile
│   └── '{"username":"john","email":"john@example.com",...}'
│       └── User Profile JSON
│           ├── username
│           ├── email
│           ├── roles
│           ├── permissions
│           └── other user info
│
├── login_timestamp
│   └── "2025-11-06T10:30:45.123Z"
│       └── ISO 8601 format
│           └── For session tracking
│
└── rememberedUsername (optional)
    └── "john"
        └── Only if "Remember Me" checked
```

---

## File Dependencies

```
Root Directory
├── login-advanced.html (Standalone)
│   ├── External: JSEncrypt (CDN)
│   ├── External: Font Awesome (CDN)
│   └── No dependencies on Aurelia
│
├── login-standalone.html (Standalone)
│   ├── External: JSEncrypt (CDN)
│   └── No dependencies on Aurelia
│
├── login-config.js (Config)
│   └── Imported by: src/login.js
│
├── auth-config.js (Config)
│   └── Imported by: src/main.js
│
└── src/
    ├── login.js (Aurelia Component)
    │   ├── Imports: aurelia-framework
    │   ├── Imports: aurelia-authentication
    │   ├── Imports: jsencrypt
    │   └── Imports: ../login-config
    │
    ├── login.html (Aurelia Template)
    │   └── Used by: login.js
    │
    └── main.js (Aurelia Bootstrap)
        └── Imports: ../auth-config
```

---

## Configuration Hierarchy

```
Application Configuration
│
├── login-config.js (Login Mode)
│   ├── mode: 'standalone' | 'aurelia'
│   ├── standaloneLoginUrl
│   ├── redirectAfterLogin
│   └── autoCheckSession
│
├── auth-config.js (Auth Settings)
│   ├── endpoint: "auth"
│   ├── loginUrl: "authenticate"
│   ├── profileUrl: "me"
│   ├── loginRoute: '/login-advanced.html'
│   ├── authTokenType: "Bearer"
│   └── storageChangedReload: true
│
└── Standalone HTML Config (Per File)
    ├── login-advanced.html
    │   ├── CURRENT_ENV: 'dev' | 'uat' | 'production'
    │   ├── ENVIRONMENTS[].authUrl
    │   ├── ENVIRONMENTS[].redirectUrl
    │   └── PUBLIC_KEY (RSA)
    │
    └── login-standalone.html
        ├── CONFIG.AUTH_URL
        ├── CONFIG.REDIRECT_URL
        └── CONFIG.PUBLIC_KEY (RSA)
```

---

## Security Flow

```
┌─────────────────┐
│ User Password   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Create Credential Object        │
│ {                               │
│   username: "john",             │
│   password: "secret",           │
│   nonce: "uuid-v4",       ← Unique per request
│   timestamp: "ISO-8601"   ← Current time
│ }                               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Stringify JSON                  │
│ '{"username":"john",...}'       │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ RSA Encrypt with Public Key     │
│ (2048-bit)                      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Base64 Encoded Ciphertext       │
│ "MIIBCgKCAQEA..."               │
└────────┬────────────────────────┘
         │
         ▼ HTTPS
┌─────────────────────────────────┐
│ Send to API                     │
│ POST /authenticate              │
│ { authEncrypted: "..." }        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ API Server                      │
│ 1. Decrypt with Private Key     │
│ 2. Validate nonce (not reused)  │
│ 3. Validate timestamp (recent)  │
│ 4. Verify credentials           │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Generate JWT Token              │
│ - Signed with secret key        │
│ - Contains user claims          │
│ - Has expiration time           │
└────────┬────────────────────────┘
         │
         ▼ HTTPS
┌─────────────────────────────────┐
│ Return to Client                │
│ { data: "JWT_TOKEN" }           │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Store in localStorage           │
│ Key: aurelia_token              │
│ Value: "eyJhbGci..."            │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Future API Requests             │
│ Header:                         │
│ Authorization: Bearer TOKEN     │
└─────────────────────────────────┘
```

---

## Browser Compatibility Matrix

```
┌──────────────┬─────────┬──────────────┬────────────────┐
│ Browser      │ Version │ Status       │ Notes          │
├──────────────┼─────────┼──────────────┼────────────────┤
│ Chrome       │ 90+     │ ✅ Full      │ Recommended    │
│ Firefox      │ 88+     │ ✅ Full      │ Recommended    │
│ Safari       │ 14+     │ ✅ Full      │ iOS supported  │
│ Edge         │ 90+     │ ✅ Full      │ Chromium-based │
│ Opera        │ 76+     │ ✅ Full      │ Chromium-based │
│ IE 11        │ -       │ ❌ Not       │ Deprecated     │
│ Mobile       │         │              │                │
│ - iOS Safari │ 14+     │ ✅ Full      │ Responsive     │
│ - Android    │ 90+     │ ✅ Full      │ Responsive     │
└──────────────┴─────────┴──────────────┴────────────────┘

Required Features:
✓ localStorage
✓ Fetch API
✓ ES6 (arrow functions, const/let, template literals)
✓ Crypto API (for UUID generation)
✓ Promise
✓ async/await
```

---

**Diagrams Version:** 1.0.0  
**Last Updated:** November 6, 2025
