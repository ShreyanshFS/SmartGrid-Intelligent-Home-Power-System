export default function(pres) {

const NAVY = "1E2761", ICE = "CADCFC", WHITE = "FFFFFF", DARK2 = "152057", ACCENT = "3B82F6", GRAY = "94A3B8";
const CHARCOAL = "0F172A", SUCCESS = "10B981", WARN = "F59E0B", DANGER = "EF4444";
const hdrFont = "Arial Black", bodyFont = "Calibri";

function lightBg(s) {
  s.background = { fill: WHITE };
  s.addShape(pres.ShapeType.rect, { x: 0, y: 7.0, w: 13.33, h: 0.5, fill: { color: NAVY } });
}
function darkBg(s) { s.background = { fill: NAVY }; }

// ═══════════════════════ SLIDE 7: TECHNOLOGY STACK ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("Technology Stack", { x: 0.8, y: 0.4, w: 8, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });
  s.addText("Languages, Frameworks, Libraries & Tools", { x: 0.8, y: 1.1, w: 10, h: 0.35, fontSize: 13, fontFace: bodyFont, color: GRAY, italic: true });

  const techs = [
    ["React 19", "Frontend UI Framework", ACCENT],
    ["TypeScript 5.8", "Type-Safe JavaScript", "3178C6"],
    ["Vite 6", "Lightning-Fast Build Tool", "646CFF"],
    ["Tailwind CSS 4", "Utility-First Styling", "06B6D4"],
    ["Motion (Framer)", "Animation Library", "FF0055"],
    ["Lucide React", "Icon Library", CHARCOAL],
    ["Express 4", "Node.js Server Framework", SUCCESS],
    ["SQLite (sql.js)", "WASM Database Engine", "003B57"],
    ["JWT", "Token Authentication", NAVY],
    ["bcryptjs", "Password Hashing", DANGER],
    ["Google GenAI", "AI Assistant SDK", "4285F4"],
    ["Node.js SMTP", "Email Alert Engine", WARN],
  ];

  techs.forEach(([name, desc, clr], i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const xx = 0.8 + col * 3.1;
    const yy = 1.8 + row * 1.7;
    s.addShape(pres.ShapeType.roundRect, { x: xx, y: yy, w: 2.8, h: 1.4, fill: { color: WHITE }, line: { color: clr, width: 2 }, rectRadius: 0.1, shadow: { type: "outer", blur: 4, offset: 2, color: "000000", opacity: 0.06 } });
    // Color badge at top
    s.addShape(pres.ShapeType.rect, { x: xx, y: yy, w: 2.8, h: 0.35, fill: { color: clr }, rectRadius: 0.1 });
    s.addText(name, { x: xx, y: yy, w: 2.8, h: 0.35, fontSize: 11, fontFace: bodyFont, color: WHITE, align: "center", valign: "middle", bold: true });
    s.addText(desc, { x: xx + 0.15, y: yy + 0.5, w: 2.5, h: 0.8, fontSize: 10, fontFace: bodyFont, color: GRAY, align: "center", valign: "middle" });
  });
}

