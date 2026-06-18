# 🌾 KisaanConnect

<div align="center">

![KisaanConnect Banner](https://img.shields.io/badge/KisaanConnect-Empowering%20Farmers-green?style=for-the-badge&logo=leaf&logoColor=white)

**Bridging the gap between farmers and customers with real-time market access**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime%20DB-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Android](https://img.shields.io/badge/Android-Native-3DDC84?style=flat-square&logo=android&logoColor=white)](https://developer.android.com)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

[Live Demo](https://kisaanconnect.vercel.app) • [Report Bug](https://github.com/kishanBabu42/KisaanConnect/issues) • [Request Feature](https://github.com/kishanBabu42/KisaanConnect/issues)

</div>

---

## 📖 About

KisaanConnect is a full-stack **AgriTech platform** that directly connects Indian farmers with customers, eliminating middlemen and ensuring fair pricing. Built with a mobile-first approach, it works seamlessly as both a **Progressive Web App (PWA)** and a **native Android application**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **OTP Authentication** | Secure email-based OTP login via Resend API |
| 🔑 **Google Sign-In** | One-tap login with Firebase Google OAuth |
| 🛒 **Farmer Dashboard** | List produce, set prices, manage inventory |
| 👤 **Customer Dashboard** | Browse listings, place orders, track purchases |
| 💬 **Real-time Chat** | WebSocket-powered live messaging |
| 📱 **PWA + Android** | Install as app on any device |
| 🌐 **LAN Discovery** | Auto-detect server on local network |
| 🔒 **Admin Panel** | Full platform management dashboard |
| 📊 **E2E Testing** | Selenium + Appium automated test suite |
| 🚀 **CI/CD Pipeline** | GitHub Actions automated deployment |

---

## 🏗️ Architecture

```
KisaanConnect/
├── 📄 index.html              # Landing / Login page
├── 🌾 farmer-dashboard.html   # Farmer portal
├── 🛍️ customer-dashboard.html # Customer portal
├── 🔧 admin-dashboard.html    # Admin panel
├── ⚙️ server.js               # Express + WebSocket backend
├── 🔥 firebase-db.js          # Firebase Realtime DB integration
├── 📡 kisaan-network.js       # LAN discovery + tunnel manager
├── 📱 app/                    # Native Android (Kotlin)
├── 🧪 e2e_tests/              # Selenium + Appium test suite
├── 🔄 .github/workflows/      # CI/CD pipelines
└── 🐳 Dockerfile              # Container deployment
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/kishanBabu42/KisaanConnect.git
cd KisaanConnect

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Firebase, Resend API keys

# Start the development server
npm start
```

### Environment Variables

```env
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_DATABASE_URL=your_firebase_db_url
RESEND_API_KEY=your_resend_api_key
PORT=3000
```

---

## 📱 Mobile App (Android)

The native Android app is built with **Kotlin** and supports:
- Native login & registration flows
- Drawer navigation
- Firebase push notifications
- Offline-first architecture

**Build the APK:**
```bash
cd app
./gradlew assembleRelease
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run E2E web tests (Selenium)
npm run test:web

# Run mobile tests (Appium)
npm run test:mobile

# Run baseline load test (100 VUs × 60s)
node load-tests/run.js

# View test report
open test-report.html
```

---

## 🔥 Baseline Load Test Results

<div align="center">

![Load Test](https://img.shields.io/badge/Load%20Test-PASSED%20✅-brightgreen?style=flat-square)
![RPS](https://img.shields.io/badge/RPS-336%20req%2Fsec-blue?style=flat-square)
![Error Rate](https://img.shields.io/badge/Error%20Rate-0.00%25-brightgreen?style=flat-square)
![Avg Response](https://img.shields.io/badge/Avg%20Response-104ms-orange?style=flat-square)

</div>

| Metric | Result | Status |
|--------|--------|--------|
| **Virtual Users** | 100 concurrent | ✅ |
| **Duration** | 60 seconds | ✅ |
| **Total Requests** | 20,487 | ✅ |
| **Requests/Second** | **336 RPS** | ✅ PASS |
| **Average Response** | **104ms** | ✅ PASS |
| **Min Response** | 0ms | ✅ |
| **Max Response** | 5,595ms | ✅ PASS |
| **P95 Response** | 735ms | ✅ PASS |
| **P99 Response** | 1,124ms | ✅ PASS |
| **Error Rate** | **0.00%** | ✅ PASS |

📄 **[View Full Load Test Report →](load-tests/RESULTS.md)**

The load test runs 100 virtual users simultaneously for 60 seconds, sending thousands of requests across all API endpoints. An in-memory TTL cache was added to server.js, improving throughput by **8.2×** and reducing average response time from 2,069ms → 104ms.

---

## 🚢 Deployment

| Platform | Status | URL |
|---|---|---|
| **Vercel** (Frontend) | ✅ Live | [kisaanconnect.vercel.app](https://kisaanconnect.vercel.app) |
| **Render** (Backend) | ✅ Live | Auto-deployed via `render.yaml` |
| **Docker** | ✅ Ready | `docker build -t kisaanconnect .` |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Authors

- **KishanBabu42** — [@kishanBabu42](https://github.com/kishanBabu42)
- **DhanunjayRoyal** — [@dhanunjayroyal](https://github.com/dhanunjayroyal)

---

<div align="center">
Made with ❤️ for Indian Farmers 🇮🇳
</div>
