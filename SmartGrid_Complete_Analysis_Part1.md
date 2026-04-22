# SmartGrid — Intelligent Home Power Control System
# Complete Project Analysis & Jury Preparation Report

---

## 1. HIGH-LEVEL OVERVIEW

### 1.1 Purpose
SmartGrid is a **web-based simulation dashboard** that models a home inverter/battery backup power management system. It allows users to monitor battery levels, control appliances, simulate energy depletion/charging, and receive email alerts — all through a premium dark-themed dashboard UI.

### 1.2 Problem It Solves
In many homes (especially in regions with frequent power outages), users have **no visibility** into:
- How long their inverter battery will last under current load
- Which appliances should be turned off first to extend runtime
- How much energy they are consuming and at what cost
- When to trigger power-saving modes automatically

SmartGrid solves this by providing a **centralized control dashboard** with real-time simulation, smart mode switching, load tracking, and alerting.

### 1.3 Real-World Use Case
> **Scenario:** A family in India experiences a power cut. Their inverter battery is at 40%. The AC, two TVs, and multiple fans are running. SmartGrid automatically detects the battery is below the "Power Saving" threshold (30%), cuts non-essential high-wattage appliances (AC, TVs), and sends an email alert to the homeowner with a status report — all without manual intervention.

### 1.4 Target Users
| User Type | Use Case |
|-----------|----------|
| Homeowners with inverters | Monitor and manage backup power |
| Engineering students | Learn IoT, simulation, and full-stack development |
| Smart home enthusiasts | Prototype appliance control dashboards |
| Hardware developers | Use as a UI layer for ESP32/MQTT relay boards |

---

## 2. ARCHITECTURE BREAKDOWN

### 2.1 Overall Architecture

