<div align="center">
<img width="1200" height="475" alt="SmartGrid Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SmartGrid Intelligent Home Power Control System

A Vite + React app that simulates an intelligent home energy management dashboard. The app includes battery monitoring, appliance control, power-saving modes, and optional AI assistant support.

## Features

- Real-time battery and load simulation
- Appliance management with on/off controls
- Smart modes for power saving and ultra conservation
- Local state persistence in the browser
- Optional AI assistant chat interface (Gemini-powered)
- SMTP email alert reports from a configured project sender account

## Setup

**Prerequisites:** Node.js 18+ and npm

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a local environment file from the example:
   ```bash
   copy .env.example .env.local
   ```
3. Optionally set `VITE_GEMINI_API_KEY` in `.env.local` to enable AI assistant features.
4. Optionally set `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` in `.env.local` to enable server-side alert emails.

## Run the app

```bash
npm run dev
```

Open the local development URL shown by Vite.

## Project structure

- `src/App.tsx` – app logic, dashboard, simulation, and optional AI chat.
- `src/main.tsx` – app entry point.
- `index.html` – page template.
- `vite.config.ts` – Vite configuration.
- `.env.example` – example environment variables.

## Notes

- The AI assistant feature is optional. The core app works without setting `VITE_GEMINI_API_KEY`.
- The current app uses local browser storage for state persistence.

## License

Use or modify this project freely for learning and development.