// ═══════════════════════ SLIDE 8: CIRCUIT / CONSTRUCTION LOGIC ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("Construction Logic & Circuit Diagram", { x: 0.8, y: 0.4, w: 11, h: 0.8, fontSize: 32, fontFace: hdrFont, color: NAVY });
  s.addText("Block-Level System Integration", { x: 0.8, y: 1.05, w: 10, h: 0.35, fontSize: 13, fontFace: bodyFont, color: GRAY, italic: true });

  // Block diagram - Solar Panel
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 2.0, w: 2.0, h: 1.0, fill: { color: WARN, transparency: 80 }, line: { color: WARN, width: 2 }, rectRadius: 0.1 });
  s.addText("☀️ Solar Panel\n220W Input", { x: 0.5, y: 2.0, w: 2.0, h: 1.0, fontSize: 10, fontFace: bodyFont, color: NAVY, align: "center", valign: "middle", bold: true });

  // Grid Supply
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 3.5, w: 2.0, h: 1.0, fill: { color: DANGER, transparency: 80 }, line: { color: DANGER, width: 2 }, rectRadius: 0.1 });
  s.addText("⚡ Grid Supply\n0-800W", { x: 0.5, y: 3.5, w: 2.0, h: 1.0, fontSize: 10, fontFace: bodyFont, color: NAVY, align: "center", valign: "middle", bold: true });

  // Arrows to charge controller
  s.addShape(pres.ShapeType.line, { x: 2.5, y: 2.5, w: 1.2, h: 0, line: { color: WARN, width: 2 } });
  s.addShape(pres.ShapeType.line, { x: 2.5, y: 4.0, w: 1.2, h: 0, line: { color: DANGER, width: 2 } });

  // Charge Controller / SmartGrid Core
  s.addShape(pres.ShapeType.roundRect, { x: 3.7, y: 2.2, w: 3.0, h: 2.6, fill: { color: ACCENT, transparency: 80 }, line: { color: ACCENT, width: 2 }, rectRadius: 0.15 });
  s.addText("🧠 SmartGrid Core\n\nCharge Controller\nMode Switching\nLoad Calculation\nAuto-Cut Logic", { x: 3.7, y: 2.2, w: 3.0, h: 2.6, fontSize: 10, fontFace: bodyFont, color: NAVY, align: "center", valign: "middle", bold: true, lineSpacing: 14 });

  // Arrow to battery
  s.addShape(pres.ShapeType.line, { x: 6.7, y: 2.8, w: 1.0, h: 0, line: { color: SUCCESS, width: 2 } });

  // Battery
  s.addShape(pres.ShapeType.roundRect, { x: 7.7, y: 2.0, w: 2.0, h: 1.2, fill: { color: SUCCESS, transparency: 80 }, line: { color: SUCCESS, width: 2 }, rectRadius: 0.1 });
  s.addText("🔋 Battery Bank\n1000 Wh", { x: 7.7, y: 2.0, w: 2.0, h: 1.2, fontSize: 10, fontFace: bodyFont, color: NAVY, align: "center", valign: "middle", bold: true });

  // Arrow to appliances
  s.addShape(pres.ShapeType.line, { x: 6.7, y: 4.0, w: 1.0, h: 0, line: { color: NAVY, width: 2 } });

  // Appliances
  s.addShape(pres.ShapeType.roundRect, { x: 7.7, y: 3.5, w: 2.0, h: 1.2, fill: { color: "8B5CF6", transparency: 80 }, line: { color: "8B5CF6", width: 2 }, rectRadius: 0.1 });
  s.addText("🏠 Appliances\n14 Devices", { x: 7.7, y: 3.5, w: 2.0, h: 1.2, fontSize: 10, fontFace: bodyFont, color: NAVY, align: "center", valign: "middle", bold: true });

  // Dashboard / Browser
  s.addShape(pres.ShapeType.roundRect, { x: 10.2, y: 2.5, w: 2.5, h: 2.5, fill: { color: NAVY }, rectRadius: 0.12 });
  s.addText("🖥️ Dashboard\n\nReact UI\nReal-Time Gauge\nEnergy Trends\nAI Chat\nRemote Control", { x: 10.2, y: 2.5, w: 2.5, h: 2.5, fontSize: 9, fontFace: bodyFont, color: WHITE, align: "center", valign: "middle", lineSpacing: 13 });

  // Arrow from appliances to dashboard
  s.addShape(pres.ShapeType.line, { x: 9.7, y: 3.3, w: 0.5, h: 0, line: { color: GRAY, width: 1.5, dashType: "dash" } });

  // ESP32 future block
  s.addShape(pres.ShapeType.roundRect, { x: 4.0, y: 5.5, w: 5.5, h: 1.0, fill: { color: "F0F4FF" }, line: { color: GRAY, width: 1, dashType: "dash" }, rectRadius: 0.1 });
  s.addText("🔮 Future: ESP32 + Relay Boards + MQTT → Real hardware switching", { x: 4.0, y: 5.5, w: 5.5, h: 1.0, fontSize: 11, fontFace: bodyFont, color: GRAY, align: "center", valign: "middle", italic: true });
}

