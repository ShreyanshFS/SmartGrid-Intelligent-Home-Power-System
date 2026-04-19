# SmartGrid Intelligent Home Power Control System

SmartGrid is a React and TypeScript dashboard for simulating a home inverter or backup-power control system. It models battery percentage, appliance load, charging input, automatic power-saving modes, activity logs, energy history, cost estimation, and alert reporting from one local web interface.

The project is intended for demonstration, learning, and prototype validation. It does not directly control real appliances by itself, but it includes an ESP32/MQTT-ready placeholder for future hardware integration.

## Features

- Battery percentage simulation with start/stop control
- Appliance list with on/off controls and essential/non-essential priority
- Automatic mode switching for Normal, Power Saving, and Ultra modes
- Non-essential appliance cutoff during saving modes
- Solar and grid charging input simulation
- Battery and load trend graph in the Overview page
- Simulated energy use and estimated cost calculation
- CSV export for recorded energy samples
- Browser local storage for saving dashboard state
- SMTP email alert reports from a configured sender account
- Optional Gemini-powered AI assistant for energy questions
- Remote-control style tab for phone or IoT dashboard demonstrations

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Express
- Motion
- Google GenAI SDK

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
copy .env.example .env.local
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

## Environment Variables

The core dashboard works without any API keys.

To enable the optional AI assistant, set:

```env
VITE_GEMINI_API_KEY="your_gemini_api_key"
```

To enable SMTP email alerts, set a dedicated sender account:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-project-alert-email@gmail.com"
SMTP_PASS="your_app_password"
SMTP_FROM="your-project-alert-email@gmail.com"
```

For Gmail, use an app password. Do not use your normal account password.

## Available Scripts

```bash
npm run dev
```

Starts the Express server with Vite middleware.

```bash
npm run build
```

Builds the production frontend into `dist/`.

```bash
npm run start
```

Serves the production build through the Express server.

```bash
npm run lint
```

Runs TypeScript checks without emitting files.

## Project Structure

- `src/App.tsx` - main dashboard, simulation logic, tabs, controls, AI assistant UI
- `src/main.tsx` - React entry point
- `src/index.css` - Tailwind import, theme variables, global styles
- `server.ts` - Express server and SMTP email alert endpoint
- `vite.config.ts` - Vite and Tailwind configuration
- `.env.example` - example local configuration

## Notes

- The app stores dashboard state in browser local storage.
- The energy graph updates when the simulation is running.
- SMTP alerts are sent by the configured sender account on the server side.
- The hardware gateway section is a software placeholder for future ESP32, relay, inverter, or MQTT integration.
- WhatsApp alerts are not built in because non-personal WhatsApp sending requires a provider such as WhatsApp Cloud API or Twilio.

## License

Use or modify this project for learning, demonstrations, and prototype development.
