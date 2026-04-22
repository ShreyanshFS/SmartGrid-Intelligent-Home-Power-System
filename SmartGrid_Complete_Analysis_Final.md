# SmartGrid — Intelligent Home Power Control System
# Complete Project Analysis & Jury Preparation Report

**Project:** SmartGrid — Intelligent Home Power Control System  
**Developer:** Shreyansh Dwivedi  
**Repository:** github.com/ShreyanshFS/SmartGrid-Intelligent-Home-Power-System  
**Date:** April 2026  

---

## 1. HIGH-LEVEL OVERVIEW

### 1.1 Purpose
SmartGrid is a **web-based simulation dashboard** that models a home inverter/battery backup power management system. It lets users monitor battery levels, control appliances, simulate energy depletion/charging, and receive email alerts — through a premium dark-themed dashboard.

### 1.2 Problem It Solves
In homes with frequent power outages, users have **no visibility** into:
- How long their inverter battery will last under current load
- Which appliances should be turned off first to extend runtime
- How much energy they are consuming and at what cost
- When to trigger power-saving modes automatically

SmartGrid solves this with a **centralized control dashboard** featuring real-time simulation, smart mode switching, load tracking, and alerting.

### 1.3 Real-World Use Case
> A family experiences a power cut. Their inverter battery is at 40%. The AC, TVs, and fans are running. SmartGrid automatically detects the battery has dropped below the "Power Saving" threshold, cuts non-essential high-wattage appliances, and sends an email alert with a full status report.

### 1.4 Target Users

| User Type | Use Case |
|-----------|----------|
| Homeowners with inverters | Monitor and manage backup power |
| Engineering students | Learn IoT, simulation, and full-stack development |
| Smart home enthusiasts | Prototype appliance control dashboards |
| Hardware developers | UI layer for ESP32/MQTT relay boards |

---

## 2. ARCHITECTURE BREAKDOWN

### 2.1 Overall Architecture

