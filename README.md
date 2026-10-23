# Dynamic Google Ads Remote Configuration & Admin Panel

A production-grade, dynamic Google Ads remote configuration engine and responsive admin panel built with **HTML5, CSS3, Bootstrap 5, JavaScript, Node.js, Express.js, and PostgreSQL**.

Allows mobile applications (Android & iOS) to dynamically fetch and update their Google AdMob unit IDs, master switches, test mode toggles, format placements, and monetization parameters (interstitial frequency, rewarded coins) in real-time from PostgreSQL without rebuilding or redeploying mobile apps.

---

## 🚀 Key Features

* **Secure Admin Authentication**: Login with email or username, `bcryptjs` password hashing (cost factor: 12), secure HTTP-only sessions, and logout session termination.
* **No Public Registration**: Admin accounts can only be seeded securely via the CLI script (`npm run seed:admin`).
* **Bootstrap 5 Responsive UI**: Modern dashboard layout with collapsible sidebar, real-time live preview of the mobile API JSON response, custom toggles, and Toast notifications.
* **Granular Google Ads Controls**:
  * **General**: Master `ads_enabled` toggle and `test_mode` toggle.
  * **Android**: Dedicated slots for App ID, Banner, Interstitial, Rewarded, App Open, and Native Ad IDs.
  * **iOS**: Dedicated slots for App ID, Banner, Interstitial, Rewarded, App Open, and Native Ad IDs.
  * **Ad Settings**: Format-level toggles (Banner, Interstitial, Rewarded, App Open, Native), `interstitial_frequency` (min 1), and `rewarded_coins` (min 0).
* **Enterprise PostgreSQL Architecture**: Normalized schema (`admin_users`, `google_ads_config`, `google_ads_platform_config`, `google_ads_settings`) with primary keys, foreign keys with cascade delete, unique constraints, and check constraints.
* **Atomic ACID Transactions**: Configuration updates use PostgreSQL transactions (`BEGIN`, `COMMIT`, `ROLLBACK`) with row-level locks, ensuring updating one field never corrupts or resets other settings.
* **Zero-Downtime Mobile API**: `GET /api/v1/config/google-ads` delivers the live configuration in a strict, predictable JSON schema with CORS support.
* **Multi-Layer Security**:
  * Parameterized SQL queries (100% protection against SQL injection).
  * CSRF token protection for state-changing admin requests.
  * Brute-force rate limiting on `/api/v1/admin/login` (15 requests per 15 minutes).
  * HTTP security headers via `helmet`.

---

## 📁 Project Structure

```
├── .env                          # Local environment variables
├── .env.example                  # Template for environment variables
├── package.json                  # Dependencies & scripts
├── schema.sql                    # PostgreSQL schema & default initial seed
├── scripts/
│   ├── init-db.js               # Runs schema.sql against PostgreSQL
│   └── seed-admin.js            # Securely hashes password & creates admin user
├── src/
│   ├── app.js                   # Express application setup & middleware
│   ├── server.js                # Server entry point & graceful shutdown
│   ├── db/
│   │   └── index.js             # PostgreSQL connection pool (pg.Pool)
│   ├── middleware/
│   │   ├── auth.js              # Session check & CSRF token verification
│   │   └── rateLimiter.js       # Express rate limiters for login & API
│   ├── routes/
│   │   ├── adminAuth.js         # /api/v1/admin/login, logout, me
│   │   ├── adminAds.js          # /api/v1/admin/google-ads (GET, PUT)
│   │   └── publicAds.js         # /api/v1/config/google-ads (Public API)
│   ├── services/
│   │   └── adsService.js        # Data-access layer & transactional updates
│   └── utils/
│       └── validation.js        # Payload validation & sanitization
└── public/
    └── admin/
        ├── css/
        │   └── admin.css        # Custom styles & design system enhancements
        ├── js/
        │   ├── auth.js          # Login & session handler
        │   └── google-ads.js    # Ads configuration manager & JSON preview
        ├── login.html           # Admin login page
        ├── dashboard.html       # Admin dashboard page
        └── google-ads.html      # Google Ads configuration page
```

---

## 🛠️ Prerequisites

* **Node.js**: v18.0.0 or higher (v20+ recommended)
* **PostgreSQL**: v14.0 or higher
* **npm**: v8.0.0 or higher

