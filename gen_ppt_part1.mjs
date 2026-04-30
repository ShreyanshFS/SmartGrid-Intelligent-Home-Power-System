export default function(pres) {

const NAVY = "1E2761", ICE = "CADCFC", WHITE = "FFFFFF", DARK2 = "152057", ACCENT = "3B82F6", GRAY = "94A3B8";
const CHARCOAL = "0F172A", SUCCESS = "10B981", WARN = "F59E0B", DANGER = "EF4444";
const hdrFont = "Arial Black", bodyFont = "Calibri";

// Helper: dark bg
function darkBg(slide) {
  slide.background = { fill: NAVY };
}
// Helper: light bg
function lightBg(slide) {
  slide.background = { fill: WHITE };
  // subtle accent bar at bottom
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 7.0, w: 13.33, h: 0.5, fill: { color: NAVY } });
}

// ═══════════════════════ SLIDE 1: TITLE ═══════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: NAVY } });
  // Decorative circles
  s.addShape(pres.ShapeType.ellipse, { x: -1, y: -1, w: 4, h: 4, fill: { color: DARK2, transparency: 60 } });
  s.addShape(pres.ShapeType.ellipse, { x: 10, y: 5, w: 5, h: 5, fill: { color: DARK2, transparency: 60 } });
  // Lightning icon shape
  s.addShape(pres.ShapeType.rect, { x: 5.9, y: 1.0, w: 1.5, h: 1.5, fill: { color: ACCENT }, rectRadius: 0.3, shadow: { type: "outer", blur: 15, color: ACCENT, opacity: 0.4 } });
  s.addText("⚡", { x: 5.9, y: 1.0, w: 1.5, h: 1.5, fontSize: 40, align: "center", valign: "middle", color: WHITE });
  // Title
  s.addText("SMARTGRID", { x: 1, y: 2.8, w: 11.33, h: 1.2, fontSize: 48, fontFace: hdrFont, color: WHITE, align: "center", bold: true });
  s.addText("Intelligent Home Power Control System", { x: 1, y: 3.9, w: 11.33, h: 0.6, fontSize: 20, fontFace: bodyFont, color: ICE, align: "center" });
  // Divider line
  s.addShape(pres.ShapeType.rect, { x: 5, y: 4.7, w: 3.33, h: 0.04, fill: { color: ACCENT } });
  // Author & date
  s.addText("By Shreyansh Dwivedi", { x: 1, y: 5.1, w: 11.33, h: 0.5, fontSize: 16, fontFace: bodyFont, color: ICE, align: "center" });
  s.addText("April 2026", { x: 1, y: 5.6, w: 11.33, h: 0.4, fontSize: 14, fontFace: bodyFont, color: GRAY, align: "center" });
  // Bottom tagline
  s.addText("Real-Time Energy Management  •  AI-Powered Insights  •  Hardware-Ready", { x: 1, y: 6.5, w: 11.33, h: 0.4, fontSize: 11, fontFace: bodyFont, color: GRAY, align: "center" });
}

// ═══════════════════════ SLIDE 2: TABLE OF CONTENTS ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("Table of Contents", { x: 0.8, y: 0.4, w: 6, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });
  s.addText("Presentation Roadmap", { x: 0.8, y: 1.1, w: 6, h: 0.4, fontSize: 13, fontFace: bodyFont, color: GRAY, italic: true });

  const tocItems = [
    ["01", "Problem Statement", "🔴"],
    ["02", "Project Overview", "📋"],
    ["03", "Key Features", "⭐"],
    ["04", "System Architecture", "🏗️"],
    ["05", "Technology Stack", "💻"],
    ["06", "Circuit & Logic", "⚙️"],
    ["07", "Hardware Requirements", "🔌"],
    ["08", "Software Requirements", "📦"],
    ["09", "Implementation Details", "🔧"],
    ["10", "Database & Data Flow", "🗄️"],
    ["11", "Core Algorithm", "📐"],
  ];
  const tocItems2 = [
    ["12", "System Blueprint", "📊"],
    ["13", "Implementation Costing", "💰"],
    ["14", "Project Timeline", "📅"],
    ["15", "Testing & Validation", "✅"],
    ["16", "Challenges & Solutions", "🛡️"],
    ["17", "Results & Demo", "🖥️"],
    ["18", "Future Scope", "🚀"],
    ["19", "Conclusion", "🏆"],
    ["20", "References", "📚"],
    ["21", "Thank You", "🙏"],
  ];

  // Left column
  tocItems.forEach(([num, title, icon], i) => {
    const yy = 1.8 + i * 0.44;
    s.addShape(pres.ShapeType.roundRect, { x: 0.8, y: yy, w: 5.4, h: 0.38, fill: { color: i % 2 === 0 ? "F0F4FF" : "FFFFFF" }, rectRadius: 0.05 });
    s.addText(`${icon}  ${num}. ${title}`, { x: 1.0, y: yy, w: 5.0, h: 0.38, fontSize: 11, fontFace: bodyFont, color: NAVY, valign: "middle" });
  });
  // Right column
  tocItems2.forEach(([num, title, icon], i) => {
    const yy = 1.8 + i * 0.44;
    s.addShape(pres.ShapeType.roundRect, { x: 7.0, y: yy, w: 5.4, h: 0.38, fill: { color: i % 2 === 0 ? "F0F4FF" : "FFFFFF" }, rectRadius: 0.05 });
    s.addText(`${icon}  ${num}. ${title}`, { x: 7.2, y: yy, w: 5.0, h: 0.38, fontSize: 11, fontFace: bodyFont, color: NAVY, valign: "middle" });
  });
}

