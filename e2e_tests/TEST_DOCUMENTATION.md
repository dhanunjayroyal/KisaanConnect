# KisaanConnect — Deployment & E2E Testing Documentation

> **Project:** KisaanConnect | **Version:** v2.0 | **Team:** KisaanConnect Dev Team

---

## Final Architecture

```
Developer Push
      ↓
GitHub Repository (github.com/dhanunjayroyal/KisaanConnect)
      ↓
GitHub Actions Trigger (e2e.yml — 6 Jobs)
      ↓
┌──────────────────────────────────────────────┐
│  Job 1: 🌐 Selenium Web Tests     (300 cases)│
│  Job 2: 📱 Appium Android Tests   (300 cases)│
│  Job 3: 🔬 Unit Tests             (300 cases)│
│  Job 4: ✅ Validation Tests       (300 cases)│
│  Job 5: 🚀 Deployment Status      (300 cases)│
│  Job 6: 📊 Load Testing           (300 cases)│
└──────────────────────────────────────────────┘
      ↓
Job 6: 📊 Compile HTML Report + Deploy to GitHub Pages
      ↓
Pass / Fail Dashboard → https://dhanunjayroyal.github.io/KisaanConnect/test-report.html
```

---

## Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Upload 1800-case automated test suite"
git branch -M main
git remote add origin https://github.com/dhanunjayroyal/KisaanConnect.git
git push -u origin main
```

---

## Step 2 — Install Testing Dependencies

```bash
npm install selenium-webdriver chromedriver --save-dev
npm install gh-pages --save-dev
```

---

## Step 3 — package.json Scripts

```json
{
  "homepage": "https://dhanunjayroyal.github.io/KisaanConnect",
  "scripts": {
    "start":         "node server.js",
    "build":         "node build-env.js",
    "predeploy":     "npm run build",
    "deploy":        "gh-pages -d dist",
    "test:web":      "node e2e_tests/selenium/web_e2e.test.js",
    "test:mobile":   "node e2e_tests/appium/mobile_e2e.test.js",
    "test:unit":     "node e2e_tests/unit/unit_tests.js",
    "test:validate": "node e2e_tests/validation/validation_tests.js",
    "test:deploy":   "node e2e_tests/deployment/deployment_status.js",
    "test:all":      "node e2e_tests/test_runner.js"
  }
}
```

---

## Step 4 — Deploy to GitHub Pages

```bash
npm run deploy
```

**Live URL:** https://dhanunjayroyal.github.io/KisaanConnect

---

## Step 5 — Enable GitHub Pages

1. Go to **Settings → Pages**
2. Source → **Deploy from branch**
3. Branch → `gh-pages` → **Save**

---

## Step 6 — Required HTML Element IDs for Selenium

```html
<!-- Auth -->
<input id="login-email" />       <input id="login-password" />
<select id="login-role"></select> <button id="login-submit-btn">Login</button>
<input id="reg-name" />          <input id="reg-email" />
<input id="reg-password" />      <input id="reg-mobile" />
<input id="reg-location" />      <select id="reg-role"></select>
<button id="reg-submit-btn">Register</button>

<!-- Farmer Dashboard -->
<button id="add-product-btn" />  <input id="p-name" />
<input id="p-price" />           <input id="p-qty" />
<input id="p-age" />             <input id="p-loc" />
<button id="save-product-btn" /> <span id="user-name"></span>

<!-- Admin -->
<input id="admin-email" />       <input id="admin-password" />
<button id="admin-login-btn" />
```

---

## Step 7 — Edit User Config in Test Files

Each test file has a **USER CONFIG** block you can edit:

**`e2e_tests/selenium/web_e2e.test.js`**
```js
const USER_CONFIG = {
    BASE_URL:       'http://localhost:3000', // ← change URL
    TEST_PASSWORD:  'Test@12345',            // ← change password
    ADMIN_EMAIL:    'admin@kisaanconnect.com',
    ADMIN_PASSWORD: 'admin123',
    TIMEOUT:        8000,
};
```

---

## Step 8 — Run Tests Locally

```bash
# 1. Start server
node server.js

# 2. Run each suite (separate terminal)
npm run test:web        # 300 Selenium web tests
npm run test:mobile     # 300 Appium Android tests
npm run test:unit       # 300 API unit tests
npm run test:validate   # 300 validation tests
npm run test:deploy     # 300 deployment checks

# 3. Generate HTML report
npm run test:all
```

---

## Step 9 — GitHub Actions CI/CD

**Trigger:** Every `git push` to `main`

```bash
git add .
git commit -m "Update feature"
git push   # Actions automatically runs all 1800 tests
```

**Actions URL:** https://github.com/dhanunjayroyal/KisaanConnect/actions/workflows/e2e.yml

---

## Grand Summary — 1,800 Unique Test Cases

| Suite | Type | Cases |
|:---|:---|:---:|
| 🌐 Selenium Web | UI/UX + Functional | 300 |
| 📱 Appium Android | Mobile E2E | 300 |
| 🔬 Unit Tests | API Unit Testing | 300 |
| ✅ Validation | Input Validation | 300 |
| 🚀 Deployment | Infrastructure Status | 300 |
| 📊 Load Testing | Performance SLA | 300 |
| **TOTAL** | **All Categories** | **1,800** |

---

## Step 10 — Verify Reports

After successful execution:

```
✅ Selenium Web   : 300 / 300  PASSED
✅ Appium Android : 300 / 300  PASSED
✅ Unit Tests     : 300 / 300  PASSED
✅ Validation     : 300 / 300  PASSED
✅ Deployment     : 300 / 300  PASSED
✅ Load Testing   : 300 / 300  PASSED
──────────────────────────────────────
🎉 1800 / 1800 PASSED — READY TO DEPLOY
```

| Report | Location |
|:---|:---|
| Live HTML Dashboard | https://dhanunjayroyal.github.io/KisaanConnect/test-report.html |
| GitHub Actions | https://github.com/dhanunjayroyal/KisaanConnect/actions |
| Download CSV Artifacts | e2e_tests/reports/ |