---

## ⚡ Quickstart Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` with your PostgreSQL database credentials and session secret:
```ini
PORT=3000
NODE_ENV=development

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_NAME=slide_solve_ads

# Express Session Secret (use a 32+ character random string)
SESSION_SECRET=c9b0e2547b953d6e5792fc3f86e8da47f7d1d238b1ad4851ce32918e95086cb4

# Initial Admin Credentials (used by seed script)
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_EMAIL=admin@slidesolve.com
INITIAL_ADMIN_PASSWORD=Admin@12345
```

### 3. Initialize PostgreSQL Database Schema
Run the database initialization script to create all 4 tables and insert the default initial record:
```bash
npm run db:init
```

### 4. Create the Initial Admin User
Seed your initial admin user securely (passwords are hashed with `bcryptjs` 12 salt rounds):
```bash
npm run seed:admin
```
*Optional custom credentials:*
```bash
node scripts/seed-admin.js "myadmin" "myadmin@example.com" "SuperSecurePass123!"
```

### 5. Start the Server
```bash
# Production mode
npm start

# Development mode with live file watching
npm run dev
```

Visit the admin panel at:
👉 **http://localhost:3000/admin/login**

---

## 📡 API Reference & Documentation

### 1. Public Mobile API (No Authentication Required)

#### `GET /api/v1/config/google-ads`
Fetches the active Google Ads remote configuration for mobile clients.

* **Response Headers**: `Content-Type: application/json`, `Access-Control-Allow-Origin: *`
* **Response Status**: `200 OK`
* **Response Body Structure**:
```json
{
  "success": true,
  "message": "Google Ads configuration fetched successfully",
  "data": {
    "ads_enabled": true,
    "test_mode": false,
    "android": {
      "app_id": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
      "banner_ad_id": "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
      "interstitial_ad_id": "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
      "rewarded_ad_id": "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
      "app_open_ad_id": "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
      "native_ad_id": "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
    },
    "ios": {
      "app_id": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
      "banner_ad_id": "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
      "interstitial_ad_id": "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
      "rewarded_ad_id": "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
      "app_open_ad_id": "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
      "native_ad_id": "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
    },
    "ad_settings": {
      "banner_enabled": true,
      "interstitial_enabled": true,
      "rewarded_enabled": true,
      "app_open_enabled": true,
      "native_enabled": true,
      "interstitial_frequency": 3,
      "rewarded_coins": 25
    }
  }
}
```

---

### 2. Admin Authentication APIs

#### `POST /api/v1/admin/login`
Authenticates the admin and establishes an encrypted HTTP-only session cookie.

* **Rate Limit**: 15 requests per 15 minutes per IP.
* **Request Body**:
```json
{
  "login": "admin",
  "password": "Admin@12345"
}
```
*(Accepts either `username` or `email` in the `login` field).*
* **Response Status**: `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@slidesolve.com"
  },
  "csrfToken": "07f194283b449a2c3941fec68e7cd4242eefc35139d75d9ec4c5874d370430cf"
}
```

