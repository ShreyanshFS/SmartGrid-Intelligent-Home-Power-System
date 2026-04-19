import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Zap, Send, Activity, Smartphone, CheckCircle2, Download, Sun, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

interface Appliance {
  id: string; name: string; watts: number;
  isEssential: boolean; isOn: boolean; isAutoCut: boolean;
}
interface Notification {
  id: string; type: 'info' | 'warning' | 'error' | 'success';
  message: string; timestamp: string;
}
interface EnergySample {
  id: string; time: string; batteryPercent: number;
  activeLoad: number; chargingWatts: number; netWatts: number;
  mode: SystemState['mode'];
}
interface SystemState {
  batteryPercent: number; mode: 'Normal' | 'Power Saving' | 'Ultra';
  powerSavingThreshold: number; ultraThreshold: number;
  batteryCapacityWh: number;
  isSimulationRunning: boolean; isChargingEnabled: boolean;
  solarInputWatts: number; gridChargingWatts: number; energyCostPerKwh: number;
  alertEmail: string; isEmailAlertsEnabled: boolean;
  appliances: Appliance[]; notifications: Notification[]; usageHistory: EnergySample[];
}

const INITIAL_APPLIANCES: Appliance[] = [
  { id: '1', name: 'Refrigerator', watts: 150, isEssential: true, isOn: true, isAutoCut: false },
  { id: '2', name: 'Fan Main', watts: 75, isEssential: true, isOn: true, isAutoCut: false },
  { id: '3', name: 'Fan Bedroom 1', watts: 75, isEssential: true, isOn: true, isAutoCut: false },
  { id: '4', name: 'Fan Bedroom 2', watts: 75, isEssential: true, isOn: true, isAutoCut: false },
  { id: '5', name: 'TV Living Room', watts: 100, isEssential: false, isOn: true, isAutoCut: false },
  { id: '6', name: 'TV Bedroom', watts: 100, isEssential: false, isOn: true, isAutoCut: false },
  { id: '7', name: 'Air Conditioner', watts: 1500, isEssential: false, isOn: false, isAutoCut: false },
  { id: '8', name: 'Kitchen Lights', watts: 40, isEssential: true, isOn: true, isAutoCut: false },
  { id: '9', name: 'Hall Lights', watts: 40, isEssential: true, isOn: true, isAutoCut: false },
  { id: '10', name: 'BR1 Lights', watts: 40, isEssential: true, isOn: true, isAutoCut: false },
  { id: '11', name: 'BR2 Lights', watts: 40, isEssential: true, isOn: true, isAutoCut: false },
  { id: '12', name: 'Entry Lights', watts: 40, isEssential: true, isOn: true, isAutoCut: false },
  { id: '13', name: 'Porch Lights', watts: 40, isEssential: true, isOn: true, isAutoCut: false },
  { id: '14', name: 'Washing Machine', watts: 500, isEssential: false, isOn: false, isAutoCut: false },
];

const DEFAULT_BATTERY_CAPACITY_WH = 10000, POWER_SAVING_CUT_WATTS = 300, SYNC_KEY = 'sg-state', SYNC_INTERVAL_MS = 3000, SIM_TICK_MS = 4000, HISTORY_LIMIT = 36;

const applyModePolicy = (appliances: Appliance[], mode: SystemState['mode']) => appliances.map(app => {
  if (mode === 'Normal') return { ...app, isAutoCut: false };
  if (mode === 'Power Saving') return { ...app, isAutoCut: !app.isEssential && app.watts >= POWER_SAVING_CUT_WATTS };
  return { ...app, isAutoCut: !app.isEssential };
});

const createInitialState = (): SystemState => ({
  batteryPercent: 85, mode: 'Normal',
  powerSavingThreshold: 30, ultraThreshold: 5,
  batteryCapacityWh: DEFAULT_BATTERY_CAPACITY_WH,
  isSimulationRunning: false, isChargingEnabled: true,
  solarInputWatts: 220, gridChargingWatts: 0, energyCostPerKwh: 8,
  alertEmail: '', isEmailAlertsEnabled: false,
  appliances: INITIAL_APPLIANCES, usageHistory: [],
  notifications: [{ id: Date.now().toString(), type: 'info', message: 'SmartGrid System Initiated.', timestamp: new Date().toLocaleTimeString() }]
});

const hydrateState = (saved: string | null): SystemState => {
  if (!saved) return createInitialState();
  try {
    const parsed = JSON.parse(saved);
    return {
      ...createInitialState(),
      ...parsed,
      appliances: Array.isArray(parsed.appliances) ? parsed.appliances : INITIAL_APPLIANCES,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      usageHistory: Array.isArray(parsed.usageHistory) ? parsed.usageHistory : [],
      batteryCapacityWh: parsed.batteryCapacityWh ?? DEFAULT_BATTERY_CAPACITY_WH,
      isChargingEnabled: parsed.isChargingEnabled ?? true,
      solarInputWatts: parsed.solarInputWatts ?? 220,
      gridChargingWatts: parsed.gridChargingWatts ?? 0,
      energyCostPerKwh: parsed.energyCostPerKwh ?? 8,
      alertEmail: parsed.alertEmail ?? '',
      isEmailAlertsEnabled: parsed.isEmailAlertsEnabled ?? false
    };
  } catch {
    return createInitialState();
  }
};

