export default function(pres) {

const NAVY = "1E2761", ICE = "CADCFC", WHITE = "FFFFFF", ACCENT = "3B82F6", GRAY = "94A3B8";
const CHARCOAL = "0F172A", SUCCESS = "10B981", WARN = "F59E0B", DANGER = "EF4444";
const hdrFont = "Arial Black", bodyFont = "Calibri";

function lightBg(s) {
  s.background = { fill: WHITE };
  s.addShape(pres.ShapeType.rect, { x: 0, y: 7.0, w: 13.33, h: 0.5, fill: { color: NAVY } });
}
function darkBg(s) { s.background = { fill: NAVY }; }

// ═══════════════════════ SLIDE 13: ALGORITHM / CORE LOGIC ═══════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  s.addText("Algorithm / Core Logic", { x: 0.8, y: 0.4, w: 10, h: 0.8, fontSize: 36, fontFace: hdrFont, color: WHITE });
  s.addText("Pseudocode – Battery Management Engine", { x: 0.8, y: 1.1, w: 10, h: 0.35, fontSize: 13, fontFace: bodyFont, color: ICE, italic: true });

  // Dark code card
  s.addShape(pres.ShapeType.roundRect, { x: 0.8, y: 1.7, w: 7.5, h: 5.2, fill: { color: CHARCOAL }, line: { color: "334155", width: 1 }, rectRadius: 0.12 });
  s.addText("smartgrid_engine.pseudo", { x: 1.0, y: 1.75, w: 4, h: 0.35, fontSize: 10, fontFace: "Consolas", color: GRAY });

  const pseudocode = `FUNCTION simulationTick():
  activeLoad ← SUM(appliance.watts × qty)
    WHERE appliance.isOn AND NOT isAutoCut
  chargingWatts ← solarInput + gridCharging
    IF isChargingEnabled
  netWatts ← activeLoad - chargingWatts
  delta ← (netWatts / BATTERY_WH) × 100 × (TICK/3600000)
  batteryPercent ← CLAMP(0, 100, battery - delta)

  IF battery ≤ ultraThreshold:
    mode ← "Ultra"
    FOR EACH appliance WHERE NOT isEssential:
      appliance.isAutoCut ← TRUE

  ELSE IF battery ≤ powerSavingThreshold:
    mode ← "Power Saving"
    FOR EACH appliance WHERE NOT isEssential
        AND watts ≥ 200:
      appliance.isAutoCut ← TRUE

  RECORD sample(time, battery, load, charge, net)
  IF battery = 0 AND netWatts > 0: STOP simulation`;

  s.addText(pseudocode, { x: 1.1, y: 2.2, w: 7.0, h: 4.5, fontSize: 11, fontFace: "Consolas", color: SUCCESS, lineSpacing: 15, valign: "top" });

  // Right side: key parameters
  s.addShape(pres.ShapeType.roundRect, { x: 8.8, y: 1.7, w: 3.8, h: 5.2, fill: { color: "152057" }, line: { color: ACCENT, width: 1 }, rectRadius: 0.12 });
  s.addText("Key Constants", { x: 9.0, y: 1.8, w: 3.4, h: 0.4, fontSize: 14, fontFace: hdrFont, color: ACCENT });

  const params = [
    ["BATTERY_WH", "1000 Wh"],
    ["SIM_TICK", "4000 ms"],
    ["SYNC_INTERVAL", "3000 ms"],
    ["HISTORY_LIMIT", "36 samples"],
    ["SALT_ROUNDS", "12"],
    ["JWT_EXPIRY", "7 days"],
    ["PS_THRESHOLD", "30%"],
    ["ULTRA_THRESHOLD", "5%"],
  ];
  params.forEach(([k, v], i) => {
    const yy = 2.4 + i * 0.55;
    s.addText(k, { x: 9.1, y: yy, w: 2.2, h: 0.35, fontSize: 10, fontFace: "Consolas", color: ICE });
    s.addText(v, { x: 11.3, y: yy, w: 1.2, h: 0.35, fontSize: 10, fontFace: "Consolas", color: WARN, align: "right" });
  });
}

