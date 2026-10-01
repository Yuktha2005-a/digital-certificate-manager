# DIGITAL CERTIFICATE LIFECYCLE MANAGEMENT SYSTEM

A full-stack enterprise-grade web application built to centralize, track, inspect, and automate the lifecycle of digital X.509 TLS/SSL certificates.

---

## 1. Project Overview & Problem Statement

### The Problem
Organizations maintain dozens or hundreds of digital certificates across domains, subdomains, APIs, and microservices. Manually tracking certificates via spreadsheets leads to unexpected expirations, outages, security vulnerabilities, and expired SSL browser warnings that damage trust.

### The Solution
The **Digital Certificate Lifecycle Management System** provides administrators with a centralized dashboard to:
- Maintain an accurate inventory of digital certificates (manual creation or real X.509 file upload).
- Parse real X.509 certificates (`.crt`, `.cer`, `.pem`) using Node.js built-in cryptography (`crypto.X509Certificate`).
- Automate lifecycle state calculations (`ACTIVE`, `EXPIRING SOON`, `EXPIRED`, `REVOKED`).
- Establish live TLS handshakes over port 443 to verify stored certificate parameters against real-world production servers.
- Detect live certificate replacements/rotations through cryptographic SHA-256 fingerprint comparison.
- Maintain an immutable audit log (`lifecycleHistory`) for every certificate event in MongoDB.
- Run an automated hourly background monitoring service to proactively identify expiring credentials and generate security alerts.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, Lucide Icons, Fetch API
- **Backend**: Node.js v24, Express.js, Built-in `crypto` (`X509Certificate`) & `tls` modules, Multer
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) with 8-hour expiry, bcryptjs password hashing

---

## 3. Directory Structure

```text
digital-certificate-manager/
├── backend/
│   ├── controllers/
│   │   ├── authController.js             # User registration, login, profile (/api/auth)
│   │   ├── certificateController.js      # CRUD, upload, renew, revoke, stats (/api/certificates)
│   │   └── liveCertificateController.js  # Live TLS handshake & comparison (/api/live-certificates)
│   ├── middleware/
│   │   └── authMiddleware.js             # JWT verification & route protection
│   ├── models/
│   │   ├── User.js                       # Admin user schema with bcrypt password hashing
│   │   └── Certificate.js                # Certificate schema, subdocuments & status logic
│   ├── routes/
│   │   ├── authRoutes.js                 # Authentication routes
│   │   ├── certificateRoutes.js          # Certificate management routes
│   │   └── liveCertificateRoutes.js      # Live check routes
│   ├── services/
│   │   └── certificateMonitor.js         # Hourly automated status recalculation & monitoring
│   ├── scripts/
│   │   ├── generate-sample-certs.js      # Utility to fetch real certificates for testing
│   │   └── test-e2e.js                   # Automated end-to-end test suite
│   ├── uploads/                          # Upload staging directory
│   ├── .env                              # Environment configuration
│   ├── .env.example                      # Template environment variables
│   ├── package.json                      # Backend dependencies & scripts
│   └── server.js                         # Express entry point & database connection
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppLayout.jsx             # Responsive dashboard layout
│   │   │   ├── ConfirmModal.jsx          # Safe deletion modal
│   │   │   ├── LiveStatusBadge.jsx       # Live TLS verification badge
│   │   │   ├── Modal.jsx                 # Accessible dialog modal
│   │   │   ├── Navbar.jsx                # Responsive mobile header
│   │   │   ├── ProtectedRoute.jsx        # Route authorization guard
│   │   │   ├── RenewModal.jsx            # Certificate renewal modal
│   │   │   ├── RevokeModal.jsx           # Certificate revocation modal
│   │   │   ├── Sidebar.jsx               # Navigation bar & user profile
│   │   │   └── StatusBadge.jsx           # Color-coded status badge
│   │   ├── context/
│   │   │   └── AuthContext.jsx           # Authentication state & localStorage persistence
│   │   ├── pages/
│   │   │   ├── AddCertificate.jsx        # Manual entry & X.509 file upload
│   │   │   ├── Alerts.jsx                # Security alerts & auto-refreshed monitor
│   │   │   ├── CertificateDetails.jsx    # Details, comparison & lifecycle history
│   │   │   ├── Certificates.jsx          # Registry, search, filtering & batch operations
│   │   │   ├── Dashboard.jsx             # Metrics, live breakdown, attention required
│   │   │   ├── Login.jsx                 # Secure sign-in page
│   │   │   └── SignUp.jsx                # Admin registration page
│   │   ├── services/
│   │   │   └── api.js                    # Fetch client with Bearer token injection
│   │   ├── App.css
│   │   ├── App.jsx                       # React Router configuration
│   │   ├── index.css                     # Tailwind CSS directives
│   │   └── main.jsx                      # Vite entry point
│   ├── index.html
│   ├── package.json                      # Frontend dependencies & scripts
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
└── sample-certs/                         # Genuine sample certificates for immediate testing
    ├── cloudflare.com.pem
    ├── github.com.cer
    ├── google.com.crt
    └── wikipedia.org.crt
```

---

