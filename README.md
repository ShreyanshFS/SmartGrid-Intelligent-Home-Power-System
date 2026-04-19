# SmartGrid Intelligent Home Power Control System

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
- [API Endpoint](#api-endpoint)
- [Security Notes](#security-notes)
- [Future Scope](#future-scope)

## Overview

Many homes use an inverter or battery backup system, but users often do not know how long the battery will last or which appliances should be turned off during low-power conditions. SmartGrid models that situation through a dashboard where appliances have watt ratings, essential status, and on/off states.

The system calculates the active load, estimates runtime, tracks battery changes during simulation, supports charging input from solar/grid sources, and automatically switches into saving modes based on battery thresholds.

## Key Features

### Power Monitoring

- Battery percentage display with arc gauge
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

### Smart Modes

- Normal mode for regular operation
- Power Saving mode for low battery conditions
- Ultra mode for critical battery conditions
- Adjustable battery thresholds for automatic mode switching

### Analytics and Reports

- Battery and load trend graph on the Overview page
- Activity log for mode changes, device changes, and alerts
- Simulated energy usage in kWh
- Estimated electricity cost based on configurable unit rate
- CSV export for recorded energy samples

### Alerts and Assistance

- Server-side SMTP email alert reports from a configured sender account
- Manual alert button in the Control page
- Optional Gemini-powered AI assistant for energy-related questions
- Remote-control style page for smartphone or IoT dashboard demonstration

## System Modules

| Module | Purpose |
|--------|---------|
| Overview | Main dashboard with battery status, appliance list, energy graph, and activity log |
| Control | Simulation controls, thresholds, charging input, CSV export, SMTP alert setup, and device registration |
| Remote Control | Simplified remote appliance control interface |
| AI Assistant | Optional Gemini assistant for basic energy guidance |
| Express Server | Hosts the Vite app and handles SMTP email alert requests |

## Technology Stack

| Layer | Technology |
|------|------------|
| Frontend | React 19, TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Animation | Motion |
| Icons | Lucide React |
| Backend | Express |
| Email Alerts | SMTP over Node.js |
| Optional AI | Google GenAI SDK |
| State Storage | Browser local storage |

## How the Simulation Works

1. The dashboard starts with a default set of appliances and battery percentage.
2. Active load is calculated from appliances that are turned on and not auto-cut.
3. Charging input is calculated from solar and grid charging sliders.
4. Net battery flow is calculated as active load minus charging input.
5. When the simulation is running, battery percentage updates every few seconds.
6. A history sample is recorded for battery percentage, load, charging input, and mode.
7. If battery level crosses a configured threshold, the app switches mode automatically.
8. In Power Saving or Ultra mode, non-essential appliances are marked as cut.

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

The core dashboard works without API keys. Environment variables are only needed for optional AI and email alert features.

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

This starts the Express server with Vite middleware, so the frontend and alert API run from the same local address.

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
|-- src/
|   |-- App.tsx              # Main dashboard, tabs, simulation, controls, AI UI
|   |-- main.tsx             # React entry point
|   |-- index.css            # Tailwind import, theme variables, global styles
|   |-- vite-env.d.ts        # Vite environment typing
|
|-- server.ts                # Express server and SMTP alert endpoint
|-- index.html               # Vite HTML template
|-- vite.config.ts           # Vite and Tailwind configuration
|-- package.json             # Scripts and dependencies
|-- .env.example             # Example environment variables
|-- README.md                # Project documentation
```

## API Endpoint

### Send Email Alert

```http
POST /api/send-alert
Content-Type: application/json
```

Example payload:

```json
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
- The current app does not include user authentication.
- Browser local storage is used for convenience, not secure long-term storage.
- The SMTP endpoint is intended for local/demo use. For public deployment, add authentication, rate limiting, request validation, and HTTPS.

## Current Limitations

- Battery behavior is simulated, not connected to real inverter data.
- Appliance switching is visual only until hardware integration is added.
- Local storage is per browser and per device.
- WhatsApp alerts are not included because non-personal WhatsApp sending requires WhatsApp Cloud API, Twilio, or another approved provider.
- The AI assistant is optional and depends on a valid Gemini API key.

## Future Scope

- ESP32 or relay-board integration
- MQTT topic publishing and subscription
- Real inverter battery telemetry
- Database persistence for history and alerts
- Authentication for admin and remote users
- Automatic scheduled reports
- WhatsApp Cloud API or Twilio alert support
- Progressive Web App support for mobile installation
- Docker deployment configuration

## License

This project is intended for learning, demonstrations, and prototype development. Add a formal license file before public or production distribution.
