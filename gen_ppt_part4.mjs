export default function(pres) {

const NAVY = "1E2761", ICE = "CADCFC", WHITE = "FFFFFF", DARK2 = "152057", ACCENT = "3B82F6", GRAY = "94A3B8";
const CHARCOAL = "0F172A", SUCCESS = "10B981", WARN = "F59E0B", DANGER = "EF4444";
const hdrFont = "Arial Black", bodyFont = "Calibri";

function lightBg(s) {
  s.background = { fill: WHITE };
  s.addShape(pres.ShapeType.rect, { x: 0, y: 7.0, w: 13.33, h: 0.5, fill: { color: NAVY } });
}
function darkBg(s) { s.background = { fill: NAVY }; }

// ═══════════════════════ SLIDE 19: RESULTS & DEMO ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("Results & Demo", { x: 0.8, y: 0.4, w: 8, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });
  s.addText("Key Outputs & System Metrics", { x: 0.8, y: 1.1, w: 10, h: 0.35, fontSize: 13, fontFace: bodyFont, color: GRAY, italic: true });

  // Stat callout cards
  const metrics = [
    ["1,341", "Lines of Code\n(App.tsx)", ACCENT],
    ["14+", "Default\nAppliances", SUCCESS],
    ["6", "REST API\nEndpoints", WARN],
    ["5", "Dashboard\nTabs", "8B5CF6"],
    ["36", "History\nSamples Max", DANGER],
    ["3s", "Auto-Sync\nInterval", NAVY],
  ];
  metrics.forEach(([val, label, clr], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const xx = 0.8 + col * 4.0;
    const yy = 1.8 + row * 1.6;
    s.addShape(pres.ShapeType.roundRect, { x: xx, y: yy, w: 3.6, h: 1.3, fill: { color: WHITE }, line: { color: clr, width: 2 }, rectRadius: 0.1, shadow: { type: "outer", blur: 4, offset: 2, color: "000000", opacity: 0.06 } });
    s.addText(val, { x: xx, y: yy + 0.1, w: 1.5, h: 1.0, fontSize: 32, fontFace: hdrFont, color: clr, align: "center", valign: "middle" });
    s.addText(label, { x: xx + 1.5, y: yy + 0.1, w: 2.0, h: 1.0, fontSize: 11, fontFace: bodyFont, color: CHARCOAL, valign: "middle" });
  });

  // Demo outputs section
  s.addShape(pres.ShapeType.roundRect, { x: 0.8, y: 5.2, w: 11.7, h: 1.5, fill: { color: "F8FAFC" }, line: { color: ICE, width: 1 }, rectRadius: 0.1 });
  s.addText("Demo Outputs Validated", { x: 1.0, y: 5.3, w: 5, h: 0.4, fontSize: 14, fontFace: hdrFont, color: NAVY });
  const demoItems = [
    "✅ Live battery depletion simulation with auto mode switching",
    "✅ CSV energy report export with 36-sample history data",
    "✅ SMTP HTML email alert with formatted appliance table",
    "✅ Gemini AI responds with contextual energy advice",
    "✅ Multi-user isolation — each user has independent state",
  ];
  demoItems.forEach((item, i) => {
    s.addText(item, { x: 1.0 + (i < 3 ? 0 : 6), y: 5.8 + (i % 3) * 0.3, w: 5.8, h: 0.28, fontSize: 10, fontFace: bodyFont, color: CHARCOAL });
  });
}