```
┌────────────────────────────────────────────┐
│            CLIENT (Browser)                │
│  ┌───────────────────────────────────────┐ │
│  │  React 19 SPA (TypeScript)            │ │
│  │  Tabs: Overview | Control | Remote    │ │
│  │        AI Assistant | About           │ │
│  │                                       │ │
│  │  State: React useState + localStorage │ │
│  └────────────┬──────────────────────────┘ │
│               │ fetch POST /api/send-alert │
└───────────────┼────────────────────────────┘
                ▼
        ┌───────────────┐      SMTP/TLS
        │ Express Server│─────────────────▶ Gmail SMTP
        │ (server.ts)   │                   (email to recipient)
        └───────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend Framework | React | 19 | Component-based UI |
| Language | TypeScript | 5.8 | Type-safe JavaScript |
| Build Tool | Vite | 6 | Fast dev server + HMR + bundling |
| Styling | Tailwind CSS | 4 | Utility-first CSS |
| Animation | Motion (Framer Motion) | 12 | Spring-based UI animations |
| Icons | Lucide React | 0.546 | Icon library |
| Backend | Express | 4 | HTTP server + API |
| Email | Raw SMTP (Node.js net/tls) | — | STARTTLS email sending |
| AI Integration | Google GenAI SDK | 1.29 | Optional Gemini AI assistant |
| State Persistence | Browser localStorage | — | Client-side storage |
| Runtime | tsx | 4.21 | TypeScript execution for server |

### 2.3 Why These Technologies?

- **React 19** — Latest stable; huge ecosystem for dashboards
- **Vite** — Near-instant HMR, native ESM; far faster than webpack
- **TypeScript** — Catches bugs at compile time for complex state
- **Tailwind CSS 4** — Rapid styling with utility classes + CSS variables
- **Express** — Lightweight; perfect for a single API endpoint
- **Raw SMTP** — No external dependency; demonstrates protocol-level knowledge
- **Motion** — Physics-based animations for professional feel
- **localStorage** — Zero-config persistence for prototyping

---

## 3. FRONTEND DEEP DIVE

### 3.1 Folder Structure

```
src/
├── App.tsx          # ALL application logic (~1192 lines)
├── main.tsx         # React entry point
├── index.css        # Tailwind, CSS variables, global styles
└── vite-env.d.ts    # Vite environment type declarations
```

### 3.2 Key Components (all in App.tsx)

| Component | Purpose |
|-----------|---------|
| `App` (default export) | Root: state, tabs, simulation engine |
| `OverviewTab` | Dashboard: battery gauge, appliance list, charts, log |
| `ControlTab` | Simulation controls, thresholds, charging, CSV, device registration |
| `RemoteTab` | Simplified mobile-style remote control |
| `AITab` | Gemini-powered AI chat assistant |
| `AboutTab` | Project info, developer contact |
| `ArcGauge` | SVG arc battery percentage visualization |
| `HistoryChart` | SVG line chart for battery & load trends |
| `ModeSwitcher` | Animated 3-way toggle (Normal / Save / Ultra) |
| `Toggle` | Animated on/off switch with spring physics |
| `QuantityStepper` | ±1 stepper for appliance quantity |
| `SideCard` | Reusable card container |
| `Chip` | Small metric display (label + value) |
| `MarkdownText` | Renders bold/italic/headers from AI responses |

### 3.3 State Management

**Approach:** React `useState` + `localStorage` — no Redux, no Context API.

Central state type:

```typescript
interface SystemState {
  batteryPercent: number;
  mode: 'Normal' | 'Power Saving' | 'Ultra';
  powerSavingThreshold: number;
  ultraThreshold: number;
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
1. On mount → `hydrateState()` reads from `localStorage('sg-state')`
2. Every mutation → `updateState()` calls `setState()` AND `localStorage.setItem()`
3. Sync interval (3s) reads localStorage to sync across browser tabs

### 3.4 Routing

No router library. Navigation via `activeTab` state with `AnimatePresence` transitions:
```typescript
const tabs = ['Overview', 'Control', 'Remote Control', 'AI Assistant', 'About'];
```

### 3.5 Frontend-Backend Communication

Only one API call exists — sending email alerts:
```typescript
fetch('/api/send-alert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ recipient, batteryPercent, mode, appliances, ... })
});
```

All other data is entirely client-side.

---

## 4. BACKEND DEEP DIVE

### 4.1 Server Structure (server.ts — 187 lines)

Express server with two roles:
1. **Dev mode** — Hosts Vite middleware for HMR
2. **Production** — Serves static `dist/` files
3. **API** — `/api/send-alert` endpoint

### 4.2 API Endpoint

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/send-alert` | Send SMTP email alert report | None |

### 4.3 SMTP Email Flow

Raw SMTP client (no Nodemailer):
```
1. TCP connect → smtp.gmail.com:587
2. Read greeting → EHLO
3. STARTTLS → TLS upgrade
4. Re-EHLO over TLS
5. AUTH PLAIN (Base64)
6. MAIL FROM / RCPT TO
7. DATA (HTML email)
8. QUIT
```

The HTML email contains battery status, mode, load, and a color-coded appliance table.

### 4.4 Error Handling
- Input validation: email regex check → 400 response
- SMTP errors: caught and returned as 500 with message
- Payload size: limited to 128KB via `express.json({ limit: '128kb' })`

### 4.5 Security Measures
- `escapeHtml()` sanitizes all data in emails (XSS prevention)
- SMTP credentials from environment variables
- Payload size limiting

---

## 5. DATABASE EXPLANATION

### 5.1 Type
**No traditional database.** Uses browser `localStorage`.

### 5.2 Schema
```
Key: "sg-state"
Value: JSON string of SystemState
```

Contains:
- `appliances[]` — Appliance objects (id, name, watts, quantity, isEssential, isOn, isAutoCut)
- `notifications[]` — max 50, LIFO order
- `usageHistory[]` — max 36 samples, sliding window

### 5.3 Relationships
```
SystemState (1)
  ├── has many → Appliance[] (14 default + user-added)
  ├── has many → Notification[] (capped at 50)
  └── has many → EnergySample[] (capped at 36)
```

### 5.4 Storage Flow
```
Write: updateState() → setState() → localStorage.setItem(JSON.stringify)
Read:  hydrateState(localStorage.getItem()) → JSON.parse → merge defaults
Sync:  3s interval → read localStorage → compare → update if changed
```

---

## 6. CONNECTIVITY & DATA FLOW

### 6.1 Email Alert Request-Response Cycle

```
User clicks "Send Email Alert"
  → sendEmailAlert() validates email & alerts enabled
    → fetch POST /api/send-alert (JSON payload)
      → Express validates recipient email
        → sendEmailReport() opens TCP → STARTTLS → AUTH → DATA
          → Gmail SMTP server delivers email
        ← Server responds { ok: true }
      ← Frontend shows success notification
```

### 6.2 Simulation Data Flow

```
User clicks "Start Simulation"
  → isSimulationRunning = true
    → useEffect starts setInterval(4000ms)
      → Each tick:
         a) inputWatts = solar + grid
         b) netWatts = activeLoad - inputWatts
         c) delta = (netWatts / 1000Wh) × 100 × (4000 / 3,600,000)
         d) nextBattery = batteryPercent - delta (clamped 0-100)
         e) Append EnergySample to history
         f) If battery ≤ 0 → auto-stop
      → useEffect watches batteryPercent:
         - ≤ ultraThreshold → Ultra mode (cut ALL non-essential)
         - ≤ powerSavingThreshold → Power Saving (cut ≥200W non-essential)
      → UI re-renders with updated values
