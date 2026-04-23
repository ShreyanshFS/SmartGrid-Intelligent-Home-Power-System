# SmartGrid Intelligent Home Power Control System

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white&style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white&style=for-the-badge)
![SQLite](https://img.shields.io/badge/SQLite-sql.js-003B57?logo=sqlite&logoColor=white&style=for-the-badge)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens&logoColor=white&style=for-the-badge)
![SMTP Alerts](https://img.shields.io/badge/SMTP-Email_Alerts-EA4335?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Prototype-10B981?style=for-the-badge)

</div>

SmartGrid is a web-based simulation dashboard for a home inverter and appliance power-management system. It helps demonstrate how a backup power controller can monitor battery level, estimate load, apply power-saving rules, record energy trends, and send alert reports when needed.

The project is built as a prototype for learning, demonstration, and future hardware integration. It currently simulates the control logic in the browser and provides a server-side email alert endpoint. It does not directly switch real appliances unless connected later to hardware such as ESP32, relay modules, MQTT, or inverter telemetry.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Modules](#system-modules)
- [Technology Stack](#technology-stack)
- [How the Simulation Works](#how-the-simulation-works)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Security Notes](#security-notes)
- [Future Scope](#future-scope)

## Overview

Many homes use an inverter or battery backup system, but users often do not know how long the battery will last or which appliances should be turned off during low-power conditions. SmartGrid models that situation through a dashboard where appliances have watt ratings, essential status, and on/off states.

The system calculates the active load, estimates runtime, tracks battery changes during simulation, supports charging input from solar/grid sources, and automatically switches into saving modes based on battery thresholds.

## Key Features

### User Authentication

- User registration and login system with JWT-based sessions
- Passwords hashed with bcryptjs (12 salt rounds)
- Persistent sessions with 7-day token expiry
- Glassmorphism-styled login/register page with animated tab switching
- User profile display and logout in the navigation bar

### Database Persistence

- SQLite database via sql.js (pure WASM, no native compilation needed)
- Per-user state storage — each user's dashboard state is saved to the database
- Automatic state sync every 3 seconds via API calls
- State loads from database on login, falls back to defaults for new users

### Power Monitoring

- Battery percentage display with arc gauge
- Configurable battery capacity for 5 kWh, 10 kWh, 15 kWh, and custom values
- Active load calculation from currently running appliances
- Estimated runtime based on battery capacity and net load
- Charging input simulation from solar and grid sources
- Net battery flow calculation after subtracting charging input

### Appliance Control

- Predefined home appliance list with watt values
- Manual on/off toggles for each appliance
- Essential and non-essential appliance classification
- Auto-cut behavior for non-essential appliances in saving modes
- Device registration form for adding new appliances
- Quantity-based appliance registration for adding multiple similar devices at once

### Smart Modes

- Normal mode for regular operation
- Power Saving mode for low battery conditions
- Ultra mode for critical battery conditions
- Adjustable battery thresholds for automatic mode switching
- Different cutoff behavior for Power Saving and Ultra modes

### Analytics and Reports

- Battery and load trend graph on the Overview page
- Activity log for mode changes, device changes, and alerts
- Simulated energy usage in kWh
- Estimated electricity cost based on configurable unit rate
- CSV export for recorded energy samples

### Alerts and Assistance

- Server-side SMTP email alert reports from a configured sender account
- Smart recipient selection: use login email or enter a custom address
- Manual alert button in the Control page
- Optional Gemini-powered AI assistant for energy-related questions
- Remote-control style page for smartphone or IoT dashboard demonstration

## System Modules

| Module | Purpose |
|--------|---------|
| Login/Register | User authentication with JWT tokens and bcrypt password hashing |
| Overview | Main dashboard with battery status, appliance list, energy graph, and activity log |
| Control | Simulation controls, thresholds, charging input, CSV export, SMTP alert setup, and device registration |
| Remote Control | Simplified remote appliance control interface |
| AI Assistant | Optional Gemini assistant for basic energy guidance |
| Express Server | Hosts the Vite app, handles auth, state persistence, and SMTP email alerts |
| SQLite Database | Stores user accounts and per-user dashboard state |

## Technology Stack

| Layer | Technology |
|------|------------|
| Frontend | React 19, TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Animation | Motion (Framer Motion) |
| Icons | Lucide React |
| Backend | Express |
| Database | SQLite via sql.js (pure WASM) |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| Email Alerts | SMTP over Node.js |
| Optional AI | Google GenAI SDK |
| State Storage | SQLite database (per-user, API-synced) |

## How the Simulation Works

1. The user registers or logs in. Their dashboard state is loaded from the database.
2. The dashboard starts with a default set of appliances, battery percentage, and battery capacity.
3. Active load is calculated from appliances that are turned on and not auto-cut.
4. Charging input is calculated from solar and grid charging sliders.
5. Net battery flow is calculated as active load minus charging input.
6. When the simulation is running, battery percentage updates every few seconds.
7. A history sample is recorded for battery percentage, load, charging input, and mode.
8. If battery level crosses a configured threshold, the app switches mode automatically.
9. In Power Saving mode, only high-load non-essential appliances are cut.
10. In Ultra mode, all non-essential appliances are cut.
11. State is automatically saved to the database every 3 seconds.

## Installation

### Prerequisites

- Node.js 18 or later
- npm
- A modern browser such as Chrome, Edge, Firefox, or Safari

### Install Dependencies

```bash
npm install
```

### Create Environment File

```bash
copy .env.example .env.local
```

On Linux or macOS:

```bash
cp .env.example .env.local
```

## Configuration

The core dashboard works without API keys. Environment variables are only needed for optional AI, email alerts, and JWT configuration.

### JWT Authentication

```env
JWT_SECRET="your_jwt_secret_here"
DB_PATH="./db/smartgrid.db"
```

A default JWT secret is used in development. For production, set a strong random secret.

### Gemini AI Assistant

```env
VITE_GEMINI_API_KEY="your_gemini_api_key"
```

If this is not set, the AI Assistant tab will show a configuration message instead of calling Gemini.

### SMTP Email Alerts

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-project-alert-email@gmail.com"
SMTP_PASS="your_app_password"
SMTP_FROM="your-project-alert-email@gmail.com"
```

For Gmail, use an app password. Do not use your normal Gmail password. A separate project sender account is recommended.

## Running the Project

### Development

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

This starts the Express server with Vite middleware, so the frontend and all APIs run from the same local address. You will see the login page on first visit — register an account to access the dashboard.

### Production Build

```bash
npm run build
```

### Production Server

```bash
npm run start
```

### Type Check

```bash
npm run lint
```

## Project Structure

```text
SmartGrid-Intelligent-Home-Power-System/
|
|-- db/
|   |-- database.ts          # SQLite init, user & state queries (sql.js)
|
|-- src/
|   |-- App.tsx              # Main dashboard, tabs, simulation, auth gate
|   |-- LoginPage.tsx        # Login/Register page with glassmorphism UI
|   |-- main.tsx             # React entry point
|   |-- index.css            # Tailwind import, theme variables, global styles
|   |-- vite-env.d.ts        # Vite environment typing
|
|-- server.ts                # Express server, auth routes, state API, SMTP
|-- index.html               # Vite HTML template
|-- vite.config.ts           # Vite and Tailwind configuration
|-- package.json             # Scripts and dependencies
|-- .env.example             # Example environment variables
|-- README.md                # Project documentation
```

## API Endpoints

### Authentication

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/auth/register` | Create a new user account | None |
| POST | `/api/auth/login` | Login with email and password | None |
| GET | `/api/auth/me` | Get current user info from token | Bearer token |

### State Persistence

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/state/save` | Save user's dashboard state to DB | Bearer token |
| GET | `/api/state/load` | Load user's saved dashboard state | Bearer token |

### Email Alerts

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/send-alert` | Send SMTP email alert report | None |

#### Register Example

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Send Alert Example

```http
POST /api/send-alert
Content-Type: application/json

{
  "recipient": "recipient@example.com",
  "reason": "Manual SmartGrid alert",
  "batteryPercent": 25,
  "mode": "Power Saving",
  "activeLoad": 600,
  "chargingWatts": 220,
  "netWatts": 380,
  "estimatedRuntime": "1h 30m",
  "timestamp": "4/19/2026, 10:30:00 AM",
  "appliances": []
}
```

The server validates the recipient email, builds an HTML report, and sends it using the SMTP credentials from `.env.local`.

## Security Notes

- Secrets should be stored in `.env.local`, not committed to Git.
- Use an app password or dedicated SMTP credential for email alerts.
- User passwords are hashed with bcryptjs (12 salt rounds) before storage.
- JWT tokens expire after 7 days. Expired tokens are rejected and the user is logged out.
- The SQLite database file (`smartgrid.db`) is excluded from Git via `.gitignore`.
- Browser local storage is used only for JWT tokens and user info, not for dashboard state.
- The SMTP endpoint is intended for local/demo use. For public deployment, add rate limiting, request validation, and HTTPS.

## Current Limitations

- Battery behavior is simulated, not connected to real inverter data.
- Appliance switching is visual only until hardware integration is added.
- WhatsApp alerts are not included because non-personal WhatsApp sending requires WhatsApp Cloud API, Twilio, or another approved provider.
- The AI assistant is optional and depends on a valid Gemini API key.

## Future Scope

- ESP32 or relay-board integration
- MQTT topic publishing and subscription
- Real inverter battery telemetry
- WebSocket real-time sync across devices
- Automatic scheduled reports
- WhatsApp Cloud API or Twilio alert support
- Progressive Web App support for mobile installation
- Docker deployment configuration

## License

This project is intended for learning, demonstrations, and prototype development. Add a formal license file before public or production distribution.