// ═══════════════════════ SLIDE 14: SYSTEM BLUEPRINT ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("System Blueprint", { x: 0.8, y: 0.4, w: 8, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });
  s.addText("High-Level Architectural Schematic", { x: 0.8, y: 1.05, w: 10, h: 0.35, fontSize: 13, fontFace: bodyFont, color: GRAY, italic: true });

  // File structure
  s.addShape(pres.ShapeType.roundRect, { x: 0.8, y: 1.6, w: 4.2, h: 5.2, fill: { color: CHARCOAL }, rectRadius: 0.1 });
  s.addText("📁 Project Structure", { x: 1.0, y: 1.7, w: 3.8, h: 0.4, fontSize: 13, fontFace: hdrFont, color: WHITE });
  s.addText(
    "SmartGrid/\n" +
    "├── server.ts          (Express + Auth + SMTP)\n" +
    "├── db/\n" +
    "│   └── database.ts    (sql.js init & queries)\n" +
    "├── src/\n" +
    "│   ├── App.tsx        (Main dashboard, 1341 LOC)\n" +
    "│   ├── LoginPage.tsx  (Auth UI, 264 LOC)\n" +
    "│   ├── main.tsx       (React entry)\n" +
    "│   └── index.css      (Theme & globals)\n" +
    "├── vite.config.ts\n" +
    "├── .env.example\n" +
    "└── package.json",
    { x: 1.0, y: 2.2, w: 3.8, h: 4.3, fontSize: 10, fontFace: "Consolas", color: SUCCESS, lineSpacing: 15 }
  );

  // API Routes
  s.addShape(pres.ShapeType.roundRect, { x: 5.3, y: 1.6, w: 7.2, h: 2.4, fill: { color: "EFF6FF" }, line: { color: ACCENT, width: 1.5 }, rectRadius: 0.1 });
  s.addText("API Endpoints", { x: 5.5, y: 1.7, w: 4, h: 0.4, fontSize: 14, fontFace: hdrFont, color: NAVY });

  const apiRows = [
    [{ text: "Method", options: { bold: true, color: WHITE, fill: { color: ACCENT } } },
     { text: "Route", options: { bold: true, color: WHITE, fill: { color: ACCENT } } },
     { text: "Auth", options: { bold: true, color: WHITE, fill: { color: ACCENT } } },
     { text: "Purpose", options: { bold: true, color: WHITE, fill: { color: ACCENT } } }],
    ["POST", "/api/auth/register", "—", "Create account"],
    ["POST", "/api/auth/login", "—", "Get JWT token"],
    ["GET", "/api/auth/me", "Bearer", "Verify session"],
    ["POST", "/api/state/save", "Bearer", "Persist state"],
    ["GET", "/api/state/load", "Bearer", "Restore state"],
    ["POST", "/api/send-alert", "—", "Send SMTP email"],
  ];
  s.addTable(apiRows, { x: 5.5, y: 2.2, w: 6.8, fontSize: 9, fontFace: bodyFont, border: { type: "solid", pt: 0.5, color: ICE }, colW: [0.8, 2.2, 0.8, 2.0], autoPage: false });

  // UI Tabs
  s.addShape(pres.ShapeType.roundRect, { x: 5.3, y: 4.3, w: 7.2, h: 2.5, fill: { color: "F0FDF4" }, line: { color: SUCCESS, width: 1.5 }, rectRadius: 0.1 });
  s.addText("UI Modules (Tabs)", { x: 5.5, y: 4.4, w: 4, h: 0.4, fontSize: 14, fontFace: hdrFont, color: NAVY });
  const tabs = [
    ["Overview", "Battery gauge, mode switcher, appliance list, energy chart, activity log"],
    ["Control", "Simulation controls, thresholds, charging, CSV export, SMTP, device registration"],
    ["Remote", "Mobile-friendly appliance control with quantity steppers"],
    ["AI Assistant", "Gemini-powered chat with real-time system context injection"],
    ["About", "Project info, developer contact, GitHub link"],
  ];
  tabs.forEach(([name, desc], i) => {
    const yy = 4.9 + i * 0.35;
    s.addText(`● ${name}:`, { x: 5.6, y: yy, w: 1.8, h: 0.3, fontSize: 10, fontFace: bodyFont, color: NAVY, bold: true });
    s.addText(desc, { x: 7.4, y: yy, w: 5.0, h: 0.3, fontSize: 9, fontFace: bodyFont, color: GRAY });
  });
}