const appendHistory = (history: EnergySample[], sample: EnergySample) => [...history, sample].slice(-HISTORY_LIMIT);

// ─── Reusable primitives ───────────────────────────────────────────────────────

/** Sidebar card wrapper — fixed header, scrollable body */
const SideCard = ({ title, badge, children, className = '' }: any) => (
  <div className={`flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden ${className}`}>
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
      <span className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[var(--text-dim)]">{title}</span>
      {badge}
    </div>
    <div className="flex-1 min-h-0 flex flex-col">{children}</div>
  </div>
);

const Toggle = ({ isOn, disabled, onClick }: { isOn: boolean; disabled?: boolean; onClick: () => void }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`w-10 h-5 rounded-full relative transition-all duration-300 shrink-0 ${
      disabled ? 'bg-[var(--border)] opacity-30 cursor-not-allowed' :
      isOn ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
    }`}
  >
    <motion.div
      className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
      animate={{ x: isOn ? 20 : 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  </button>
);

// ─── Arc Battery Gauge ─────────────────────────────────────────────────────────

const ArcGauge = ({ pct }: { pct: number }) => {
  const r = 54, cx = 70, cy = 70;
  const circumference = 2 * Math.PI * r;
  const arcRatio = 0.72; // 260° sweep
  const arcLen = circumference * arcRatio;
  const offset = arcLen - (pct / 100) * arcLen;
  const rotate = 90 + (1 - arcRatio) * 180;
  const color = pct > 30 ? 'var(--success)' : pct > 10 ? 'var(--warning)' : 'var(--danger)';
  return (
    <svg width="140" height="110" viewBox="0 0 140 110" className="mx-auto">
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth="11" strokeLinecap="round"
        strokeDasharray={`${arcLen} ${circumference}`}
        strokeDashoffset={0}
        transform={`rotate(${rotate} ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={`${arcLen} ${circumference}`}
        strokeDashoffset={offset}
        transform={`rotate(${rotate} ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s' }} />
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize="22" fontWeight="700" fontFamily="system-ui">
        {Math.round(pct)}%
      </text>
      <text x={cx} y={cy + 18} textAnchor="middle" fill="#71717a" fontSize="9" fontFamily="system-ui">
        CHARGE LEVEL
      </text>
    </svg>
  );
};

// ─── Mode Switcher ─────────────────────────────────────────────────────────────

const ModeSwitcher = ({ mode, onChange }: { mode: string; onChange: (m: any) => void }) => {
  const modes = ['Normal', 'Power Saving', 'Ultra'] as const;
  const idx = modes.indexOf(mode as any);
  return (
    <div className="relative flex bg-[var(--bg)] border border-[var(--border)] rounded-lg p-0.5">
      <motion.div
        className="absolute top-0.5 bottom-0.5 rounded-md bg-[var(--surface2,#27272a)] border border-[var(--border)]"
        animate={{ left: `calc(${idx * 33.33}% + 2px)`, width: 'calc(33.33% - 4px)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      />
      {modes.map(m => (
        <button key={m} onClick={() => onChange(m)}
          className={`relative z-10 flex-1 py-1.5 text-[0.6rem] font-bold uppercase tracking-wider rounded-md transition-colors ${
            mode === m ? 'text-white' : 'text-[var(--text-dim)]'
          }`}>
          {m === 'Power Saving' ? 'Save' : m}
        </button>
      ))}
    </div>
  );
};

// ─── Stat Chip ─────────────────────────────────────────────────────────────────

const Chip = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
  <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3">
    <div className="text-[0.6rem] text-[var(--text-dim)] uppercase tracking-wider mb-1">{label}</div>
    <div className={`text-base font-bold font-mono leading-none ${accent || 'text-white'}`}>{value}</div>
  </div>
);

// ─── Main App ──────────────────────────────────────────────────────────────────

const HistoryChart = ({ history }: { history: EnergySample[] }) => {
  const width = 260, height = 120, pad = 10;
  const points = history.length ? history : [{
    id: 'empty',
    time: '',
    batteryPercent: 85,
    activeLoad: 0,
    chargingWatts: 0,
    netWatts: 0,
    mode: 'Normal' as const
  }];
  const maxLoad = Math.max(100, ...points.map(p => Math.max(p.activeLoad, p.chargingWatts)));
  const xFor = (i: number) => pad + (i / Math.max(1, points.length - 1)) * (width - pad * 2);
  const batteryPath = points.map((p, i) => {
    const y = pad + (1 - p.batteryPercent / 100) * (height - pad * 2);
    return `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const loadPath = points.map((p, i) => {
    const y = pad + (1 - p.activeLoad / maxLoad) * (height - pad * 2);
    return `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28" role="img" aria-label="Battery and load history chart">
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="var(--border)" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="var(--border)" />
        <path d={loadPath} fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" />
        <path d={batteryPath} fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div className="flex justify-between text-[0.65rem] text-[var(--text-dim)]">
        <span className="text-[var(--success)]">Battery</span>
        <span className="text-[var(--warning)]">Load</span>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [state, setState] = useState<SystemState>(() => {
    const saved = localStorage.getItem(SYNC_KEY);
    return hydrateState(saved);
  });

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [newAppliance, setNewAppliance] = useState({ name: '', watts: 0, quantity: 1, isEssential: false });

  const activeLoad = useMemo(() =>
    state.appliances.filter(a => a.isOn && !a.isAutoCut).reduce((s, a) => s + a.watts, 0),
    [state.appliances]);
  const chargingWatts = useMemo(() =>
    state.isChargingEnabled ? state.solarInputWatts + state.gridChargingWatts : 0,
    [state.isChargingEnabled, state.solarInputWatts, state.gridChargingWatts]);
  const netBatteryWatts = useMemo(() => activeLoad - chargingWatts, [activeLoad, chargingWatts]);

  const estimatedRuntime = useMemo(() => {
    if (netBatteryWatts <= 0) return 99.9;
    return ((state.batteryPercent / 100) * state.batteryCapacityWh) / netBatteryWatts;
  }, [state.batteryPercent, state.batteryCapacityWh, netBatteryWatts]);
  const simulatedKwh = useMemo(() =>
    state.usageHistory.reduce((sum, s) => sum + (s.activeLoad * SIM_TICK_MS / 3_600_000 / 1000), 0),
    [state.usageHistory]);
  const estimatedCost = useMemo(() => simulatedKwh * state.energyCostPerKwh, [simulatedKwh, state.energyCostPerKwh]);

  const addNotification = (message: string, type: Notification['type'] = 'info') => {
    setState(prev => ({
      ...prev,
      notifications: [{ id: Date.now().toString(), type, message, timestamp: new Date().toLocaleTimeString() }, ...prev.notifications].slice(0, 50)
    }));
  };

  const updateState = (updater: (p: SystemState) => SystemState) => {
    setState(prev => {
      const next = updater(prev);
      localStorage.setItem(SYNC_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleModeChange = (newMode: SystemState['mode']) => {
    updateState(prev => ({
      ...prev, mode: newMode,
      appliances: applyModePolicy(prev.appliances, newMode)
    }));
    addNotification(`Mode set to ${newMode}.`);
  };

  const toggleAppliance = (id: string, isRemote = false) => {
    const app = state.appliances.find(a => a.id === id);
    updateState(prev => ({ ...prev, appliances: prev.appliances.map(a => a.id === id ? { ...a, isOn: !a.isOn } : a) }));
    if (app) addNotification(`${isRemote ? '[Remote] ' : ''}${app.name} → ${!app.isOn ? 'ON' : 'OFF'}`);
  };

  const formatRuntime = () => {
    if (netBatteryWatts <= 0) return 'Charging';
    return `${Math.floor(estimatedRuntime)}h ${Math.round((estimatedRuntime % 1) * 60)}m`;
  };

  const sendEmailAlert = async (reason = 'Manual SmartGrid alert') => {
    if (!state.isEmailAlertsEnabled || !state.alertEmail.trim()) {
      addNotification('Enable SMTP email alerts and add a recipient first.', 'warning');
      return;
    }
    try {
      const response = await fetch('/api/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: state.alertEmail.trim(),
          reason,
          batteryPercent: state.batteryPercent,
          mode: state.mode,
          activeLoad,
          chargingWatts,
          netWatts: netBatteryWatts,
          estimatedRuntime: formatRuntime(),
          timestamp: new Date().toLocaleString(),
          appliances: state.appliances
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Email service failed.');
      addNotification('SMTP alert email sent.', 'success');
    } catch (error) {
      addNotification(error instanceof Error ? error.message : 'Failed to send SMTP email.', 'error');
    }
  };

  // Auto mode switch on battery change
  useEffect(() => {
    const { batteryPercent, powerSavingThreshold, ultraThreshold, mode } = state;
    let target = mode;
    if (batteryPercent <= ultraThreshold) target = 'Ultra';
    else if (batteryPercent <= powerSavingThreshold) target = 'Power Saving';
    if (target !== mode) {
      updateState(prev => ({
        ...prev, mode: target,
        appliances: applyModePolicy(prev.appliances, target)
      }));
      addNotification(`Auto-switched to ${target} mode.`, 'warning');
    }
  }, [state.batteryPercent]);

  // Simulation tick
  useEffect(() => {
    if (!state.isSimulationRunning) return;
    const interval = setInterval(() => {
      updateState(prev => {
        const inputWatts = prev.isChargingEnabled ? prev.solarInputWatts + prev.gridChargingWatts : 0;
        const netWatts = activeLoad - inputWatts;
        const delta = (netWatts / prev.batteryCapacityWh) * 100 * (SIM_TICK_MS / 3_600_000);
        const nextBattery = Math.min(100, Math.max(0, prev.batteryPercent - delta));
        return {
          ...prev,
          batteryPercent: nextBattery,
          isSimulationRunning: nextBattery <= 0 && netWatts > 0 ? false : prev.isSimulationRunning,
          usageHistory: appendHistory(prev.usageHistory, {
            id: Date.now().toString(),
            time: new Date().toLocaleTimeString(),
            batteryPercent: nextBattery,
            activeLoad,
            chargingWatts: inputWatts,
            netWatts,
            mode: prev.mode
          })
        };
      });
    }, SIM_TICK_MS);
    return () => clearInterval(interval);
  }, [state.isSimulationRunning, activeLoad]);

  // Cross-tab sync
  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem(SYNC_KEY);
      if (saved) { try { const p = hydrateState(saved); setState(prev => JSON.stringify(prev) !== JSON.stringify(p) ? p : prev); } catch { /* ignore */ } }
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  async function askAI(question: string) {
    if (!question) return;
    setChatMessages(prev => [...prev, { role: 'user', text: question }]);
    setIsTyping(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) { setChatMessages(prev => [...prev, { role: 'assistant', text: 'AI not configured. Set VITE_GEMINI_API_KEY.' }]); return; }
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `SmartGrid AI. Battery: ${state.batteryPercent.toFixed(1)}%, Mode: ${state.mode}, Load: ${activeLoad}W, Runtime: ${estimatedRuntime.toFixed(1)}h.`
        },
        contents: question
      });
      setChatMessages(prev => [...prev, { role: 'assistant', text: result.text || 'No response.' }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: `Error: ${(e as any).message}` }]);
    } finally { setIsTyping(false); }
  }

  const tabs = ['Overview', 'Control', 'Remote Control', 'AI Assistant', 'About'];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── Nav ── */}
      <nav className="h-14 border-b border-[var(--border)] flex items-center px-5 justify-between bg-[var(--bg)] shrink-0 z-10">
        <div className="flex items-center gap-2.5 font-bold text-base tracking-tight">
          <div className="w-7 h-7 bg-[var(--accent)] rounded-lg flex items-center justify-center shrink-0">
            <Zap className="text-white w-4 h-4 fill-white" />
          </div>
          SmartGrid
        </div>

        <div className="flex gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)]">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-[0.75rem] font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'text-white bg-[var(--bg)] border border-[var(--border)] shadow-sm'
                  : 'text-[var(--text-dim)] hover:text-white'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[0.65rem] font-mono text-[var(--success)] font-semibold">
          <span className={`w-1.5 h-1.5 rounded-full bg-[var(--success)] ${state.isSimulationRunning ? 'animate-pulse' : ''}`} />
          LIVE SYNC — 3S
        </div>
      </nav>

      {/* ── Tab Content ── */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="h-full">
            {activeTab === 'Overview' && (
              <OverviewTab state={state} activeLoad={activeLoad} runtime={estimatedRuntime}
                toggleAppliance={toggleAppliance} handleModeChange={handleModeChange} updateState={updateState} />
            )}
            {activeTab === 'Control' && (
              <ControlTab state={state} updateState={updateState}
                handleModeChange={handleModeChange} addNotification={addNotification}
                sendEmailAlert={sendEmailAlert} simulatedKwh={simulatedKwh} estimatedCost={estimatedCost}
                newAppliance={newAppliance} setNewAppliance={setNewAppliance} />
            )}
            {activeTab === 'Remote Control' && (
              <RemoteTab state={state} handleModeChange={handleModeChange} toggleAppliance={toggleAppliance} />
            )}
            {activeTab === 'AI Assistant' && (
              <AITab messages={chatMessages} isTyping={isTyping} onAsk={askAI} />
            )}
            {activeTab === 'About' && <AboutTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Global battery strip ── */}
      <div className="h-0.5 w-full bg-[var(--border)] shrink-0">
        <motion.div className="h-full" animate={{ width: `${state.batteryPercent}%` }}
          style={{ backgroundColor: state.batteryPercent > 30 ? 'var(--success)' : state.batteryPercent > 10 ? 'var(--warning)' : 'var(--danger)' }}
          transition={{ duration: 0.8 }} />
      </div>
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────
// Layout: LEFT sidebar (fixed 252px) | CENTER flex-1 | RIGHT sidebar (fixed 252px)
// Each column is independently scrollable — no row-span fights, no overflow clipping.

function OverviewTab({ state, activeLoad, runtime, toggleAppliance, handleModeChange, updateState }: any) {
  const battColor = state.batteryPercent > 30 ? 'text-[var(--success)]' : state.batteryPercent > 10 ? 'text-[var(--warning)]' : 'text-[var(--danger)]';
  const wattsSaved = state.appliances.filter((a: Appliance) => !a.isOn).reduce((s: number, a: Appliance) => s + a.watts, 0);
  const chargeInput = state.isChargingEnabled ? state.solarInputWatts + state.gridChargingWatts : 0;
  const netLoad = activeLoad - chargeInput;
  const runtimeH = Math.floor(runtime);
  const runtimeM = Math.round((runtime % 1) * 60);
  const runtimeLabel = netLoad <= 0 ? 'Charging' : `${runtimeH}h ${runtimeM}m`;

  return (
    <div className="flex h-full gap-3 p-4 overflow-hidden">

      {/* ── LEFT: Battery + Mode + Stats ── */}
      <aside className="w-[248px] shrink-0 flex flex-col gap-3 overflow-y-auto custom-scrollbar">

        {/* Battery gauge */}
        <SideCard title="Battery"
          badge={<span className="bg-blue-500/10 text-[var(--accent)] px-2 py-0.5 rounded text-[0.6rem] font-bold border border-blue-500/20">{state.mode.toUpperCase()}</span>}>
          <div className="p-4 flex flex-col items-center gap-3">
            <ArcGauge pct={state.batteryPercent} />
            <div className="w-full">
              <ModeSwitcher mode={state.mode} onChange={handleModeChange} />
            </div>
            <div className="w-full grid grid-cols-2 gap-2">
              <Chip label="Runtime" value={runtimeLabel} />
              <Chip label="Load" value={`${activeLoad}W`} accent="text-[var(--accent)]" />
              <Chip label="Charge In" value={`${chargeInput}W`} accent="text-[var(--warning)]" />
              <Chip label="Capacity" value={`${(state.batteryCapacityWh / 1000).toFixed(1)} kWh`} />
              <Chip label="Saved" value={`${wattsSaved}W`} accent="text-[var(--success)]" />
              <Chip label="Active" value={`${state.appliances.filter((a: Appliance) => a.isOn && !a.isAutoCut).length}`} />
            </div>
          </div>
        </SideCard>

        {/* Simulation toggle */}
        <button
          onClick={() => updateState((p: any) => ({ ...p, isSimulationRunning: !p.isSimulationRunning }))}
          className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
            state.isSimulationRunning
              ? 'bg-red-500/10 text-[var(--danger)] border-red-500/25 hover:bg-red-500/20'
              : 'bg-green-500/10 text-[var(--success)] border-green-500/25 hover:bg-green-500/20'
          }`}>
          {state.isSimulationRunning ? '⏹ Stop Simulation' : '▶ Start Simulation'}
        </button>

        {/* AI snippet */}
        <SideCard title="AI Assistant">
          <div className="p-4 flex flex-col gap-3">
            <p className="text-[0.75rem] text-[var(--text-dim)] leading-relaxed italic">
              Battery at {Math.round(state.batteryPercent)}%. Load is {activeLoad}W. {state.mode !== 'Normal' ? `${state.mode} mode active.` : 'System nominal.'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['Overview', 'Usage Tips', 'Report'].map(btn => (
                <button key={btn} className="bg-[var(--bg)] border border-[var(--border)] px-2.5 py-1 rounded-lg text-[0.65rem] text-[var(--text-dim)] hover:text-white transition-colors">{btn}</button>
              ))}
            </div>
          </div>
        </SideCard>
      </aside>

      {/* ── CENTER: Appliance List ── */}
      <section className="flex-1 min-w-0 flex flex-col gap-3 overflow-hidden">
        <SideCard title="Active Appliances"
          badge={<span className="text-[0.6rem] text-[var(--text-dim)] font-semibold">{state.appliances.filter((a: Appliance) => a.isOn && !a.isAutoCut).length} / {state.appliances.length} ON</span>}
          className="flex-1">
          <div className="overflow-y-auto custom-scrollbar flex-1 p-3 flex flex-col gap-1.5">
            {state.appliances.map((app: Appliance) => (
              <div key={app.id}
                className="flex items-center justify-between px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl hover:border-[var(--border-hover,#3f3f46)] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${app.isOn && !app.isAutoCut ? 'bg-[var(--success)]' : 'bg-[var(--border)]'}`} />
                  <div className="min-w-0">
                    <div className="text-[0.825rem] font-medium truncate">{app.name}</div>
                    <div className="text-[0.7rem] text-[var(--text-dim)]">
                      {app.watts}W · {app.isEssential ? 'Essential' : 'Regular'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {app.isAutoCut && (
                    <span className="text-[0.6rem] font-bold text-[var(--danger)] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">CUT</span>
                  )}
                  <Toggle isOn={app.isOn && !app.isAutoCut} disabled={app.isAutoCut} onClick={() => toggleAppliance(app.id)} />
                </div>
              </div>
            ))}
          </div>
        </SideCard>
      </section>

      {/* ── RIGHT: Activity Log ── */}
      <aside className="w-[248px] shrink-0 flex flex-col gap-3 overflow-hidden">
        <SideCard title="Energy Trends"
          badge={<span className="text-[0.6rem] text-[var(--text-dim)] font-semibold">{state.usageHistory.length} samples</span>}>
          <div className="p-3 flex flex-col gap-3">
            <HistoryChart history={state.usageHistory} />
            <div className="grid grid-cols-2 gap-2">
              <Chip label="Charge In" value={`${state.isChargingEnabled ? state.solarInputWatts + state.gridChargingWatts : 0}W`} accent="text-[var(--warning)]" />
              <Chip label="Net" value={`${activeLoad - (state.isChargingEnabled ? state.solarInputWatts + state.gridChargingWatts : 0)}W`} />
            </div>
          </div>
        </SideCard>

        <SideCard title="Activity Log" className="flex-1">
          <div className="overflow-y-auto custom-scrollbar flex-1 p-3 flex flex-col gap-2">
            {state.notifications.slice(0, 30).map((n: Notification) => (
              <div key={n.id} className="flex gap-2 border-l-2 border-[var(--accent)] pl-2.5 py-0.5">
                <span className="font-mono text-[0.65rem] text-[var(--text-dim)] shrink-0 mt-0.5">{n.timestamp}</span>
                <span className="text-[0.7rem] opacity-85 leading-relaxed">{n.message}</span>
              </div>
            ))}
            {state.notifications.length === 0 && (
              <p className="text-[0.7rem] text-[var(--text-dim)] text-center py-4">No activity yet.</p>
            )}
          </div>
        </SideCard>
      </aside>
    </div>
  );
}

// ─── Control Tab ───────────────────────────────────────────────────────────────
// Single scrollable column layout — sections stack cleanly, no 2-col grid overflow.

function ControlTab({ state, updateState, handleModeChange, addNotification, sendEmailAlert, simulatedKwh, estimatedCost, newAppliance, setNewAppliance }: any) {
  const toggleSim = () => {
    updateState((prev: SystemState) => ({ ...prev, isSimulationRunning: !prev.isSimulationRunning }));
    addNotification(`Simulation ${!state.isSimulationRunning ? 'STARTED' : 'STOPPED'}.`);
  };

  const exportCsv = () => {
    const headers = ['time', 'batteryPercent', 'activeLoadWatts', 'chargingWatts', 'netWatts', 'mode'];
    const rows = state.usageHistory.map((s: EnergySample) => [
      s.time, s.batteryPercent.toFixed(2), s.activeLoad, s.chargingWatts, s.netWatts, s.mode
    ]);
    const csv = [headers, ...rows].map(row => row.map(String).map(value => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smartgrid-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addNotification('Energy CSV report exported.', 'success');
  };

  const registerDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppliance.name || newAppliance.watts <= 0) return;
    const quantity = Math.max(1, Math.min(50, Math.floor(Number(newAppliance.quantity) || 1)));
    const baseName = newAppliance.name.trim();
    const newDevices = Array.from({ length: quantity }, (_, index) => ({
      id: `${Date.now()}-${index}`,
      name: quantity === 1 ? baseName : `${baseName} ${index + 1}`,
      watts: newAppliance.watts,
      isEssential: newAppliance.isEssential,
      isOn: false,
      isAutoCut: false
    }));
    updateState((p: any) => ({
      ...p,
      appliances: applyModePolicy([...p.appliances, ...newDevices], p.mode)
    }));
    addNotification(`Registered ${quantity} x ${baseName}.`);
    setNewAppliance({ name: '', watts: 0, quantity: 1, isEssential: false });
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Grid Simulation */}
        <SideCard title="Grid Simulation">
          <div className="p-5 flex flex-col gap-5">
            <div className="flex items-center justify-between bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4">
              <div>
                <div className="text-xs font-bold font-mono">STATUS: {state.isSimulationRunning ? 'RUNNING' : 'IDLE'}</div>
                <div className="text-[0.7rem] text-[var(--text-dim)] mt-0.5">Real-time depletion {state.isSimulationRunning ? 'active' : 'paused'}</div>
              </div>
              <button onClick={toggleSim}
                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  state.isSimulationRunning ? 'bg-[var(--danger)] text-white' : 'bg-[var(--success)] text-white'
                }`}>
                {state.isSimulationRunning ? 'Stop Cut' : 'Start Cut'}
              </button>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-[var(--text-dim)]">BATTERY OVERRIDE</span>
                <span className="text-[var(--accent)]">{Math.round(state.batteryPercent)}%</span>
              </div>
              <input type="range" className="w-full" value={state.batteryPercent}
                onChange={e => updateState((p: any) => ({ ...p, batteryPercent: Number(e.target.value) }))} />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-[var(--text-dim)]">BATTERY CAPACITY</span>
                <span className="text-[var(--success)]">{(state.batteryCapacityWh / 1000).toFixed(1)} kWh</span>
              </div>
              <input type="range" min="1000" max="20000" step="500" className="w-full" value={state.batteryCapacityWh}
                onChange={e => updateState((p: SystemState) => ({ ...p, batteryCapacityWh: Number(e.target.value) }))} />
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[5000, 10000, 15000].map(capacity => (
                  <button key={capacity} type="button"
                    onClick={() => updateState((p: SystemState) => ({ ...p, batteryCapacityWh: capacity }))}
                    className={`rounded-lg border px-2 py-1.5 text-[0.65rem] font-bold ${
                      state.batteryCapacityWh === capacity ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-dim)]'
                    }`}>
                    {capacity / 1000} kWh
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[0.65rem] text-[var(--text-dim)] uppercase tracking-wider mb-2 font-semibold">System Mode</div>
              <ModeSwitcher mode={state.mode} onChange={handleModeChange} />
            </div>
          </div>
        </SideCard>

        {/* Automatic Logic */}
        <SideCard title="Automatic Logic">
          <div className="p-5 flex flex-col gap-6">
            {[
              { label: 'POWER SAVING TRIGGER', key: 'powerSavingThreshold', color: 'var(--warning)' },
              { label: 'ULTRA SAVER TRIGGER', key: 'ultraThreshold', color: 'var(--danger)' }
            ].map(s => (
              <div key={s.key}>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-[var(--text-dim)]">{s.label}</span>
                  <span style={{ color: s.color }}>{state[s.key]}%</span>
                </div>
                <input type="range" className="w-full" value={state[s.key]}
                  onChange={e => updateState((p: any) => ({ ...p, [s.key]: Number(e.target.value) }))} />
              </div>
            ))}
            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3 text-[0.7rem] text-[var(--text-dim)] leading-relaxed">
              Power Saving cuts only high-load non-essential devices ({POWER_SAVING_CUT_WATTS}W+). Ultra cuts every non-essential device, so Ultra always leaves less load and cuts more appliances.
            </div>
          </div>
        </SideCard>

        {/* Charging And Cost */}
        <SideCard title="Charging And Cost">
          <div className="p-5 flex flex-col gap-5">
            <div className="flex items-center justify-between bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Sun className="w-4 h-4 text-[var(--warning)]" />
                <div>
                  <div className="text-xs font-bold">CHARGE INPUT</div>
                  <div className="text-[0.65rem] text-[var(--text-dim)]">Solar plus grid charging simulation</div>
                </div>
              </div>
              <Toggle isOn={state.isChargingEnabled} onClick={() => updateState((p: SystemState) => ({ ...p, isChargingEnabled: !p.isChargingEnabled }))} />
            </div>

            {[
              { label: 'SOLAR INPUT', val: state.solarInputWatts, key: 'solarInputWatts', max: 1000, unit: 'W' },
              { label: 'GRID CHARGER', val: state.gridChargingWatts, key: 'gridChargingWatts', max: 800, unit: 'W' },
              { label: 'ENERGY RATE', val: state.energyCostPerKwh, key: 'energyCostPerKwh', max: 20, unit: '/kWh' }
            ].map(s => (
              <div key={s.key}>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-[var(--text-dim)]">{s.label}</span>
                  <span>{s.key === 'energyCostPerKwh' ? 'Rs ' : ''}{s.val}{s.unit}</span>
                </div>
                <input type="range" min="0" max={s.max} className="w-full" value={s.val}
                  onChange={e => updateState((p: any) => ({ ...p, [s.key]: Number(e.target.value) }))} />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <Chip label="Sim Energy" value={`${simulatedKwh.toFixed(3)} kWh`} />
              <Chip label="Est. Cost" value={`Rs ${estimatedCost.toFixed(2)}`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={exportCsv} className="flex items-center justify-center gap-2 bg-[var(--accent)] text-white rounded-lg py-2 text-xs font-bold uppercase tracking-wider">
                <Download className="w-4 h-4" /> CSV
              </button>
              <button onClick={() => updateState((p: SystemState) => ({ ...p, usageHistory: [] }))} className="bg-[var(--bg)] border border-[var(--border)] text-[var(--text-dim)] rounded-lg py-2 text-xs font-bold uppercase tracking-wider">
                Clear History
              </button>
            </div>
          </div>
        </SideCard>

        {/* Hardware Gateway */}
        <SideCard title="Hardware Gateway">
          <div className="p-5 flex flex-col gap-4">
            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 flex items-start gap-3">
              <Wifi className="w-4 h-4 text-[var(--success)] mt-0.5" />
              <div>
                <div className="text-xs font-bold">ESP32 / MQTT READY</div>
                <p className="text-[0.7rem] text-[var(--text-dim)] leading-relaxed mt-1">Software placeholder for relay boards, inverter telemetry, and remote commands.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Chip label="Topic" value="smartgrid/home" />
              <Chip label="Status" value="Simulated" accent="text-[var(--success)]" />
            </div>
          </div>
        </SideCard>

        {/* Alert Channels */}
        <SideCard title="Alert Channels">
          <div className="p-5 flex flex-col gap-4">
            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold">SMTP EMAIL ALERT</div>
                <div className="text-[0.65rem] text-[var(--text-dim)]">Sent from configured project sender account</div>
              </div>
              <Toggle isOn={state.isEmailAlertsEnabled} onClick={() => updateState((p: SystemState) => ({ ...p, isEmailAlertsEnabled: !p.isEmailAlertsEnabled }))} />
            </div>
            <input type="email" value={state.alertEmail}
              onChange={e => updateState((p: SystemState) => ({ ...p, alertEmail: e.target.value }))}
              className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm w-full"
              placeholder="recipient@example.com" />
            <button onClick={() => sendEmailAlert()} className="w-full bg-[var(--accent)] text-white rounded-lg py-2 text-xs font-bold uppercase tracking-wider">
              Send Email Alert
            </button>
          </div>
        </SideCard>

        {/* Device Registration */}
        <SideCard title="Device Registration" className="xl:col-span-2">
          <div className="p-5">
            <form onSubmit={registerDevice} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="sm:col-span-1 flex flex-col gap-1.5">
                <label className="text-[0.6rem] text-[var(--text-dim)] uppercase font-semibold">Name</label>
                <input type="text" value={newAppliance.name}
                  onChange={e => setNewAppliance({ ...newAppliance, name: e.target.value })}
                  className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm w-full"
                  placeholder="e.g. Bedroom Fan" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.6rem] text-[var(--text-dim)] uppercase font-semibold">Load (W)</label>
                <input type="number" value={newAppliance.watts || ''}
                  onChange={e => setNewAppliance({ ...newAppliance, watts: Number(e.target.value) })}
                  className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm w-full"
                  placeholder="e.g. 500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.6rem] text-[var(--text-dim)] uppercase font-semibold">Quantity</label>
                <input type="number" min="1" max="50" value={newAppliance.quantity || ''}
                  onChange={e => setNewAppliance({ ...newAppliance, quantity: Number(e.target.value) })}
                  className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm w-full"
                  placeholder="e.g. 3" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.6rem] text-[var(--text-dim)] uppercase font-semibold">Priority</label>
                <select value={newAppliance.isEssential ? 't' : 'f'}
                  onChange={e => setNewAppliance({ ...newAppliance, isEssential: e.target.value === 't' })}
                  className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm w-full">
                  <option value="f">Non-Essential</option>
                  <option value="t">Essential</option>
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit"
                  className="w-full py-2 bg-[var(--accent)] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
                  Register
                </button>
              </div>
            </form>
          </div>
        </SideCard>

      </div>
    </div>
  );
}

// ─── Remote Tab ────────────────────────────────────────────────────────────────

function RemoteTab({ state, handleModeChange, toggleAppliance }: any) {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4">
      <div className="max-w-md mx-auto flex flex-col gap-4">

        <SideCard title="Remote Terminal">
          <div className="p-4">
            <div className="flex items-center justify-between bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <div>
                  <div className="text-xs font-bold">SMARTPHONE NODE</div>
                  <div className="text-[0.6rem] text-[var(--success)] font-mono">CONNECTED</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[0.6rem] text-[var(--text-dim)]">BATTERY</div>
                <div className="text-lg font-mono font-bold">{Math.round(state.batteryPercent)}%</div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              {state.appliances.map((app: Appliance) => (
                <div key={app.id} className="flex items-center justify-between bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{app.name}</div>
                    <div className="text-[0.7rem] text-[var(--text-dim)]">{app.watts}W</div>
                  </div>
                  <Toggle isOn={app.isOn && !app.isAutoCut} disabled={app.isAutoCut} onClick={() => toggleAppliance(app.id, true)} />
                </div>
              ))}
            </div>

            <ModeSwitcher mode={state.mode} onChange={handleModeChange} />
          </div>
        </SideCard>

      </div>
    </div>
  );
}

// ─── AI Tab ────────────────────────────────────────────────────────────────────

function AITab({ messages, isTyping, onAsk }: any) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  return (
    <div className="h-full flex flex-col p-4 gap-3 max-w-3xl mx-auto">

      <SideCard title="GridAI Console" className="flex-1 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <p className="text-[0.8rem] text-[var(--text-dim)] text-center py-8">Ask anything about your energy system.</p>
          )}
          {messages.map((m: any, i: number) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-xl text-[0.85rem] max-w-[85%] leading-relaxed ${
                m.role === 'user' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg)] border border-[var(--border)]'
              }`}>{m.text}</div>
            </div>
          ))}
          {isTyping && <div className="text-[0.75rem] text-[var(--text-dim)] animate-pulse">Analyzing grid metrics…</div>}
        </div>

        <div className="p-4 border-t border-[var(--border)] shrink-0">
          <form onSubmit={e => { e.preventDefault(); onAsk(input); setInput(''); }} className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
              placeholder="Ask AI about your consumption…" />
            <button type="submit" className="bg-[var(--accent)] p-2.5 rounded-lg text-white hover:opacity-90 transition-opacity">
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex gap-2 mt-3 flex-wrap">
            {['Usage summary', 'Optimization tips', 'Runtime estimate'].map(btn => (
              <button key={btn} onClick={() => onAsk(btn)}
                className="bg-[var(--bg)] border border-[var(--border)] px-3 py-1.5 rounded-lg text-[0.65rem] text-[var(--text-dim)] hover:text-white transition-colors">
                {btn}
              </button>
            ))}
          </div>
        </div>
      </SideCard>

    </div>
  );
}