// ═══════════════════════ SLIDE 20: FUTURE SCOPE ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("Future Scope", { x: 0.8, y: 0.4, w: 8, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });
  s.addText("What Can Be Improved & Extended", { x: 0.8, y: 1.1, w: 10, h: 0.35, fontSize: 13, fontFace: bodyFont, color: GRAY, italic: true });

  const futures = [
    ["🔌", "ESP32 / Relay Integration", "Connect to real relay boards for physical appliance switching via GPIO pins", ACCENT],
    ["📡", "MQTT Protocol", "Publish/subscribe architecture for real-time IoT device communication", SUCCESS],
    ["🔋", "Real Inverter Telemetry", "Read actual battery voltage, current, and temperature from inverter hardware", WARN],
    ["🌐", "WebSocket Sync", "Real-time multi-device dashboard synchronization without polling", "8B5CF6"],
    ["📱", "PWA Support", "Progressive Web App for mobile installation and offline capability", DANGER],
    ["💬", "WhatsApp Alerts", "WhatsApp Cloud API or Twilio integration for instant messaging alerts", NAVY],
    ["📊", "Scheduled Reports", "Automatic daily/weekly energy consumption summaries via email", SUCCESS],
    ["🐳", "Docker Deployment", "Containerized deployment for easy scaling and cloud hosting", ACCENT],
  ];

  futures.forEach(([icon, title, desc, clr], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const xx = 0.8 + col * 6.2;
    const yy = 1.7 + row * 1.3;
    s.addShape(pres.ShapeType.roundRect, { x: xx, y: yy, w: 5.9, h: 1.1, fill: { color: WHITE }, line: { color: clr, width: 1.5 }, rectRadius: 0.08, shadow: { type: "outer", blur: 3, offset: 1, color: "000000", opacity: 0.05 } });
    s.addText(icon, { x: xx + 0.15, y: yy + 0.15, w: 0.6, h: 0.6, fontSize: 22, align: "center" });
    s.addText(title, { x: xx + 0.8, y: yy + 0.1, w: 4.8, h: 0.35, fontSize: 13, fontFace: bodyFont, color: NAVY, bold: true });
    s.addText(desc, { x: xx + 0.8, y: yy + 0.5, w: 4.8, h: 0.5, fontSize: 10, fontFace: bodyFont, color: GRAY });
  });
}

// ═══════════════════════ SLIDE 21: CONCLUSION ═══════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  // Decorative
  s.addShape(pres.ShapeType.ellipse, { x: -2, y: -2, w: 6, h: 6, fill: { color: DARK2, transparency: 50 } });
  s.addShape(pres.ShapeType.ellipse, { x: 10, y: 5, w: 5, h: 5, fill: { color: DARK2, transparency: 50 } });

  s.addText("Conclusion", { x: 0.8, y: 0.5, w: 8, h: 0.8, fontSize: 40, fontFace: hdrFont, color: WHITE });
  s.addShape(pres.ShapeType.rect, { x: 0.8, y: 1.3, w: 3, h: 0.04, fill: { color: ACCENT } });

  s.addText(
    "SmartGrid successfully demonstrates an intelligent home power management system that bridges the gap between complex energy hardware and intuitive, user-centric software control.",
    { x: 0.8, y: 1.8, w: 11.5, h: 0.8, fontSize: 14, fontFace: bodyFont, color: ICE, lineSpacing: 20 }
  );

  const achievements = [
    ["🔋", "Real-time battery simulation with automatic mode switching at configurable thresholds"],
    ["🏠", "Full appliance management with 14+ devices, quantity steppers, and essential classification"],
    ["🔐", "Secure multi-user system with JWT authentication and per-user SQLite state persistence"],
    ["📧", "Server-side SMTP email alerts with HTML-formatted appliance status reports"],
    ["🤖", "AI-powered energy assistant using Google Gemini with live system context injection"],
    ["📊", "Comprehensive analytics with energy trends, CSV export, and cost estimation"],
  ];
  achievements.forEach(([icon, text], i) => {
    s.addText(`${icon}  ${text}`, { x: 1.0, y: 2.9 + i * 0.6, w: 11.0, h: 0.5, fontSize: 12, fontFace: bodyFont, color: WHITE, lineSpacing: 16 });
  });

  s.addShape(pres.ShapeType.roundRect, { x: 2.5, y: 6.2, w: 8.3, h: 0.7, fill: { color: ACCENT, transparency: 80 }, line: { color: ACCENT, width: 1 }, rectRadius: 0.1 });
  s.addText("\"Making decentralized energy management accessible to everyone.\"", { x: 2.5, y: 6.2, w: 8.3, h: 0.7, fontSize: 13, fontFace: bodyFont, color: WHITE, italic: true, align: "center", valign: "middle" });
}