#### `POST /api/v1/admin/logout`
Destroys the active session and clears the session cookie.
* **Response Status**: `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### `GET /api/v1/admin/me`
Returns the currently logged-in admin user and their session CSRF token.
* **Authentication**: Required (`connect.sid` cookie).
* **Response Status**: `200 OK`

---

### 3. Admin Configuration APIs (Protected)

#### `GET /api/v1/admin/google-ads`
Retrieves current database Google Ads values.
* **Authentication**: None (Public endpoint).
* **CORS**: Enabled (`*`).
* **Response Status**: `200 OK`

#### `PUT /api/v1/admin/google-ads`
Updates the Google Ads configuration in PostgreSQL within an ACID transaction.
* **Authentication**: Required (`connect.sid` cookie).
* **Headers**: `X-CSRF-Token: <token>`
* **Request Body**:
```json
{
  "ads_enabled": true,
  "test_mode": false,
  "android": {
    "app_id": "ca-app-pub-3940256099942544~3347511713",
    "banner_ad_id": "ca-app-pub-3940256099942544/6300978111",
    "interstitial_ad_id": "ca-app-pub-3940256099942544/1033173712",
    "rewarded_ad_id": "ca-app-pub-3940256099942544/5224354917",
    "app_open_ad_id": "ca-app-pub-3940256099942544/9257390508",
    "native_ad_id": "ca-app-pub-3940256099942544/2247696110"
  },
  "ios": {
    "app_id": "ca-app-pub-3940256099942544~1458602514",
    "banner_ad_id": "ca-app-pub-3940256099942544/2934735716",
    "interstitial_ad_id": "ca-app-pub-3940256099942544/4411468910",
    "rewarded_ad_id": "ca-app-pub-3940256099942544/1712485313",
    "app_open_ad_id": "ca-app-pub-3940256099942544/5575463023",
    "native_ad_id": "ca-app-pub-3940256099942544/3986624511"
  },
  "ad_settings": {
    "banner_enabled": true,
    "interstitial_enabled": true,
    "rewarded_enabled": true,
    "app_open_enabled": true,
    "native_enabled": true,
    "interstitial_frequency": 4,
    "rewarded_coins": 50
  }
}
```
* **Validation Rules**:
  * `ads_enabled` / `test_mode`: boolean
  * `interstitial_frequency`: integer $\ge 1$
  * `rewarded_coins`: integer $\ge 0$
  * Partial updates are merged without resetting unspecified fields.

---

## 🧪 Postman & cURL Testing Examples

### 1. Fetch Public Config for Mobile Apps
```bash
curl -X GET http://localhost:3000/api/v1/config/google-ads
```

### 2. Admin Login
```bash
curl -X POST http://localhost:3000/api/v1/admin/login \
  -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "login": "admin@slidesolve.com",
    "password": "Admin@12345"
  }'
```

### 3. Fetch Config as Admin (Authenticated)
```bash
curl -X GET http://localhost:3000/api/v1/admin/google-ads \
  -b cookies.txt
```

### 4. Update Configuration as Admin
```bash
# Retrieve the CSRF token from the login response or /api/v1/admin/me
CSRF_TOKEN="your_csrf_token_here"

curl -X PUT http://localhost:3000/api/v1/admin/google-ads \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{
    "ads_enabled": true,
    "test_mode": false,
    "ad_settings": {
      "interstitial_frequency": 5,
      "rewarded_coins": 100
    }
  }'
```

### 5. Admin Logout
```bash
curl -X POST http://localhost:3000/api/v1/admin/logout \
  -b cookies.txt
```

---

## 📱 Mobile App Remote Config Integration Example

In your mobile app (Flutter, React Native, Swift, or Kotlin), fetch the remote configuration upon app launch:

### Flutter / Dart Example
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> syncGoogleAdsConfig() async {
  final url = Uri.parse('https://your-domain.com/api/v1/config/google-ads');
  final response = await http.get(url);

  if (response.statusCode == 200) {
    final body = jsonDecode(response.body);
    final data = body['data'];

    final bool adsEnabled = data['ads_enabled'];
    final bool testMode = data['test_mode'];
    final Map<String, dynamic> android = data['android'];
    final Map<String, dynamic> adSettings = data['ad_settings'];

    // Apply live parameters dynamically:
    int interstitialFreq = adSettings['interstitial_frequency'];
    int coinsReward = adSettings['rewarded_coins'];
    String bannerUnitId = android['banner_ad_id'];
    
    print('Remote Google Ads synced: Ads Enabled: $adsEnabled, Coins: $coinsReward');
  }
}
```

---

## 🛡️ Security Features Summary

1. **Bcrypt Password Encryption**: Salt rounds of 12 ensure rainbow table and brute-force resistance.
2. **Parameterized Queries**: All database queries use `$1, $2, ...` placeholders in the PostgreSQL driver (`pg`).
3. **Session Hardening**: Sessions are signed with `SESSION_SECRET`, stored server-side, and cookies use `httpOnly: true` and `sameSite: 'lax'` to prevent XSS credential theft.
4. **CSRF Protection**: All mutating admin endpoints require a matching `X-CSRF-Token` header.
5. **Rate Limiting**: Defends authentication endpoints against credential stuffing and brute force attempts.
6. **ACID Transaction Isolation**: Updates lock the row (`SELECT ... FOR UPDATE`), update all 3 configuration tables, and commit atomically to prevent race conditions.