```
┌──────────────────────────────────────────────────┐
│                   CLIENT (Browser)               │
│  ┌─────────────────────────────────────────────┐ │
│  │  React 19 SPA (TypeScript)                  │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │ │
│  │  │ Overview │ │ Control  │ │Remote Control│ │ │
│  │  └──────────┘ └──────────┘ └──────────────┘ │ │
│  │  ┌──────────┐ ┌──────────┐                  │ │
│  │  │AI Assist │ │  About   │                  │ │
│  │  └──────────┘ └──────────┘                  │ │
│  │         │            │                      │ │
│  │    localStorage   fetch('/api/send-alert')  │ │
│  └─────────┼────────────┼──────────────────────┘ │
└────────────┼────────────┼────────────────────────┘
             │            │
             ▼            ▼
     ┌─────────────┐  ┌──────────────────┐
     │ Browser     │  │  Express Server  │
     │ localStorage│  │  (server.ts)     │
     │ (sg-state)  │  │  POST /api/      │
     └─────────────┘  │  send-alert      │
                      │       │          │
                      │       ▼          │
                      │  ┌──────────┐    │
                      │  │ Raw SMTP │    │
                      │  │ (TLS)    │    │
                      │  └──────────┘    │
                      └──────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | React | 19 | Component-based UI rendering |
| **Language** | TypeScript | 5.8 | Type-safe JavaScript |
| **Build Tool** | Vite | 6 | Fast dev server + HMR + bundling |
| **Styling** | Tailwind CSS | 4 | Utility-first CSS framework |
| **Animation** | Motion (Framer Motion) | 12 | Spring-based UI animations |
| **Icons** | Lucide React | 0.546 | Modern icon library |
| **Backend** | Express | 4 | HTTP server + API endpoints |
| **Email** | Raw SMTP (Node.js `net`/`tls`) | — | Send alert emails via STARTTLS |
| **AI Integration** | Google GenAI SDK | 1.29 | Optional Gemini AI assistant |
| **State Persistence** | Browser localStorage | — | Client-side state storage |
| **Runtime** | tsx | 4.21 | TypeScript execution for server |

### 2.3 Why These Technologies?

- **React 19**: Latest stable version with concurrent features; huge ecosystem for dashboards
- **Vite**: Near-instant HMR, native ESM support — far faster than webpack for development
- **TypeScript**: Catches bugs at compile time; critical for complex state like `SystemState`
- **Tailwind CSS 4**: Rapid UI development with utility classes; consistent design system via CSS variables
- **Express**: Lightweight Node.js server; perfect for a single API endpoint
- **Raw SMTP**: Avoids external email service dependencies (no Nodemailer); demonstrates low-level protocol knowledge
- **Motion**: Provides spring-physics animations for toggles, tabs, and mode switchers
- **localStorage**: Zero-config persistence; no database setup needed for a prototype

---

## 3. FRONTEND DEEP DIVE

### 3.1 Folder Structure

```
src/
├── App.tsx          # ALL application logic (~1192 lines, monolithic)
├── main.tsx         # React entry point (ReactDOM.createRoot)
├── index.css        # Tailwind import, CSS variables, global styles
└── vite-env.d.ts    # Vite environment type declarations
```

> [!NOTE]
> The entire frontend lives in a **single file** (`App.tsx`). This is a deliberate choice for a prototype but would need decomposition for production.

### 3.2 Key Components (all in App.tsx)

| Component | Lines | Purpose |
|-----------|-------|---------|
| `App` (default export) | 300–525 | Root: state management, tabs, simulation engine |
| `OverviewTab` | 529–748 | Main dashboard: battery gauge, appliance list, charts, activity log |
| `ControlTab` | 752–959 | Simulation controls, thresholds, charging, CSV export, device registration |
| `RemoteTab` | 963–1011 | Simplified mobile-style remote control interface |
| `AITab` | 1061–1107 | Gemini-powered AI chat assistant |
| `AboutTab` | 1111–1192 | Project info, developer contact |
| `ArcGauge` | 131–159 | SVG arc-based battery percentage visualization |
| `HistoryChart` | 192–296 | SVG line chart for battery & load trends (with magnify modal) |
| `ModeSwitcher` | 163–183 | Animated 3-way toggle (Normal / Power Saving / Ultra) |
| `Toggle` | 96–111 | Animated on/off switch with spring physics |
| `QuantityStepper` | 115–127 | ±1 stepper for appliance quantity |
| `SideCard` | 86–94 | Reusable card container with title and optional badge |
| `Chip` | 185–190 | Small metric display (label + value) |
| `MarkdownText` | 1015–1059 | Renders bold/italic/headers/bullets from AI responses |

### 3.3 State Management

**Approach:** React `useState` + `localStorage` (no Redux, no Context API)

The central state type is `SystemState`:

```typescript
interface SystemState {
  batteryPercent: number;          // 0–100
  mode: 'Normal' | 'Power Saving' | 'Ultra';
  powerSavingThreshold: number;    // e.g., 30
  ultraThreshold: number;          // e.g., 5
  isSimulationRunning: boolean;
  isChargingEnabled: boolean;
  solarInputWatts: number;
  gridChargingWatts: number;
  energyCostPerKwh: number;
  alertEmail: string;
  isEmailAlertsEnabled: boolean;
  appliances: Appliance[];
  notifications: Notification[];
  usageHistory: EnergySample[];
}
```

**State Flow:**
1. On mount: `hydrateState()` reads from `localStorage('sg-state')`
2. Every mutation goes through `updateState()` which calls `setState()` AND `localStorage.setItem()`
3. A sync interval (`SYNC_INTERVAL_MS = 3000ms`) reads localStorage to sync across browser tabs

### 3.4 Routing

**No router library is used.** Navigation is handled via a simple `activeTab` state variable:

```typescript
const tabs = ['Overview', 'Control', 'Remote Control', 'AI Assistant', 'About'];
const [activeTab, setActiveTab] = useState('Overview');
```

Tab switching uses `AnimatePresence` from Motion for smooth fade transitions.

### 3.5 Frontend-Backend Communication

The frontend only communicates with the backend for **one purpose**: sending email alerts.

```typescript
// POST /api/send-alert
const response = await fetch('/api/send-alert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ recipient, reason, batteryPercent, ... })
});
```

All other data (appliances, battery, history) is **entirely client-side**.

---

## 4. BACKEND DEEP DIVE

### 4.1 Server Structure (`server.ts` — 187 lines)

The Express server serves two purposes:
1. **Dev mode**: Hosts Vite middleware for HMR development
2. **Production**: Serves static `dist/` files
3. **API**: Provides the `/api/send-alert` endpoint

### 4.2 API Endpoints

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/send-alert` | Send SMTP email alert report | None |

