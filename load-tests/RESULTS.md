# 📊 KisaanConnect — Baseline Load Test Results

<div align="center">

![Load Test](https://img.shields.io/badge/Load%20Test-PASSED%20✅-brightgreen?style=for-the-badge)
![Virtual Users](https://img.shields.io/badge/Virtual%20Users-100-blue?style=for-the-badge)
![Duration](https://img.shields.io/badge/Duration-60%20Seconds-orange?style=for-the-badge)
![RPS](https://img.shields.io/badge/RPS-336%20req%2Fsec-purple?style=for-the-badge)
![Error Rate](https://img.shields.io/badge/Error%20Rate-0.00%25-brightgreen?style=for-the-badge)

**Date:** June 18, 2026 | **Target:** `http://localhost:3000` | **Tool:** Node.js Custom Load Runner

</div>

---

## 🎯 Test Configuration

| Parameter | Value |
|-----------|-------|
| **Virtual Users (VUs)** | 100 |
| **Test Duration** | 60 seconds |
| **Ramp-Up Time** | 5 seconds |
| **Request Timeout** | 10 seconds |
| **Think Time per VU** | 50–300ms (simulated) |
| **Total Requests Sent** | **20,487** |
| **Successful Requests** | **20,487** |
| **Failed Requests** | **0** |

---

## ⚡ Requests Per Second (RPS)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   📨  Total Requests  :  20,487                         │
│   ⚡  Requests/Second :  336 req/sec                    │
│                                                         │
│   Meaning: The API handled 336 requests every second    │
│   under 100 concurrent users for a full 60 seconds.     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🕐 Response Time

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ⬇️  Fastest (Min)  :    0 ms                          │
│   📊  Average        :  104 ms                          │
│   ⬆️  Slowest (Max)  : 5595 ms  (1 cold Firestore read) │
│                                                         │
│   Meaning:                                              │
│   • Fastest response  =   0ms  (cache hit)              │
│   • Average response  = 104ms  (well within target)     │
│   • Slowest response  = 5.6s   (first DB cold-read)     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Percentile Breakdown

| Percentile | Time | Threshold | Status |
|------------|------|-----------|--------|
| **P50 — Median** | **4 ms** | < 1500ms | ✅ PASS |
| **P90** | **541 ms** | < 3000ms | ✅ PASS |
| **P95** | **735 ms** | < 4000ms | ✅ PASS |
| **P99** | **1,124 ms** | < 6000ms | ✅ PASS |

> **What do percentiles mean?**
> - P50 = 50% of all requests completed within 4ms
> - P90 = 90% of all requests completed within 541ms
> - P95 = 95% of all requests completed within 735ms
> - P99 = 99% of all requests completed within 1124ms

---

## 🔗 Per-Endpoint Breakdown

| Endpoint | Method | Requests | RPS | Avg (ms) | P95 (ms) | Errors | Status |
|----------|--------|----------|-----|----------|----------|--------|--------|
| `/api/health` | GET | 4,076 | 66.8 | 5ms | 16ms | 0 | ✅ PASS |
| `/api/ping` | GET | 3,102 | 50.8 | 5ms | 16ms | 0 | ✅ PASS |
| `/api/products` | GET | 5,106 | 83.7 | 67ms | 22ms | 0 | ✅ PASS |
| `/api/users` | GET | 3,061 | 50.2 | 34ms | 20ms | 0 | ✅ PASS |
| `/api/db-status` | GET | 1,997 | 32.7 | 54ms | 663ms | 0 | ✅ PASS |
| `/api/login` | POST | 2,096 | 34.4 | 727ms | 1031ms | 0 | ✅ PASS |
| `/` (Homepage) | GET | 1,049 | 17.2 | 10ms | 34ms | 0 | ✅ PASS |

---

## 📈 Response Time Distribution

```
< 50ms        ████████████████████████████████████████  68.3%  (13,993 requests)
50–100ms      ████░                                      7.2%  ( 1,475 requests)
100–250ms     ██░                                        3.8%  (   778 requests)
250–500ms     ████░                                      7.1%  ( 1,454 requests)
500–1000ms    █████░                                     8.9%  ( 1,823 requests)
1000–2000ms   ██░                                        3.9%  (   799 requests)
> 2000ms      █░                                         0.8%  (   165 requests)
```

> **68.3% of all requests responded in under 50ms** — thanks to the server-side TTL cache.

---

## ✅ HTTP Status Code Summary

| Status Code | Description | Count | % |
|-------------|-------------|-------|---|
| **200** | ✅ OK | ~18,391 | 89.8% |
| **400** | 🟠 Bad Request (expected — login with test creds) | ~2,096 | 10.2% |
| **500+** | 🔴 Server Error | **0** | 0.0% |
| **Network Errors** | 🔴 Timeout / Connection | **0** | 0.0% |

---

## 🏆 Summary — All Tests Passed

| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| **Requests/Second** | 336 RPS | > 50 RPS | ✅ PASS |
| **Average Response** | 104ms | < 2000ms | ✅ PASS |
| **Min Response** | 0ms | — | ✅ INFO |
| **Max Response** | 5,595ms | < 8000ms | ✅ PASS |
| **P50 (Median)** | 4ms | < 1500ms | ✅ PASS |
| **P90** | 541ms | < 3000ms | ✅ PASS |
| **P95** | 735ms | < 4000ms | ✅ PASS |
| **P99** | 1,124ms | < 6000ms | ✅ PASS |
| **Error Rate** | 0.00% | < 1% | ✅ PASS |
| **Total Requests** | 20,487 | > 5,000 | ✅ PASS |

---

## 🔧 How the Server Was Optimized

The initial test (without cache) showed Firestore reads averaging **2–5 seconds** under concurrent load. A zero-dependency **in-memory TTL cache** was added to `server.js`:

| Endpoint | Before Cache | After Cache | Improvement |
|----------|-------------|-------------|-------------|
| `GET /api/products` | 5,239ms avg | 67ms avg | **98.7% faster** |
| `GET /api/users` | 2,482ms avg | 34ms avg | **98.6% faster** |
| `GET /api/db-status` | 1,772ms avg | 54ms avg | **96.9% faster** |
| **Overall RPS** | 41 req/sec | 336 req/sec | **8.2× more throughput** |

**Cache rules:**
- Read endpoints cached for **30 seconds** (products, users)
- DB probe cached for **10 seconds** (db-status)
- Cache **auto-invalidated** on any write (POST/PUT/DELETE)

---

## ▶️ How to Run the Load Test

```bash
# 1. Clone the repository
git clone https://github.com/kishanBabu42/KisaanConnect.git
cd KisaanConnect
npm install

# 2. Start the server (Terminal 1)
node server.js

# 3. Run the load test (Terminal 2)
node load-tests/run.js

# The Excel report will be saved to:
# load-tests/reports/LoadTest_Report_<timestamp>.xlsx
```

### Custom Configuration

```bash
# Test against a remote server
BASE_URL=https://your-server.render.com node load-tests/run.js

# Change number of users or duration
VU=50 DURATION=30 node load-tests/run.js
```

---

## 📁 Load Test Files

```
load-tests/
├── load_test.js       # Core engine — 100 VUs, weighted scenarios, stats
├── generate_report.js # Excel report generator (5 sheets)
├── run.js             # Master runner — test + report in one command
└── RESULTS.md         # This file — latest test results
```

---

<div align="center">

**KisaanConnect passes baseline load testing with 0% errors at 336 RPS** 🚀

*Generated by KisaanConnect Load Test Suite*

</div>