## 4. Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v24 recommended)
- **MongoDB**: Running locally at `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI

### Step 1: Install Backend Dependencies
```bash
cd digital-certificate-manager/backend
npm install
```

### Step 2: Configure Environment Variables
Verify or edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/digital_certificate_db
JWT_SECRET=super_secret_jwt_key_certificate_lifecycle_management_2026
```

### Step 3: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

---

## 5. Running the Application

### Start the Backend Server
```bash
cd digital-certificate-manager/backend
npm run dev
# Or: node server.js
```
*Backend runs at: `http://localhost:5000`*

### Start the Frontend Dev Server
Open a second terminal window:
```bash
cd digital-certificate-manager/frontend
npm run dev
```
*Frontend runs at: `http://localhost:5173`*

---

## 6. Complete End-to-End User Flow & Evaluation Guide

### 1. User Registration & Authentication
1. Open `http://localhost:5173/signup`.
2. Enter Name, Email, Password (min 6 characters), and Confirm Password. Click **Create Account**.
3. You will be redirected to `http://localhost:5173/login`.
4. Sign in with the registered credentials. You will be directed to the **Dashboard**.
5. Token is stored in `localStorage` under `certificateToken` and injected into the `Authorization: Bearer <token>` header for all protected API calls.

### 2. Dashboard & Live Metrics
1. View dynamic status cards: **Total Certificates**, **Active**, **Expiring Soon**, **Expired**, and **Revoked**.
2. View **Live TLS Monitoring Status**: **Live Checked**, **Certificate Changed**, and **Not Checked**.
3. View the **Attention Required** panel highlighting urgent items.
4. Click **Check All Live** to run parallel TLS handshakes across all registered hosts.

### 3. Adding Certificates
Navigate to **Add Certificate** (`/add-certificate`):
- **Upload Certificate File**:
  - Drag and drop or browse for `.crt`, `.cer`, or `.pem` files.
  - Test files are readily available in `sample-certs/` (e.g. `google.com.crt`, `github.com.cer`, `cloudflare.com.pem`).
  - The Node.js crypto module parses the certificate parameters (Domain CN, Issuer, Validity Dates, Serial Number, SHA-256 Fingerprint) automatically without uploading private keys.
  - A `CREATED` lifecycle history record is created in MongoDB.
- **Manual Entry**:
  - Enter Certificate ID, Domain, Issuer, Issue Date, and Expiry Date.
  - Validates that Expiry Date > Issue Date and Certificate ID is unique.

### 4. Certificates Registry
Navigate to **Certificates** (`/certificates`):
- **Search**: Real-time searching by Certificate ID, Domain name, or Issuer.
- **Filter**: Filter by `ALL`, `ACTIVE`, `EXPIRING SOON`, `EXPIRED`, and `REVOKED`.
- **Responsive View**: Formatted table on desktop; touch cards on mobile screens.
- **Safe Delete**: Clicking Delete displays a confirmation modal ensuring certificates are never accidentally purged.

### 5. Certificate Details & Live TLS Inspection
Click **View** on any certificate (`/certificates/:id`):
- **Certificate Information**: Full display of Subject, Issuer, Serial Number, SHA-256 Fingerprint, File Name, and Validity.
- **Stored vs Live Comparison**: Side-by-side comparison table between stored record and the live website certificate retrieved over port 443:
  - If fingerprints match: Prominently displays **"Certificate Matches"**.
  - If fingerprints differ: Displays **"Certificate Changed"** alert.
- **Check Live**: Performs an on-demand TLS handshake to the domain using Node.js TLS with SNI and records a `LIVE_CHECK` history entry.
- **Renew**: Extends expiry date and recalculates status; records a `RENEWED` history entry.
- **Revoke**: Prompts for revocation reason; sets status to `REVOKED`, blocks future renewals, and records a `REVOKED` history entry.
- **Lifecycle History**: Timeline displaying the chronological audit trail directly from MongoDB (newest first).

### 6. Security Alerts
Navigate to **Alerts** (`/alerts`):
- View cards categorized by:
  - ⚠️ **Expiring Soon** (remaining validity &le; 30 days)
  - 🔴 **Expired** (validity date has passed)
  - ⛔ **Revoked** (administrator deactivated)
  - 🔄 **Live Certificate Changed** (cryptographic mismatch detected)
- Auto-refreshes every 60 seconds while open.
- Quick **Manage** action buttons linking directly to the certificate detail page.

### 7. Automated Monitoring Service
- Runs on server startup and every 1 hour thereafter.
- Scans all non-revoked certificates and recalculates statuses.
- Logs activity in the server console:
  ```text
  Certificate monitoring service started.
  Certificate monitoring completed. X certificate(s) updated.
  ```

---

## 7. Running the Automated Test Suite

A comprehensive end-to-end test script is provided in `backend/scripts/test-e2e.js`:
```bash
cd digital-certificate-manager/backend
node scripts/test-e2e.js
```
This script exercises:
- Health check verification
- Administrator registration & login
- JWT profile validation (`/auth/me`)
- Manual certificate addition with automatic status & history creation
- Real X.509 certificate file upload & extraction
- Real TLS port 443 handshake & fingerprint comparison
- Certificate renewal validation & status recalculation
- Certificate revocation & verification that renewals are blocked
- Dashboard statistics calculation
- Batch live verification across all domains
- Search & filtering queries
- Safe deletion validation