### 4.3 Business Logic — SMTP Email Flow

The server implements a **raw SMTP client** (no Nodemailer):

```
1. TCP connect to SMTP_HOST:SMTP_PORT (default: smtp.gmail.com:587)
2. Read server greeting
3. EHLO handshake
4. STARTTLS upgrade (plain → TLS)
5. Re-EHLO over TLS
6. AUTH PLAIN (Base64 encoded credentials)
7. MAIL FROM / RCPT TO
8. DATA (HTML email body)
9. QUIT
```

The HTML email is generated by `createAlertHtml()` and contains:
- Battery percentage, mode, load, charging, net flow, runtime
- A color-coded appliance table (green = ON, red = OFF)

### 4.4 Error Handling

```typescript
// Input validation
if (!payload.recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.recipient)) {
  res.status(400).json({ error: 'Enter a valid recipient email address.' });
}

// Server error handling
try { await sendEmailReport(payload); res.json({ ok: true }); }
catch (error) {
  const message = error instanceof Error ? error.message : 'Failed to send alert email.';
  res.status(500).json({ error: message });
}
```

### 4.5 Security Measures in Backend

- `express.json({ limit: '128kb' })` — prevents large payload attacks
- `escapeHtml()` — sanitizes all user data before embedding in HTML emails (XSS prevention)
- Email regex validation on recipient address
- SMTP credentials read from environment variables (not hardcoded)

---

## 5. DATABASE EXPLANATION

### 5.1 Type of Database

**No traditional database is used.** The project uses **browser `localStorage`** for all persistence.

### 5.2 Data Schema

```
localStorage key: "sg-state"
value: JSON string of SystemState
```

The "schema" is effectively the `SystemState` interface containing:
- `appliances[]` — array of `Appliance` objects (id, name, watts, quantity, isEssential, isOn, isAutoCut)
- `notifications[]` — array of `Notification` objects (id, type, message, timestamp)
- `usageHistory[]` — array of `EnergySample` objects (id, time, batteryPercent, activeLoad, chargingWatts, netWatts, mode)

### 5.3 Relationships

```
SystemState (1)
  ├── has many → Appliance[] (14 default + user-added)
  ├── has many → Notification[] (max 50, LIFO)
  └── has many → EnergySample[] (max 36, sliding window)
```

### 5.4 Data Storage & Retrieval Flow

```
Write: updateState(fn) → setState(next) → localStorage.setItem('sg-state', JSON.stringify(next))
Read:  hydrateState(localStorage.getItem('sg-state')) → JSON.parse → merge with defaults → SystemState
Sync:  setInterval(3s) → read localStorage → compare → update React state if changed
```

---

## 6. CONNECTIVITY & DATA FLOW

### 6.1 Complete Request-Response Cycle (Email Alert)

```
Step 1: User clicks "Send Email Alert" button on Control tab
    │
Step 2: sendEmailAlert() validates email & alerts are enabled
    │
Step 3: fetch('POST /api/send-alert') sends JSON payload:
    │   { recipient, batteryPercent, mode, activeLoad, appliances[], ... }
    │
Step 4: Express server receives request at app.post('/api/send-alert')
    │
Step 5: Server validates recipient email with regex
    │
Step 6: sendEmailReport() opens TCP socket to SMTP server
    │
Step 7: STARTTLS handshake → TLS upgrade → AUTH PLAIN
    │
Step 8: createAlertHtml() generates HTML email with appliance table
    │
Step 9: DATA command sends the email through SMTP
    │
Step 10: Server responds { ok: true } or { error: "..." }
    │
Step 11: Frontend shows success/error notification via addNotification()
```