```

---

## 7. SYSTEM DESIGN THINKING

### 7.1 Scalability

| Aspect | Current | Production Fix |
|--------|---------|---------------|
| Storage | localStorage (5MB, single device) | PostgreSQL + user accounts |
| Real-time | Polling (3s) | WebSocket / SSE |
| Email | Synchronous SMTP | Message queue (Redis + Bull) |
| Frontend | Monolithic 65KB file | Component splitting + lazy loading |
| Multi-user | None | JWT auth + per-user state |

### 7.2 Performance Bottlenecks
1. **Monolithic App.tsx** — full re-render on state changes
2. **Full JSON.stringify** on every state update
3. **Interval recreation** on appliance toggle (useEffect dep array)
4. **36-sample history limit** — limits analytical value

### 7.3 Security Concerns

| Concern | Status |
|---------|--------|
| No authentication | ⚠️ Open access |
| No rate limiting | ⚠️ Email spam risk |
| SMTP creds in .env.local | ✅ Not in git |
| HTML escaping | ✅ Prevents XSS |
| No HTTPS | ⚠️ Plaintext transport |
| No CSRF protection | ⚠️ Cross-site risk |

---

## 8. JURY-LEVEL QUESTIONS WITH ANSWERS

### 8.1 Basic Questions

**Q1: What is SmartGrid and what problem does it solve?**
> SmartGrid is a web-based simulation for home inverter power management. It solves the problem of homeowners having no visibility into battery runtime, load distribution, or automated power-saving during outages.

**Q2: What technologies did you use and why?**
> React 19 + TypeScript for type-safe UI, Vite for fast builds, Tailwind CSS for styling, Express for the backend API, raw SMTP for email alerts, and Motion for animations. Chosen for speed, type safety, and modern developer experience.

**Q3: How does the battery simulation work?**
> Every 4 seconds, the system calculates `netWatts = activeLoad - chargingInput`, then `delta = (netWatts / BATTERY_WH) × 100 × (4000 / 3,600,000)`. Battery percentage is decremented by this delta each tick.

**Q4: Where is data stored?**
> Browser localStorage under key `sg-state` as serialized JSON. No traditional database — a deliberate prototype choice.

**Q5: How many API endpoints does the server have?**
> One: `POST /api/send-alert`. It accepts battery/appliance data + recipient email and sends an HTML report via SMTP.

### 8.2 Intermediate Questions

**Q6: Explain auto-mode switching logic.**
> A `useEffect` watches `batteryPercent`. When it drops ≤ `powerSavingThreshold` (30%), mode becomes "Power Saving" — non-essential appliances ≥200W are auto-cut. When ≤ `ultraThreshold` (5%), "Ultra" mode cuts ALL non-essential appliances.

**Q7: Why raw SMTP instead of Nodemailer?**
> Demonstrates protocol-level knowledge (EHLO → STARTTLS → AUTH PLAIN → DATA → QUIT). Avoids heavy dependencies. Shows understanding valuable for embedded/IoT contexts.

**Q8: How does cross-tab sync work?**
> A 3-second interval reads localStorage, parses it, and compares via `JSON.stringify`. If different, React state updates. Limitation: 3-second lag and inefficient full-JSON comparison.

**Q9: How does the AI assistant get context?**
> Each Gemini API call includes a `systemInstruction` with live metrics: battery %, mode, load, and runtime. This lets the AI give contextually relevant energy advice.

**Q10: How is energy cost calculated?**
> `simulatedKwh = Σ(activeLoad × 4000ms / 3,600,000 / 1000)` per history sample. `estimatedCost = simulatedKwh × energyCostPerKwh` (default ₹8/kWh).

### 8.3 Advanced Questions

**Q11: How would you refactor App.tsx for production?**
> Split into: `/components/` (ArcGauge, Toggle, etc.), `/pages/` (each tab), `/hooks/` (useSimulation, useLocalStorageSync), `/types/`, `/utils/`, `/context/` (replace prop drilling with React Context). Enables code-splitting, lazy loading, testability.

**Q12: How to scale to 10,000 users?**
> PostgreSQL + JWT auth, WebSockets for real-time, Redis message queue for emails, Nginx load balancer, CDN for static assets, Docker + Kubernetes for horizontal scaling.

**Q13: Is there a race condition with multi-tab state?**
> Yes. Both tabs write to the same localStorage key. Tab A can overwrite Tab B's changes. Fix: Use the `storage` event listener for instant sync, or CRDTs for merge-safe state, or server-side state.

**Q14: What are the pitfalls of setInterval for simulation?**
> Timer drift, browser throttling in background tabs, interval recreation on dependency changes. Better: `requestAnimationFrame` with delta-time, or `setTimeout` chains with self-correction against `Date.now()`.

**Q15: How would you add ESP32 hardware?**
> ESP32 publishes to MQTT topics → Express subscribes via mqtt.js → WebSocket pushes to frontend → Frontend sends commands back through the same chain → ESP32 controls relays via GPIO.

### 8.4 Tricky Edge-Case Questions

**Q16: What happens at exactly 0% battery?**
> If `netWatts > 0` (draining), simulation auto-stops. If `netWatts ≤ 0` (charging exceeds load), simulation continues and battery charges back up. Battery is clamped via `Math.max(0, ...)`.

**Q17: What if Ultra threshold > Power Saving threshold?**
> **Bug.** Ultra is checked first (`≤ ultraThreshold`), so it would trigger Ultra mode at a higher battery level than intended. The UI should enforce `ultraThreshold < powerSavingThreshold`.

**Q18: Can the email endpoint be abused?**
> Yes — no rate limiting, no auth, no CAPTCHA. Attacker could spam the SMTP sender, get the account flagged, or exhaust server resources. Fix: `express-rate-limit`, auth tokens, CAPTCHA.

**Q19: What if localStorage is full?**
> `setItem()` throws `QuotaExceededError`. Current code doesn't catch this — React state updates but persistence silently fails. Fix: try-catch, data pruning, or migrate to IndexedDB.

**Q20: What if saved schema has extra/changed fields?**
> The spread `{ ...createInitialState(), ...parsed }` preserves unknown fields. But renamed/retyped fields could crash the app. Production needs versioned schema migrations.

---

## 9. KNOWLEDGE GAPS DETECTION

### 9.1 Areas to Study

| Gap Area | What to Study |
|----------|--------------|
| **SMTP Protocol** | RFC 5321, RFC 3207 (STARTTLS). Understand EHLO, AUTH PLAIN, DATA flow |
| **useEffect Dependencies** | React docs on effect cleanup, stale closures, dependency arrays |
| **Battery Math** | Watt-hours, power×time relationship, unit conversions (ms → hours) |
| **SVG Path Commands** | `stroke-dasharray`, `stroke-dashoffset` for arcs; M/L path commands for charts |
| **TLS/Cryptography** | TLS handshake, STARTTLS upgrade, certificate validation |
| **Spring Animation Physics** | How stiffness/damping values produce different animation feels |
| **Closure Behavior** | How `setInterval` captures variables; why functional setState avoids stale state |
| **TypeScript Generics** | `useState<SystemState>`, `Promise<string>`, generic hook patterns |

---

## 10. CODE QUALITY REVIEW

### 10.1 Strengths ✅

- Well-defined TypeScript interfaces for all data types
- `escapeHtml()` prevents XSS in emails
- `hydrateState()` gracefully handles missing/corrupt localStorage
- Schema migration via quantity backfill (`{ quantity: 1, ...a }`)
- Consistent CSS design system using custom properties
- Professional animation quality (spring-based toggles, tab transitions)
- Payload size limiting on the server

### 10.2 Weaknesses ⚠️

| Issue | Impact | Fix |
|-------|--------|-----|
| Monolithic App.tsx (1192 lines) | Hard to maintain/test | Split into components/hooks/utils |
| `any` type on component props | Loses TypeScript safety | Define proper prop interfaces |
| No error boundary | One crash kills the app | Add `<ErrorBoundary>` wrapper |
| No tests | No regression protection | Vitest + Playwright |
| No loading states for async ops | Poor UX during email/AI calls | Add loading indicators |
| Threshold validation missing | Ultra can exceed Power Saving | Add `Math.min/max` constraints |
| No accessibility (aria, keyboard) | Screen readers can't navigate | Add ARIA labels, keyboard handlers |
| Hardcoded `BATTERY_TOTAL_WH = 1000` | Not configurable | Move to user-editable state |
| Prop drilling through 3+ levels | Fragile, verbose | Use React Context or Zustand |

---

## 11. REAL-WORLD ENHANCEMENTS

### 11.1 Feature Additions

| Feature | Difficulty | Value |
|---------|-----------|-------|
| User Authentication (JWT) | Medium | High |
| Database Persistence (PostgreSQL) | Medium | High |
| WebSocket Real-Time Sync | Medium | High |
| PWA Support (offline + install) | Low | Medium |
| Scheduled Email Reports (cron) | Medium | Medium |
| Historical Analytics Dashboard | High | High |
| WhatsApp Alerts (Twilio) | Medium | Medium |
| Dark/Light Theme Toggle | Low | Medium |

### 11.2 Industry Improvements
1. **CI/CD**: GitHub Actions → lint → test → build → deploy
2. **Monitoring**: Sentry for errors, LogRocket for sessions
3. **API Docs**: Swagger/OpenAPI spec
4. **Docker**: One-command setup
5. **Env Validation**: Zod schema at startup
6. **Structured Logging**: Winston or Pino

### 11.3 Deployment Options

| Platform | Best For | Cost |
|----------|----------|------|
| Railway | Full-stack (Express + React) | Free tier |
| Render | Full-stack with workers | Free tier |
| DigitalOcean | Production + custom domain | $5/mo |
| Self-hosted VPS + Docker | ESP32 MQTT broker | $5/mo |

---

## 12. DATA FLOW DIAGRAMS

### 12.1 Overall System Flow

```
┌────────────────────────────────────────────────────┐
│                  USER (Browser)                     │
│                                                     │
│  Click/Toggle ──▶ React Handler ──▶ setState        │
│                                      + localStorage │
│                                          │          │
│                              ┌───────────┘          │
│                              ▼                      │
│                        UI Re-render                 │
│                              │                      │
│                    ┌─────────┘                       │
│                    ▼                                │
│              localStorage ◀────── 3s sync ──▶ Other Tabs
└────────────────────────────────────────────────────┘