// ─── About Tab ─────────────────────────────────────────────────────────────────

function AboutTab() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">

        <SideCard title="Project">
          <div className="p-6">
            <h1 className="text-2xl font-black mb-3">SmartGrid</h1>
            <p className="text-[var(--text-dim)] text-sm leading-relaxed">
              An integrated intelligence layer for decentralized home energy independence. Optimized for high-durability backup scenarios with real-time monitoring and smart mode switching.
            </p>
          </div>
        </SideCard>

        <div className="grid grid-cols-2 gap-4">
          <SideCard title="Core Features">
            <div className="p-4 grid grid-cols-2 gap-2">
              {['Battery Intel', 'Appliance Control', 'Solar Input', 'SMTP Alerts', 'Cost Report', 'Hardware Ready'].map(f => (
                <div key={f} className="flex items-center gap-2 bg-[var(--bg)] border border-[var(--border)] p-2.5 rounded-lg text-[0.75rem]">
                  <CheckCircle2 className="w-3 h-3 text-[var(--success)] shrink-0" /> {f}
                </div>
              ))}
            </div>
          </SideCard>

          <SideCard title="Hardware Context">
            <div className="p-4">
              <p className="text-[0.8rem] text-[var(--text-dim)] leading-relaxed">
                System architecture designed for ESP32 / Sonoff integration. Live prototype validated at PSIT Kanpur Lab environment. MQTT-ready gateway for real relay boards.
              </p>
            </div>
          </SideCard>
        </div>

        <div className="text-center py-8 border-t border-[var(--border)] opacity-40">
          <p className="text-[0.6rem] font-mono uppercase tracking-[0.2em]">Electronics Engineering Division</p>
          <h2 className="text-sm font-black tracking-tight mt-1">PSIT KANPUR UNIVERSITY</h2>
        </div>

      </div>
    </div>
  );
}