// ═══════════════════════ SLIDE 3: PROBLEM STATEMENT ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("Problem Statement", { x: 0.8, y: 0.4, w: 8, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });
  s.addText("Why SmartGrid is Needed", { x: 0.8, y: 1.1, w: 8, h: 0.4, fontSize: 13, fontFace: bodyFont, color: GRAY, italic: true });

  // Left: pain points cards
  const pains = [
    ["⚠️", "No Visibility", "Users cannot see how long their battery backup will last during outages."],
    ["🔌", "Manual Control", "Appliances must be manually switched off, wasting precious energy."],
    ["📉", "No Analytics", "Zero insight into energy consumption patterns or cost estimation."],
    ["🚫", "No Alerts", "No notification system when battery reaches critical levels."],
  ];
  pains.forEach(([icon, title, desc], i) => {
    const yy = 1.8 + i * 1.2;
    s.addShape(pres.ShapeType.roundRect, { x: 0.8, y: yy, w: 5.6, h: 1.0, fill: { color: "FFF5F5" }, line: { color: DANGER, width: 1 }, rectRadius: 0.1 });
    s.addText(icon, { x: 1.0, y: yy + 0.1, w: 0.6, h: 0.6, fontSize: 24, align: "center" });
    s.addText(title, { x: 1.6, y: yy + 0.08, w: 4.5, h: 0.35, fontSize: 14, fontFace: bodyFont, color: NAVY, bold: true });
    s.addText(desc, { x: 1.6, y: yy + 0.45, w: 4.5, h: 0.45, fontSize: 11, fontFace: bodyFont, color: GRAY });
  });

  // Right: impact stat callouts
  s.addShape(pres.ShapeType.roundRect, { x: 7.0, y: 1.8, w: 5.5, h: 4.6, fill: { color: NAVY }, rectRadius: 0.15 });
  s.addText("The Impact", { x: 7.3, y: 2.0, w: 5.0, h: 0.5, fontSize: 18, fontFace: hdrFont, color: WHITE });
  const stats = [
    ["68%", "of Indian homes face daily power cuts"],
    ["40%", "battery wasted on non-essential loads"],
    ["₹0", "insight into actual energy cost per outage"],
    ["0", "automated load-shedding systems for homes"],
  ];
  stats.forEach(([val, label], i) => {
    const yy = 2.7 + i * 0.9;
    s.addText(val, { x: 7.5, y: yy, w: 2.0, h: 0.5, fontSize: 28, fontFace: hdrFont, color: ACCENT, bold: true });
    s.addText(label, { x: 9.5, y: yy + 0.05, w: 2.8, h: 0.45, fontSize: 11, fontFace: bodyFont, color: ICE });
  });
}