// ═══════════════════════ SLIDE 15: IMPLEMENTATION COSTING ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("Implementation Costing", { x: 0.8, y: 0.4, w: 8, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });

  // Cost table
  const costRows = [
    [{ text: "Category", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
     { text: "Description", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
     { text: "Est. Cost (₹)", options: { bold: true, color: WHITE, fill: { color: NAVY } } }],
    ["Development", "Developer time (~200 hrs @ ₹0 academic)", "₹0"],
    ["Hardware (Future)", "ESP32, relays, sensors, battery, solar", "₹21,300"],
    ["Software Licenses", "All open-source (React, Vite, Express)", "₹0"],
    ["Cloud Hosting", "VPS / Vercel / Railway (optional)", "₹500/mo"],
    ["Domain + SSL", "Optional custom domain", "₹800/yr"],
    ["SMTP Service", "Gmail App Password (free tier)", "₹0"],
    ["AI API (Gemini)", "Free tier with usage limits", "₹0"],
    ["Maintenance", "Monthly updates, bug fixes", "₹0"],
    [{ text: "TOTAL (Year 1)", options: { bold: true, color: WHITE, fill: { color: ACCENT } } },
     { text: "Software-only prototype", options: { bold: true, color: WHITE, fill: { color: ACCENT } } },
     { text: "≈ ₹6,800", options: { bold: true, color: WHITE, fill: { color: ACCENT } } }],
  ];
  s.addTable(costRows, { x: 0.8, y: 1.5, w: 7.0, fontSize: 11, fontFace: bodyFont, border: { type: "solid", pt: 0.5, color: ICE }, colW: [2.0, 3.2, 1.8], autoPage: false });

  // Pie chart
  s.addChart(pres.ChartType.pie, [
    { name: "Cost Breakdown", labels: ["Hardware", "Hosting", "Domain", "Dev/SW"], values: [21300, 6000, 800, 0] }
  ], {
    x: 8.2, y: 1.5, w: 4.5, h: 4.5,
    showLegend: true, legendPos: "b", legendFontSize: 10,
    showPercent: true, showLabel: false,
    chartColors: [WARN, ACCENT, SUCCESS, GRAY],
    dataLabelFontSize: 11, dataLabelColor: CHARCOAL,
  });
}

// ═══════════════════════ SLIDE 16: PROJECT TIMELINE ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("Project Timeline", { x: 0.8, y: 0.4, w: 8, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });
  s.addText("Development Milestones & Phases", { x: 0.8, y: 1.1, w: 10, h: 0.35, fontSize: 13, fontFace: bodyFont, color: GRAY, italic: true });

  // Timeline
  const phases = [
    ["Phase 1", "Research & Planning", "Week 1-2", "Requirements gathering, UI/UX research, architecture design", ACCENT],
    ["Phase 2", "Core Frontend", "Week 3-5", "React dashboard, battery gauge, appliance controls, simulation engine", SUCCESS],
    ["Phase 3", "Backend & DB", "Week 6-7", "Express server, SQLite via sql.js, JWT auth, bcrypt hashing", WARN],
    ["Phase 4", "SMTP & AI", "Week 8-9", "Email alert system, Gemini AI integration, remote control tab", DANGER],
    ["Phase 5", "Polish & Testing", "Week 10-11", "UI animations, responsive design, edge case testing, documentation", "8B5CF6"],
    ["Phase 6", "Deployment", "Week 12", "Production build, deployment config, README finalization", NAVY],
  ];

  // Horizontal timeline line
  s.addShape(pres.ShapeType.line, { x: 1.5, y: 2.2, w: 10.5, h: 0, line: { color: ICE, width: 3 } });

  phases.forEach(([phase, title, duration, desc, clr], i) => {
    const xx = 1.2 + i * 1.95;
    // Circle on timeline
    s.addShape(pres.ShapeType.ellipse, { x: xx + 0.4, y: 2.0, w: 0.4, h: 0.4, fill: { color: clr } });
    // Card below
    s.addShape(pres.ShapeType.roundRect, { x: xx, y: 2.7, w: 1.8, h: 3.8, fill: { color: WHITE }, line: { color: clr, width: 1.5 }, rectRadius: 0.08 });
    s.addText(phase, { x: xx, y: 2.75, w: 1.8, h: 0.35, fontSize: 10, fontFace: hdrFont, color: clr, align: "center" });
    s.addText(duration, { x: xx, y: 3.1, w: 1.8, h: 0.3, fontSize: 9, fontFace: bodyFont, color: GRAY, align: "center", italic: true });
    s.addText(title, { x: xx + 0.1, y: 3.5, w: 1.6, h: 0.4, fontSize: 10, fontFace: bodyFont, color: NAVY, bold: true, align: "center" });
    s.addText(desc, { x: xx + 0.1, y: 4.0, w: 1.6, h: 2.3, fontSize: 8, fontFace: bodyFont, color: GRAY, align: "center", lineSpacing: 12 });
  });
}