// ═══════════════════════ SLIDE 9: HARDWARE REQUIREMENTS ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("Hardware Requirements", { x: 0.8, y: 0.4, w: 10, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });
  s.addText("Component List with Specifications", { x: 0.8, y: 1.1, w: 10, h: 0.35, fontSize: 13, fontFace: bodyFont, color: GRAY, italic: true });

  const rows = [
    [{ text: "Component", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
     { text: "Specification", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
     { text: "Qty", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
     { text: "Est. Cost (₹)", options: { bold: true, color: WHITE, fill: { color: NAVY } } }],
    ["Development PC / Laptop", "8GB+ RAM, Modern Browser", "1", "—"],
    ["ESP32 Dev Board (Future)", "Dual-core, WiFi+BT, 520KB SRAM", "1", "₹500"],
    ["4-Channel Relay Module", "5V, 10A per channel", "4", "₹600"],
    ["Solar Charge Controller", "PWM/MPPT, 12V/24V", "1", "₹1,200"],
    ["Solar Panel", "220W Polycrystalline", "1", "₹8,000"],
    ["Lead-Acid / Li-Ion Battery", "12V 100Ah (1.2 kWh)", "1", "₹6,000"],
    ["Inverter", "1000W Pure Sine Wave", "1", "₹4,500"],
    ["Current Sensor (ACS712)", "30A, Analog Output", "2", "₹200"],
    ["Connecting Wires & PCB", "Jumper wires, breadboard", "1 set", "₹300"],
  ];

  s.addTable(rows, {
    x: 0.8, y: 1.7, w: 11.7,
    fontSize: 11, fontFace: bodyFont,
    border: { type: "solid", pt: 0.5, color: ICE },
    colW: [3.5, 3.5, 1.0, 2.0],
    rowH: [0.4, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35],
    autoPage: false,
  });

  s.addShape(pres.ShapeType.roundRect, { x: 0.8, y: 5.8, w: 5, h: 0.8, fill: { color: "EFF6FF" }, line: { color: ACCENT, width: 1 }, rectRadius: 0.08 });
  s.addText("💡 Total Estimated Hardware Cost: ₹21,300", { x: 1.0, y: 5.8, w: 4.8, h: 0.8, fontSize: 14, fontFace: bodyFont, color: NAVY, bold: true, valign: "middle" });
  s.addText("Note: Current prototype is software-only. Hardware costs apply for physical deployment phase.", { x: 6.2, y: 5.8, w: 6, h: 0.8, fontSize: 10, fontFace: bodyFont, color: GRAY, valign: "middle", italic: true });
}

// ═══════════════════════ SLIDE 10: SOFTWARE REQUIREMENTS ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("Software Requirements", { x: 0.8, y: 0.4, w: 8, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });

  // Left column: Runtime & OS
  s.addShape(pres.ShapeType.roundRect, { x: 0.8, y: 1.5, w: 5.8, h: 5.2, fill: { color: "F8FAFC" }, line: { color: ICE, width: 1 }, rectRadius: 0.1 });
  s.addText("Runtime & OS", { x: 1.0, y: 1.6, w: 5, h: 0.4, fontSize: 16, fontFace: hdrFont, color: NAVY });

  const leftItems = [
    ["Node.js", "18+ (LTS recommended)"],
    ["npm", "9+ (bundled with Node)"],
    ["OS", "Windows / macOS / Linux"],
    ["Browser", "Chrome, Edge, Firefox, Safari"],
    ["RAM", "4 GB minimum, 8 GB recommended"],
    ["Disk", "~200 MB (with node_modules)"],
  ];
  leftItems.forEach(([label, val], i) => {
    const yy = 2.2 + i * 0.65;
    s.addShape(pres.ShapeType.roundRect, { x: 1.0, y: yy, w: 5.4, h: 0.5, fill: { color: i % 2 === 0 ? "EFF6FF" : WHITE }, rectRadius: 0.05 });
    s.addText(label, { x: 1.2, y: yy, w: 2.0, h: 0.5, fontSize: 12, fontFace: bodyFont, color: NAVY, bold: true, valign: "middle" });
    s.addText(val, { x: 3.2, y: yy, w: 3.0, h: 0.5, fontSize: 11, fontFace: bodyFont, color: CHARCOAL, valign: "middle" });
  });

  // Right column: Dependencies
  s.addShape(pres.ShapeType.roundRect, { x: 7.0, y: 1.5, w: 5.5, h: 5.2, fill: { color: "F8FAFC" }, line: { color: ICE, width: 1 }, rectRadius: 0.1 });
  s.addText("Key Dependencies", { x: 7.2, y: 1.6, w: 5, h: 0.4, fontSize: 16, fontFace: hdrFont, color: NAVY });

  const rightItems = [
    ["react", "^19.0.0"],
    ["vite", "^6.2.0"],
    ["tailwindcss", "^4.1.14"],
    ["express", "^4.21.2"],
    ["sql.js", "^1.12.0"],
    ["jsonwebtoken", "^9.0.2"],
    ["bcryptjs", "^3.0.2"],
    ["@google/genai", "^1.29.0"],
    ["motion", "^12.23.24"],
    ["typescript", "~5.8.2"],
  ];
  rightItems.forEach(([pkg, ver], i) => {
    const yy = 2.1 + i * 0.42;
    s.addShape(pres.ShapeType.roundRect, { x: 7.2, y: yy, w: 5.1, h: 0.36, fill: { color: i % 2 === 0 ? "EFF6FF" : WHITE }, rectRadius: 0.04 });
    s.addText(pkg, { x: 7.4, y: yy, w: 2.5, h: 0.36, fontSize: 10, fontFace: "Consolas", color: ACCENT, valign: "middle" });
    s.addText(ver, { x: 10.0, y: yy, w: 2.0, h: 0.36, fontSize: 10, fontFace: "Consolas", color: CHARCOAL, valign: "middle" });
  });
}

// ═══════════════════════ SLIDE 11: IMPLEMENTATION DETAILS ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("Implementation Details", { x: 0.8, y: 0.4, w: 10, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });
  s.addText("Key Modules & Interaction Flow", { x: 0.8, y: 1.05, w: 10, h: 0.35, fontSize: 13, fontFace: bodyFont, color: GRAY, italic: true });

  // Numbered steps flowchart
  const steps = [
    ["1", "User Authentication", "User registers/logs in → JWT token issued → stored in localStorage"],
    ["2", "State Hydration", "Token validated via /api/auth/me → state loaded from /api/state/load → UI renders"],
    ["3", "Dashboard Render", "App.tsx renders 5 tabs: Overview, Control, Remote, AI Assistant, About"],
    ["4", "Simulation Engine", "setInterval ticks every 4s → battery depletes → history samples recorded"],
    ["5", "Auto Mode Switch", "Battery thresholds monitored → mode auto-switches → non-essential appliances cut"],
    ["6", "State Sync", "Every 3s, state JSON → POST /api/state/save → SQLite upsert → persisted to disk"],
    ["7", "Alert System", "SMTP client builds HTML → STARTTLS → AUTH PLAIN → sends formatted email report"],
  ];

  steps.forEach(([num, title, desc], i) => {
    const yy = 1.6 + i * 0.75;
    // Number circle
    s.addShape(pres.ShapeType.ellipse, { x: 0.8, y: yy + 0.05, w: 0.5, h: 0.5, fill: { color: ACCENT } });
    s.addText(num, { x: 0.8, y: yy + 0.05, w: 0.5, h: 0.5, fontSize: 14, fontFace: hdrFont, color: WHITE, align: "center", valign: "middle" });
    // Connector line
    if (i < steps.length - 1) {
      s.addShape(pres.ShapeType.line, { x: 1.05, y: yy + 0.55, w: 0, h: 0.2, line: { color: ICE, width: 2 } });
    }
    // Content
    s.addText(title, { x: 1.5, y: yy, w: 3.0, h: 0.35, fontSize: 13, fontFace: bodyFont, color: NAVY, bold: true });
    s.addText(desc, { x: 1.5, y: yy + 0.32, w: 10.5, h: 0.35, fontSize: 10, fontFace: bodyFont, color: GRAY });
  });
}