// ═══════════════════════ SLIDE 4: PROJECT OVERVIEW ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("Project Overview", { x: 0.8, y: 0.4, w: 8, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });

  // Left panel
  s.addShape(pres.ShapeType.roundRect, { x: 0.8, y: 1.5, w: 5.8, h: 5.0, fill: { color: "F8FAFC" }, line: { color: ICE, width: 1 }, rectRadius: 0.1 });
  s.addText("What It Does", { x: 1.1, y: 1.6, w: 5.2, h: 0.5, fontSize: 16, fontFace: hdrFont, color: NAVY });
  s.addText(
    "SmartGrid is a web-based simulation dashboard for home inverter and appliance power management.\n\n" +
    "• Monitors battery level with real-time arc gauge\n" +
    "• Estimates runtime based on active load and charging input\n" +
    "• Applies automatic power-saving rules at configurable thresholds\n" +
    "• Records energy trends and exports CSV reports\n" +
    "• Sends SMTP email alerts on critical battery levels\n" +
    "• Integrates Gemini AI for energy optimization guidance\n" +
    "• Per-user state persistence via SQLite database",
    { x: 1.1, y: 2.2, w: 5.2, h: 4.0, fontSize: 12, fontFace: bodyFont, color: CHARCOAL, lineSpacing: 18 }
  );

  // Right panel
  s.addShape(pres.ShapeType.roundRect, { x: 7.0, y: 1.5, w: 5.5, h: 2.2, fill: { color: NAVY }, rectRadius: 0.1 });
  s.addText("Who It's For", { x: 7.3, y: 1.6, w: 5.0, h: 0.5, fontSize: 16, fontFace: hdrFont, color: WHITE });
  s.addText(
    "• Homeowners with inverter/battery backup systems\n" +
    "• Students & engineers learning energy management\n" +
    "• IoT developers prototyping smart home controllers",
    { x: 7.3, y: 2.2, w: 5.0, h: 1.3, fontSize: 12, fontFace: bodyFont, color: ICE, lineSpacing: 18 }
  );

  s.addShape(pres.ShapeType.roundRect, { x: 7.0, y: 4.0, w: 5.5, h: 2.5, fill: { color: "EFF6FF" }, line: { color: ACCENT, width: 1 }, rectRadius: 0.1 });
  s.addText("Project Type", { x: 7.3, y: 4.1, w: 5.0, h: 0.5, fontSize: 16, fontFace: hdrFont, color: NAVY });
  s.addText(
    "Category: Web Application (Full-Stack)\nScope: Prototype / Academic Project\nLicense: Open Source\nRepo: github.com/ShreyanshFS/SmartGrid",
    { x: 7.3, y: 4.6, w: 5.0, h: 1.6, fontSize: 12, fontFace: bodyFont, color: CHARCOAL, lineSpacing: 18 }
  );
}

// ═══════════════════════ SLIDE 5: KEY FEATURES ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("Key Features", { x: 0.8, y: 0.4, w: 8, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });
  s.addText("Icon Grid Layout", { x: 0.8, y: 1.1, w: 8, h: 0.35, fontSize: 13, fontFace: bodyFont, color: GRAY, italic: true });

  const features = [
    ["🔋", "Battery Intelligence", "Real-time arc gauge, auto mode switching at configurable thresholds, runtime estimation.", ACCENT],
    ["🏠", "Appliance Control", "14+ appliances with ON/OFF toggles, quantity steppers, essential/non-essential classification.", SUCCESS],
    ["☀️", "Solar & Grid Charging", "Simulated solar panel input + grid charging with adjustable watt sliders.", WARN],
    ["📧", "SMTP Email Alerts", "Server-side SMTP email reports with HTML formatted appliance status tables.", DANGER],
    ["🤖", "AI Assistant", "Gemini-powered conversational assistant for energy optimization and usage analysis.", "8B5CF6"],
    ["🔐", "Auth & Persistence", "JWT authentication, bcrypt hashing, per-user SQLite state storage with auto-sync.", NAVY],
  ];

  features.forEach(([icon, title, desc, clr], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const xx = 0.8 + col * 4.0;
    const yy = 1.7 + row * 2.7;
    // Card
    s.addShape(pres.ShapeType.roundRect, { x: xx, y: yy, w: 3.7, h: 2.4, fill: { color: WHITE }, line: { color: clr, width: 1.5 }, rectRadius: 0.12, shadow: { type: "outer", blur: 6, offset: 2, color: "000000", opacity: 0.08 } });
    // Icon circle
    s.addShape(pres.ShapeType.ellipse, { x: xx + 0.2, y: yy + 0.2, w: 0.7, h: 0.7, fill: { color: clr, transparency: 85 } });
    s.addText(icon, { x: xx + 0.2, y: yy + 0.15, w: 0.7, h: 0.7, fontSize: 22, align: "center", valign: "middle" });
    // Title
    s.addText(title, { x: xx + 1.1, y: yy + 0.25, w: 2.4, h: 0.4, fontSize: 14, fontFace: bodyFont, color: NAVY, bold: true });
    // Description
    s.addText(desc, { x: xx + 0.3, y: yy + 1.05, w: 3.1, h: 1.2, fontSize: 11, fontFace: bodyFont, color: GRAY, lineSpacing: 16 });
  });
}