// ═══════════════════════ SLIDE 22: REFERENCES ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("References / Bibliography", { x: 0.8, y: 0.4, w: 10, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });

  const refs = [
    "[1]  React Documentation — react.dev (React 19 with Hooks)",
    "[2]  Vite Build Tool — vitejs.dev (v6, ESM-first bundler)",
    "[3]  Tailwind CSS — tailwindcss.com (v4, utility-first CSS framework)",
    "[4]  Express.js — expressjs.com (v4, Node.js web framework)",
    "[5]  sql.js — github.com/sql-js/sql.js (SQLite compiled to WASM)",
    "[6]  JSON Web Tokens — jwt.io (RFC 7519 standard)",
    "[7]  bcryptjs — github.com/dcodeIO/bcrypt.js (password hashing)",
    "[8]  Google Generative AI SDK — ai.google.dev (Gemini API)",
    "[9]  Framer Motion — motion.dev (React animation library)",
    "[10] Lucide Icons — lucide.dev (open-source icon library)",
    "[11] Node.js SMTP — RFC 5321 (Simple Mail Transfer Protocol)",
    "[12] STARTTLS — RFC 3207 (SMTP Service Extension for Secure SMTP)",
    "[13] TypeScript — typescriptlang.org (v5.8, typed JavaScript)",
    "[14] MDN Web Docs — developer.mozilla.org (Web APIs reference)",
  ];

  refs.forEach((ref, i) => {
    const yy = 1.5 + i * 0.37;
    s.addShape(pres.ShapeType.roundRect, { x: 0.8, y: yy, w: 11.7, h: 0.32, fill: { color: i % 2 === 0 ? "F0F4FF" : WHITE }, rectRadius: 0.04 });
    s.addText(ref, { x: 1.0, y: yy, w: 11.3, h: 0.32, fontSize: 10, fontFace: bodyFont, color: CHARCOAL, valign: "middle" });
  });
}

// ═══════════════════════ SLIDE 23: THANK YOU ═══════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  // Decorative shapes
  s.addShape(pres.ShapeType.ellipse, { x: -1.5, y: -1.5, w: 5, h: 5, fill: { color: DARK2, transparency: 50 } });
  s.addShape(pres.ShapeType.ellipse, { x: 10, y: 4, w: 6, h: 6, fill: { color: DARK2, transparency: 50 } });
  s.addShape(pres.ShapeType.ellipse, { x: 5, y: -2, w: 3, h: 3, fill: { color: ACCENT, transparency: 90 } });

  // Lightning icon
  s.addShape(pres.ShapeType.rect, { x: 5.9, y: 1.2, w: 1.5, h: 1.5, fill: { color: ACCENT }, rectRadius: 0.3, shadow: { type: "outer", blur: 20, color: ACCENT, opacity: 0.5 } });
  s.addText("⚡", { x: 5.9, y: 1.2, w: 1.5, h: 1.5, fontSize: 42, align: "center", valign: "middle", color: WHITE });

  s.addText("Thank You", { x: 1, y: 3.0, w: 11.33, h: 1.0, fontSize: 48, fontFace: hdrFont, color: WHITE, align: "center", bold: true });
  s.addText("Questions & Discussion", { x: 1, y: 3.9, w: 11.33, h: 0.5, fontSize: 18, fontFace: bodyFont, color: ICE, align: "center" });

  // Divider
  s.addShape(pres.ShapeType.rect, { x: 5, y: 4.6, w: 3.33, h: 0.04, fill: { color: ACCENT } });

  // Contact info
  s.addText("Shreyansh Dwivedi", { x: 1, y: 5.0, w: 11.33, h: 0.5, fontSize: 18, fontFace: bodyFont, color: WHITE, align: "center", bold: true });
  s.addText("📧  Shreyanshdwivedi15@gmail.com", { x: 1, y: 5.5, w: 11.33, h: 0.4, fontSize: 13, fontFace: bodyFont, color: ICE, align: "center" });
  s.addText("🔗  github.com/ShreyanshFS/SmartGrid-Intelligent-Home-Power-System", { x: 1, y: 5.9, w: 11.33, h: 0.4, fontSize: 12, fontFace: bodyFont, color: GRAY, align: "center" });

  // Bottom
  s.addText("SMARTGRID  •  Intelligent Home Power Control System  •  April 2026", { x: 1, y: 6.7, w: 11.33, h: 0.3, fontSize: 10, fontFace: bodyFont, color: GRAY, align: "center" });
}

}