┌─────────────── EMAIL ALERT FLOW ───────────────────┐
│                                                    │
│  Browser           Server              External    │
│  ┌──────┐ POST   ┌────────┐  SMTP/TLS ┌────────┐   │
│  │Button│──────▶ │Express │─────────▶ │Gmail   │  │
│  └──────┘ JSON   │Validate│ STARTTLS  │Server  │   │
│     ▲            │+ HTML  │ AUTH      └───┬────┘   │
│     │ {ok:true}  └────────┘               ▼        │
│     └──────────────────┘           Recipient Inbox │
└────────────────────────────────────────────────────┘

┌─────────────── SIMULATION ENGINE ──────────────────┐
│                                                    │
│  Start ──▶ setInterval(4s) ──▶ Calc netWatts      │
│                                    │               │
│                                    ▼               │
│                              Update battery%       │
│                                    │               │
│                    ┌───────────────┘               │
│                    ▼                               │
│              Check thresholds                      │
│              ├── ≤ ultra → Ultra mode (cut ll)     │
│              ├── ≤ saving → Save mode (cut ≥200W)  │
│              └── Append history sample             │
└────────────────────────────────────────────────────┘

┌─────────────── AI ASSISTANT FLOW ───────────────────┐
│                                                     │
│   User Question ──▶ askAI() + system context       
│                        │                            │
│                        ▼                            │  
│                   Gemini API call                   │
│                        │                            │
│                        ▼                            │
│                   Render Markdown response          │
│                                                     │
│  Context: Battery%, Mode, Load, Runtime             │
└─────────────────────────────────────────────────────┘
```

### 12.2 Component Hierarchy

```
<App>
├── <nav> (Header: Logo + Tab buttons + Telemetry badge)
├── <AnimatePresence>
│   ├── <OverviewTab>
│   │   ├── Left: ArcGauge, ModeSwitcher, Chips, AI Status
│   │   ├── Center: Appliance list (edit/toggle/remove/quantity)
│   │   └── Right: HistoryChart, Activity Log
│   ├── <ControlTab>
│   │   ├── Grid Simulation (start/stop, battery slider)
│   │   ├── Automatic Logic (threshold sliders)
│   │   ├── Charging & Cost (solar/grid sliders, CSV export)
│   │   ├── Hardware Gateway (ESP32 placeholder)
│   │   ├── Alert Channels (SMTP email setup)
│   │   └── Device Registration (form)
│   ├── <RemoteTab> — Mobile-style appliance control
│   ├── <AITab> — Chat interface + quick actions
│   └── <AboutTab> — Project info + developer contact
└── Battery progress bar (bottom)
```

---

## 13. FINAL SUMMARY

### Key Talking Points for Jury

| Area | Key Point |
|------|-----------|
| What it does | Simulates home inverter management: battery tracking, appliance control, auto-modes, email alerts, AI assistant |
| Architecture | React SPA + Express backend + localStorage + raw SMTP + optional Gemini AI |
| Unique feat | Raw SMTP client with STARTTLS (no Nodemailer) |
| State approach | React useState + localStorage with cross-tab polling |
| Simulation | 4-second interval, watt-hour math, auto-mode with appliance auto-cut |
| Top limitation | Monolithic 1192-line file, no database, no auth, no tests |
| Top improvement | Component decomposition, WebSocket sync, database, auth |
| Hardware path | ESP32 → MQTT → Express → WebSocket → React |

### Word Document Instructions

To convert this to a `.docx`:
1. Copy all content into Microsoft Word
2. Apply **Heading 1** to lines starting with `## `
3. Apply **Heading 2** to lines starting with `### `
4. Select tables and use **Insert → Table** formatting
5. Use **Consolas 10pt** font for all code blocks
6. Apply a dark blue accent color for consistency

---

*Report prepared for jury/viva evaluation. Covers architecture, code, security, scalability, and 20 categorized Q&A pairs with ideal answers.*