// ═══════════════════════ SLIDE 6: SYSTEM ARCHITECTURE ═══════════════════════
{
  const s = pres.addSlide();
  lightBg(s);
  s.addText("System Architecture", { x: 0.8, y: 0.4, w: 8, h: 0.8, fontSize: 36, fontFace: hdrFont, color: NAVY });
  s.addText("Layered Block Diagram", { x: 0.8, y: 1.1, w: 8, h: 0.35, fontSize: 13, fontFace: bodyFont, color: GRAY, italic: true });

  // Client layer
  s.addShape(pres.ShapeType.roundRect, { x: 0.8, y: 1.8, w: 11.7, h: 1.4, fill: { color: "EFF6FF" }, line: { color: ACCENT, width: 1.5 }, rectRadius: 0.1 });
  s.addText("CLIENT LAYER (Browser)", { x: 1.0, y: 1.85, w: 4, h: 0.35, fontSize: 12, fontFace: hdrFont, color: ACCENT });
  const clientBoxes = [["React 19\nApp.tsx", ACCENT], ["LoginPage\n.tsx", SUCCESS], ["Motion\nAnimations", WARN], ["Gemini AI\nAssistant", "8B5CF6"], ["Tailwind\nCSS 4", "06B6D4"]];
  clientBoxes.forEach(([label, clr], i) => {
    s.addShape(pres.ShapeType.roundRect, { x: 1.0 + i * 2.3, y: 2.3, w: 2.0, h: 0.75, fill: { color: clr, transparency: 85 }, line: { color: clr, width: 1 }, rectRadius: 0.08 });
    s.addText(label, { x: 1.0 + i * 2.3, y: 2.3, w: 2.0, h: 0.75, fontSize: 9, fontFace: bodyFont, color: NAVY, align: "center", valign: "middle", bold: true });
  });

  // Arrow down
  s.addText("▼  HTTP / REST API  ▼", { x: 4, y: 3.3, w: 5, h: 0.4, fontSize: 11, fontFace: bodyFont, color: GRAY, align: "center" });

  // Server layer
  s.addShape(pres.ShapeType.roundRect, { x: 0.8, y: 3.8, w: 11.7, h: 1.4, fill: { color: "F0FDF4" }, line: { color: SUCCESS, width: 1.5 }, rectRadius: 0.1 });
  s.addText("SERVER LAYER (Express + Node.js)", { x: 1.0, y: 3.85, w: 6, h: 0.35, fontSize: 12, fontFace: hdrFont, color: SUCCESS });
  const serverBoxes = [["Auth Routes\nJWT+bcrypt", SUCCESS], ["State API\nSave/Load", ACCENT], ["SMTP Engine\nEmail Alerts", DANGER], ["Vite Dev\nMiddleware", "8B5CF6"]];
  serverBoxes.forEach(([label, clr], i) => {
    s.addShape(pres.ShapeType.roundRect, { x: 1.2 + i * 2.8, y: 4.35, w: 2.4, h: 0.7, fill: { color: clr, transparency: 85 }, line: { color: clr, width: 1 }, rectRadius: 0.08 });
    s.addText(label, { x: 1.2 + i * 2.8, y: 4.35, w: 2.4, h: 0.7, fontSize: 9, fontFace: bodyFont, color: NAVY, align: "center", valign: "middle", bold: true });
  });

  // Arrow down
  s.addText("▼  sql.js (WASM)  ▼", { x: 4, y: 5.3, w: 5, h: 0.4, fontSize: 11, fontFace: bodyFont, color: GRAY, align: "center" });

  // Data layer
  s.addShape(pres.ShapeType.roundRect, { x: 0.8, y: 5.8, w: 11.7, h: 1.0, fill: { color: "FFF7ED" }, line: { color: WARN, width: 1.5 }, rectRadius: 0.1 });
  s.addText("DATA LAYER (SQLite)", { x: 1.0, y: 5.85, w: 4, h: 0.35, fontSize: 12, fontFace: hdrFont, color: WARN });
  const dataBoxes = [["users\n(id, username, email, hash)", WARN], ["user_states\n(user_id, state_json, updated_at)", WARN]];
  dataBoxes.forEach(([label, clr], i) => {
    s.addShape(pres.ShapeType.roundRect, { x: 1.5 + i * 5.5, y: 6.2, w: 4.5, h: 0.5, fill: { color: clr, transparency: 85 }, line: { color: clr, width: 1 }, rectRadius: 0.06 });
    s.addText(label, { x: 1.5 + i * 5.5, y: 6.2, w: 4.5, h: 0.5, fontSize: 9, fontFace: bodyFont, color: NAVY, align: "center", valign: "middle", bold: true });
  });
}

}