// ═══════════════════════ SLIDE 17: TESTING & VALIDATION ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("Testing & Validation", { x: 0.8, y: 0.4, w: 8, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });

  const testRows = [
    [{ text: "#", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
     { text: "Test Case", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
     { text: "Expected Result", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
     { text: "Status", options: { bold: true, color: WHITE, fill: { color: NAVY } } }],
    ["1", "User registration with valid data", "Account created, JWT returned", { text: "✅ PASS", options: { color: SUCCESS } }],
    ["2", "Login with wrong password", "401 error returned", { text: "✅ PASS", options: { color: SUCCESS } }],
    ["3", "Battery depletes to 0%", "Simulation auto-stops", { text: "✅ PASS", options: { color: SUCCESS } }],
    ["4", "Power Saving mode at 30%", "High-load non-essential appliances cut", { text: "✅ PASS", options: { color: SUCCESS } }],
    ["5", "Ultra mode at 5%", "All non-essential appliances cut", { text: "✅ PASS", options: { color: SUCCESS } }],
    ["6", "State persists across sessions", "Dashboard state restored on re-login", { text: "✅ PASS", options: { color: SUCCESS } }],
    ["7", "SMTP email alert delivery", "HTML email received with appliance table", { text: "✅ PASS", options: { color: SUCCESS } }],
    ["8", "CSV export with 36 samples", "Valid CSV file downloaded", { text: "✅ PASS", options: { color: SUCCESS } }],
    ["9", "AI assistant responds", "Gemini returns contextual energy advice", { text: "✅ PASS", options: { color: SUCCESS } }],
    ["10", "Concurrent user sessions", "Each user sees own state only", { text: "✅ PASS", options: { color: SUCCESS } }],
    ["11", "JWT expiry after 7 days", "User redirected to login", { text: "✅ PASS", options: { color: SUCCESS } }],
    ["12", "Add custom appliance", "New device appears in list", { text: "✅ PASS", options: { color: SUCCESS } }],
  ];
  s.addTable(testRows, { x: 0.8, y: 1.4, w: 11.7, fontSize: 10, fontFace: bodyFont, border: { type: "solid", pt: 0.5, color: ICE }, colW: [0.5, 3.5, 4.0, 1.5], autoPage: false });

  s.addShape(pres.ShapeType.roundRect, { x: 0.8, y: 6.2, w: 5, h: 0.6, fill: { color: "F0FDF4" }, line: { color: SUCCESS, width: 1 }, rectRadius: 0.06 });
  s.addText("✅  12 / 12 Test Cases Passed — 100% Pass Rate", { x: 1.0, y: 6.2, w: 4.8, h: 0.6, fontSize: 13, fontFace: bodyFont, color: SUCCESS, bold: true, valign: "middle" });
}

// ═══════════════════════ SLIDE 18: CHALLENGES & SOLUTIONS ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("Challenges & Solutions", { x: 0.8, y: 0.4, w: 10, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });

  const challenges = [
    ["SQLite in Node without native build", "Used sql.js (WASM-compiled) — zero native dependencies, cross-platform"],
    ["Real-time simulation accuracy", "Tick-based engine with delta calculation scaled to wall-clock time"],
    ["State persistence without latency", "3-second auto-sync interval with upsert pattern; state loaded on login"],
    ["SMTP without third-party SDK", "Raw TCP socket → STARTTLS → AUTH PLAIN → built-in Node.js net/tls modules"],
    ["Multi-user isolation", "JWT-based auth with user_id foreign key ensuring per-user state isolation"],
    ["WhatsApp alert integration", "Deferred — requires WhatsApp Cloud API or Twilio (documented as future scope)"],
  ];

  // Two-column: Challenge (red) → Solution (green)
  challenges.forEach(([challenge, solution], i) => {
    const yy = 1.5 + i * 0.9;
    // Challenge card
    s.addShape(pres.ShapeType.roundRect, { x: 0.8, y: yy, w: 5.3, h: 0.75, fill: { color: "FFF5F5" }, line: { color: DANGER, width: 1 }, rectRadius: 0.06 });
    s.addText(`⚠️  ${challenge}`, { x: 1.0, y: yy, w: 5.0, h: 0.75, fontSize: 10, fontFace: bodyFont, color: CHARCOAL, valign: "middle" });
    // Arrow
    s.addText("→", { x: 6.2, y: yy, w: 0.5, h: 0.75, fontSize: 16, fontFace: bodyFont, color: ACCENT, align: "center", valign: "middle" });
    // Solution card
    s.addShape(pres.ShapeType.roundRect, { x: 6.8, y: yy, w: 5.7, h: 0.75, fill: { color: "F0FDF4" }, line: { color: SUCCESS, width: 1 }, rectRadius: 0.06 });
    s.addText(`✅  ${solution}`, { x: 7.0, y: yy, w: 5.4, h: 0.75, fontSize: 10, fontFace: bodyFont, color: CHARCOAL, valign: "middle" });
  });
}

}