// ═══════════════════════ SLIDE 12: DATABASE / DATA FLOW ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("Database & Data Flow", { x: 0.8, y: 0.4, w: 8, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });
  s.addText("ER Diagram & State Synchronization", { x: 0.8, y: 1.1, w: 10, h: 0.35, fontSize: 13, fontFace: bodyFont, color: GRAY, italic: true });

  // Users table
  s.addShape(pres.ShapeType.roundRect, { x: 1.0, y: 1.8, w: 4.0, h: 3.2, fill: { color: "EFF6FF" }, line: { color: ACCENT, width: 2 }, rectRadius: 0.1 });
  s.addShape(pres.ShapeType.rect, { x: 1.0, y: 1.8, w: 4.0, h: 0.5, fill: { color: ACCENT } });
  s.addText("users", { x: 1.0, y: 1.8, w: 4.0, h: 0.5, fontSize: 14, fontFace: hdrFont, color: WHITE, align: "center", valign: "middle" });
  const userFields = ["🔑 id  INTEGER  PK AUTOINCREMENT", "👤 username  TEXT  NOT NULL UNIQUE", "📧 email  TEXT  NOT NULL UNIQUE", "🔒 password_hash  TEXT  NOT NULL", "📅 created_at  TEXT  DEFAULT now()"];
  userFields.forEach((f, i) => {
    s.addText(f, { x: 1.2, y: 2.4 + i * 0.45, w: 3.6, h: 0.4, fontSize: 10, fontFace: "Consolas", color: CHARCOAL });
  });

  // Relationship arrow
  s.addText("1 ←→ 1", { x: 5.2, y: 3.0, w: 1.5, h: 0.4, fontSize: 14, fontFace: hdrFont, color: ACCENT, align: "center" });
  s.addShape(pres.ShapeType.line, { x: 5.0, y: 3.2, w: 1.9, h: 0, line: { color: ACCENT, width: 2 } });

  // User States table
  s.addShape(pres.ShapeType.roundRect, { x: 7.0, y: 1.8, w: 5.0, h: 3.2, fill: { color: "FFF7ED" }, line: { color: WARN, width: 2 }, rectRadius: 0.1 });
  s.addShape(pres.ShapeType.rect, { x: 7.0, y: 1.8, w: 5.0, h: 0.5, fill: { color: WARN } });
  s.addText("user_states", { x: 7.0, y: 1.8, w: 5.0, h: 0.5, fontSize: 14, fontFace: hdrFont, color: WHITE, align: "center", valign: "middle" });
  const stateFields = ["🔑 id  INTEGER  PK AUTOINCREMENT", "🔗 user_id  INTEGER  FK → users.id", "📄 state_json  TEXT  (full dashboard state)", "📅 updated_at  TEXT  DEFAULT now()"];
  stateFields.forEach((f, i) => {
    s.addText(f, { x: 7.2, y: 2.4 + i * 0.45, w: 4.6, h: 0.4, fontSize: 10, fontFace: "Consolas", color: CHARCOAL });
  });

  // Data flow
  s.addShape(pres.ShapeType.roundRect, { x: 1.0, y: 5.4, w: 11.0, h: 1.3, fill: { color: NAVY }, rectRadius: 0.1 });
  s.addText("Data Flow: Browser → POST /api/state/save → Express → sql.js upsert → smartgrid.db file", { x: 1.3, y: 5.5, w: 10.5, h: 0.5, fontSize: 13, fontFace: bodyFont, color: WHITE, bold: true });
  s.addText("Auto-sync every 3 seconds  •  State loaded on login  •  WASM-powered SQLite (no native compilation)  •  DB persisted to disk on every write", { x: 1.3, y: 6.0, w: 10.5, h: 0.5, fontSize: 11, fontFace: bodyFont, color: ICE });
}

}