### 6.2 Simulation Data Flow

```
Step 1: User clicks "Start Simulation"
    │
Step 2: isSimulationRunning = true → triggers useEffect
    │
Step 3: setInterval(SIM_TICK_MS = 4000ms) begins
    │
Step 4: Each tick:
    │   a) Calculate inputWatts = solar + grid (if charging enabled)
    │   b) Calculate netWatts = activeLoad - inputWatts
    │   c) Calculate delta = (netWatts / BATTERY_TOTAL_WH) * 100 * (4000 / 3,600,000)
    │   d) nextBattery = batteryPercent - delta (clamped 0–100)
    │   e) Append EnergySample to usageHistory (max 36 samples)
    │   f) If battery ≤ 0 and net > 0 → stop simulation
    │
Step 5: useEffect watches batteryPercent:
    │   - If ≤ ultraThreshold → auto-switch to Ultra mode
    │   - If ≤ powerSavingThreshold → auto-switch to Power Saving
    │
Step 6: Mode change triggers appliance auto-cut:
    │   - Power Saving: cut non-essential appliances ≥ 200W
    │   - Ultra: cut ALL non-essential appliances
    │
Step 7: UI re-renders with new battery %, chart updates, log entries
```

---

## 7. SYSTEM DESIGN THINKING

### 7.1 Scalability Considerations

| Aspect | Current State | Production Improvement |
|--------|--------------|----------------------|
| State storage | localStorage (5MB limit, single device) | PostgreSQL/MongoDB + user accounts |
| Real-time sync | localStorage polling (3s) | WebSocket / Server-Sent Events |
| Email sending | Synchronous SMTP per request | Message queue (RabbitMQ/Redis) |
| Frontend | Single 65KB monolithic file | Component-based architecture with lazy loading |
| Multi-user | None | JWT auth + per-user state |

### 7.2 Performance Bottlenecks

1. **Monolithic App.tsx (65KB, 1192 lines)** — Large component tree re-renders on every state change
2. **localStorage serialization** — Full `JSON.stringify` on every state update (includes all appliances + history)
3. **Simulation interval** — `activeLoad` is a dependency of the simulation `useEffect`, causing interval recreation on every appliance toggle
4. **History limit of 36 samples** — Limits analytical value; no long-term trend storage

### 7.3 Security Concerns

| Concern | Status |
|---------|--------|
| No authentication | ⚠️ Anyone can access the dashboard and send emails |
| No rate limiting on `/api/send-alert` | ⚠️ Abuse vector for email spamming |
| SMTP credentials in `.env.local` | ✅ Not committed to git |
| HTML escaping in emails | ✅ `escapeHtml()` prevents XSS |
| No HTTPS enforcement | ⚠️ Credentials sent in plaintext over HTTP |
| localStorage not encrypted | ⚠️ Any JS on the page can read state |
| No CSRF protection | ⚠️ Cross-site requests could trigger email sends |

### 7.4 Possible Improvements

1. Add **WebSocket** for real-time cross-device sync instead of localStorage polling
2. Implement **user authentication** (JWT + bcrypt)
3. Add **rate limiting** middleware (e.g., `express-rate-limit`)
4. Split `App.tsx` into **modular components** (`/components`, `/hooks`, `/utils`)
5. Add **unit tests** (Vitest) and **E2E tests** (Playwright)
6. Implement **database persistence** (SQLite for prototype, PostgreSQL for production)
7. Add **PWA support** (service worker + manifest) for mobile installation
8. Dockerize for **consistent deployment**
