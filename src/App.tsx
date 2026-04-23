import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Zap, Send, Activity, Smartphone, CheckCircle2, Download, Sun, Wifi, Github, Maximize2, X, LogOut, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import LoginPage from './LoginPage';

interface Appliance {
  id: string; name: string; watts: number; quantity: number;
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
  isSimulationRunning: boolean; isChargingEnabled: boolean;
  solarInputWatts: number; gridChargingWatts: number; energyCostPerKwh: number;
  alertEmail: string; isEmailAlertsEnabled: boolean;
  appliances: Appliance[]; notifications: Notification[]; usageHistory: EnergySample[];
}

const INITIAL_APPLIANCES: Appliance[] = [
  { id: '1', name: 'Refrigerator', watts: 150, quantity: 1, isEssential: true, isOn: true, isAutoCut: false },
  { id: '2', name: 'Fan Main', watts: 75, quantity: 1, isEssential: true, isOn: true, isAutoCut: false },
  { id: '3', name: 'Fan Bedroom 1', watts: 75, quantity: 1, isEssential: true, isOn: true, isAutoCut: false },
  { id: '4', name: 'Fan Bedroom 2', watts: 75, quantity: 1, isEssential: true, isOn: true, isAutoCut: false },
  { id: '5', name: 'TV Living Room', watts: 100, quantity: 1, isEssential: false, isOn: true, isAutoCut: false },
  { id: '6', name: 'TV Bedroom', watts: 100, quantity: 1, isEssential: false, isOn: true, isAutoCut: false },
  { id: '7', name: 'Air Conditioner', watts: 1500, quantity: 1, isEssential: false, isOn: false, isAutoCut: false },
  { id: '8', name: 'Kitchen Lights', watts: 40, quantity: 1, isEssential: true, isOn: true, isAutoCut: false },
  { id: '9', name: 'Hall Lights', watts: 40, quantity: 1, isEssential: true, isOn: true, isAutoCut: false },
  { id: '10', name: 'BR1 Lights', watts: 40, quantity: 1, isEssential: true, isOn: true, isAutoCut: false },
  { id: '11', name: 'BR2 Lights', watts: 40, quantity: 1, isEssential: true, isOn: true, isAutoCut: false },
  { id: '12', name: 'Entry Lights', watts: 40, quantity: 1, isEssential: true, isOn: true, isAutoCut: false },
  { id: '13', name: 'Porch Lights', watts: 40, quantity: 1, isEssential: true, isOn: true, isAutoCut: false },
  { id: '14', name: 'Washing Machine', watts: 500, quantity: 1, isEssential: false, isOn: false, isAutoCut: false },
];

const BATTERY_TOTAL_WH = 1000, SYNC_INTERVAL_MS = 3000, SIM_TICK_MS = 4000, HISTORY_LIMIT = 36;
const AUTH_TOKEN_KEY = 'sg-auth-token', AUTH_USER_KEY = 'sg-user';

const createInitialState = (): SystemState => ({
  batteryPercent: 85, mode: 'Normal',
  powerSavingThreshold: 30, ultraThreshold: 5,
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
      // backfill quantity:1 for any saved appliances that predate this field
      appliances: Array.isArray(parsed.appliances)
        ? parsed.appliances.map((a: Appliance) => ({ quantity: 1, ...a }))
        : INITIAL_APPLIANCES,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      usageHistory: Array.isArray(parsed.usageHistory) ? parsed.usageHistory : [],
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

// ─── Quantity Stepper ──────────────────────────────────────────────────────────

const QuantityStepper = ({ quantity, disabled, onChange }: { quantity: number; disabled?: boolean; onChange: (q: number) => void }) => (
  <div className={`flex items-center gap-1 shrink-0 ${disabled ? 'opacity-30 pointer-events-none' : ''}`}>
    <button
      onClick={() => onChange(Math.max(1, quantity - 1))}
      className="w-5 h-5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-dim)] text-xs font-bold flex items-center justify-center hover:text-white hover:border-[var(--accent)] transition-colors"
    >−</button>
    <span className="text-xs font-mono font-bold w-4 text-center">{quantity}</span>
    <button
      onClick={() => onChange(Math.min(10, quantity + 1))}
      className="w-5 h-5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-dim)] text-xs font-bold flex items-center justify-center hover:text-white hover:border-[var(--accent)] transition-colors"
    >+</button>
  </div>
);

// ─── Arc Battery Gauge ─────────────────────────────────────────────────────────

const ArcGauge = ({ pct }: { pct: number }) => {
  const r = 54, cx = 70, cy = 70;
  const circumference = 2 * Math.PI * r;
  const arcRatio = 0.72;
  const arcLen = circumference * arcRatio;
  const offset = arcLen - (pct / 100) * arcLen;
  const rotate = 90 + (1 - arcRatio) * 180;
  const color = pct > 30 ? 'var(--success)' : pct > 10 ? 'var(--warning)' : 'var(--danger)';
  return (
    <svg width="140" height="110" viewBox="0 0 140 110" className="mx-auto">
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth="11" strokeLinecap="round"
        strokeDasharray={`${arcLen} ${circumference}`} strokeDashoffset={0}
        transform={`rotate(${rotate} ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={`${arcLen} ${circumference}`} strokeDashoffset={offset}
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

const Chip = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
  <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3">
    <div className="text-[0.6rem] text-[var(--text-dim)] uppercase tracking-wider mb-1">{label}</div>
    <div className={`text-base font-bold font-mono leading-none ${accent || 'text-white'}`}>{value}</div>
  </div>
);

const HistoryChart = ({ history }: { history: EnergySample[] }) => {
  const [isMagnified, setIsMagnified] = useState(false);
  const width = 260, height = 120, padLeft = 28, padRight = 5, padTop = 10, padBottom = 15;
  const points = history.length ? history : [{
    id: 'empty', time: '', batteryPercent: 85, activeLoad: 0,
    chargingWatts: 0, netWatts: 0, mode: 'Normal' as const
  }];
  
  const maxLoad = Math.max(500, ...points.map(p => Math.max(p.activeLoad, p.chargingWatts)));
  
  const xFor = (i: number) => padLeft + (i / Math.max(1, points.length - 1)) * (width - padLeft - padRight);
  const yForBattery = (pct: number) => padTop + (1 - pct / 100) * (height - padTop - padBottom);
  const yForLoad = (watts: number) => padTop + (1 - watts / maxLoad) * (height - padTop - padBottom);

  const batteryPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yForBattery(p.batteryPercent).toFixed(1)}`).join(' ');
  const loadPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yForLoad(p.activeLoad).toFixed(1)}`).join(' ');

  const batteryArea = `${batteryPath} L ${xFor(points.length - 1)} ${height - padBottom} L ${padLeft} ${height - padBottom} Z`;
  const loadArea = `${loadPath} L ${xFor(points.length - 1)} ${height - padBottom} L ${padLeft} ${height - padBottom} Z`;

  const ChartSvg = ({ isLarge }: { isLarge?: boolean }) => (
    <svg viewBox={`0 0 ${width} ${height}`} className={`w-full ${isLarge ? 'h-[400px]' : 'h-28'} overflow-visible`}>
      {/* Y-Axis Numerical Labels */}
      <text x={padLeft - 6} y={yForBattery(100) + 3} textAnchor="end" className={`${isLarge ? 'text-[5px]' : 'text-[7px]'} fill-[var(--text-dim)] font-mono`}>100</text>
      <text x={padLeft - 6} y={yForBattery(50) + 3} textAnchor="end" className={`${isLarge ? 'text-[5px]' : 'text-[7px]'} fill-[var(--text-dim)] font-mono`}>50</text>
      <text x={padLeft - 6} y={yForBattery(0) + 3} textAnchor="end" className={`${isLarge ? 'text-[5px]' : 'text-[7px]'} fill-[var(--text-dim)] font-mono`}>0</text>

      {/* Grid lines */}
      {[25, 50, 75].map(v => (
        <line key={v} x1={padLeft} y1={yForBattery(v)} x2={width - padRight} y2={yForBattery(v)} 
              stroke="var(--border)" strokeDasharray="2,2" opacity="0.3" />
      ))}
      
      {/* Baseline */}
      <line x1={padLeft} y1={height - padBottom} x2={width - padRight} y2={height - padBottom} stroke="var(--border)" />
      <line x1={padLeft} y1={padTop} x2={padLeft} y2={height - padBottom} stroke="var(--border)" />

      {/* Load Area & Path */}
      <path d={loadArea} fill="var(--warning)" fillOpacity="0.05" />
      <path d={loadPath} fill="none" stroke="var(--warning)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Battery Area & Path */}
      <path d={batteryArea} fill="var(--success)" fillOpacity="0.1" />
      <path d={batteryPath} fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <>
      <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3 relative group">
        <button onClick={() => setIsMagnified(true)} 
          className="absolute top-2 right-2 p-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--bg)] text-[var(--text-dim)] hover:text-white z-10"
          title="Magnify Chart">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <ChartSvg />
        <div className="flex justify-between text-[0.65rem] text-[var(--text-dim)] mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
            <span>Battery (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
            <span>Load (W)</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMagnified && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-12">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl w-full max-w-6xl overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--border)]">
                <div>
                  <h3 className="font-bold text-base text-white">System Energy Trends</h3>
                  <p className="text-[0.7rem] text-[var(--text-dim)] uppercase tracking-widest mt-0.5">High Resolution Analysis</p>
                </div>
                <button onClick={() => setIsMagnified(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6 text-[var(--text-dim)]" />
                </button>
              </div>
              <div className="p-10 flex-1 flex flex-col gap-8">
                <div className="flex-1 min-h-0">
                  <ChartSvg isLarge />
                </div>
                <div className="flex justify-center gap-12 border-t border-[var(--border)] pt-8">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[var(--success)] shadow-[0_0_10px_var(--success)]" />
                    <span className="text-sm font-medium text-white">Battery Level (%)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[var(--warning)] shadow-[0_0_10px_var(--warning)]" />
                    <span className="text-sm font-medium text-white">Active Load (Watts)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Auth helpers ──────────────────────────────────────────────────────────────

const getAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : undefined;
};

// ─── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [state, setState] = useState<SystemState>(() => createInitialState());
  const [authUser, setAuthUser] = useState<{ id: number; username: string; email: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [newAppliance, setNewAppliance] = useState({ name: '', watts: 0, quantity: 1, isEssential: false });

  // quantity × watts
  const activeLoad = useMemo(() =>
    state.appliances.filter(a => a.isOn && !a.isAutoCut).reduce((s, a) => s + a.watts * (a.quantity ?? 1), 0),
    [state.appliances]);
  const chargingWatts = useMemo(() =>
    state.isChargingEnabled ? state.solarInputWatts + state.gridChargingWatts : 0,
    [state.isChargingEnabled, state.solarInputWatts, state.gridChargingWatts]);
  const netBatteryWatts = useMemo(() => activeLoad - chargingWatts, [activeLoad, chargingWatts]);
  const estimatedRuntime = useMemo(() => {
    if (netBatteryWatts <= 0) return 99.9;
    return ((state.batteryPercent / 100) * BATTERY_TOTAL_WH) / netBatteryWatts;
  }, [state.batteryPercent, netBatteryWatts]);
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
    setState(prev => updater(prev));
  };

  const handleModeChange = (newMode: SystemState['mode']) => {
    updateState(prev => ({
      ...prev, mode: newMode,
      appliances: prev.appliances.map(a => ({
        ...a,
        isAutoCut: newMode === 'Ultra' ? !a.isEssential : (newMode === 'Power Saving' ? (!a.isEssential && a.watts >= 200) : false)
      }))
    }));
    addNotification(`Mode set to ${newMode}.`);
  };

  const toggleAppliance = (id: string, isRemote = false) => {
    const app = state.appliances.find(a => a.id === id);
    updateState(prev => ({ ...prev, appliances: prev.appliances.map(a => a.id === id ? { ...a, isOn: !a.isOn } : a) }));
    if (app) addNotification(`${isRemote ? '[Remote] ' : ''}${app.name} → ${!app.isOn ? 'ON' : 'OFF'}`);
  };

  const updateQuantity = (id: string, quantity: number) => {
    updateState(prev => ({ ...prev, appliances: prev.appliances.map(a => a.id === id ? { ...a, quantity } : a) }));
  };

  const formatRuntime = () => {
    if (netBatteryWatts <= 0) return 'Charging';
    return `${Math.floor(estimatedRuntime)}h ${Math.round((estimatedRuntime % 1) * 60)}m`;
  };

  const sendEmailAlert = async (reason = 'Manual SmartGrid alert') => {
    if (!state.isEmailAlertsEnabled || !state.alertEmail.trim()) {
      addNotification('Enable SMTP email alerts and add a recipient first.', 'warning'); return;
    }
    try {
      const response = await fetch('/api/send-alert', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: state.alertEmail.trim(), reason,
          batteryPercent: state.batteryPercent, mode: state.mode,
          activeLoad, chargingWatts, netWatts: netBatteryWatts,
          estimatedRuntime: formatRuntime(), timestamp: new Date().toLocaleString(),
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

  useEffect(() => {
    const { batteryPercent, powerSavingThreshold, ultraThreshold, mode } = state;
    let target = mode;
    if (batteryPercent <= ultraThreshold) target = 'Ultra';
    else if (batteryPercent <= powerSavingThreshold) target = 'Power Saving';
    if (target !== mode) {
      updateState(prev => ({
        ...prev, mode: target,
        appliances: prev.appliances.map(a => ({
          ...a,
          isAutoCut: target === 'Ultra' ? !a.isEssential : (target === 'Power Saving' ? (!a.isEssential && a.watts >= 200) : false)
        }))
      }));
      addNotification(`Auto-switched to ${target} mode.`, 'warning');
    }
  }, [state.batteryPercent]);

  useEffect(() => {
    if (!state.isSimulationRunning) return;
    const interval = setInterval(() => {
      updateState(prev => {
        const inputWatts = prev.isChargingEnabled ? prev.solarInputWatts + prev.gridChargingWatts : 0;
        const netWatts = activeLoad - inputWatts;
        const delta = (netWatts / BATTERY_TOTAL_WH) * 100 * (SIM_TICK_MS / 3_600_000);
        const nextBattery = Math.min(100, Math.max(0, prev.batteryPercent - delta));
        return {
          ...prev, batteryPercent: nextBattery,
          isSimulationRunning: nextBattery <= 0 && netWatts > 0 ? false : prev.isSimulationRunning,
          usageHistory: appendHistory(prev.usageHistory, {
            id: Date.now().toString(), time: new Date().toLocaleTimeString(),
            batteryPercent: nextBattery, activeLoad, chargingWatts: inputWatts, netWatts, mode: prev.mode
          })
        };
      });
    }, SIM_TICK_MS);
    return () => clearInterval(interval);
  }, [state.isSimulationRunning, activeLoad]);

  // ── Auth check on mount ──
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) { setAuthChecked(true); return; }
    fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        setAuthUser(data.user);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
        // Load saved state from DB
        return fetch('/api/state/load', { headers: { 'Authorization': `Bearer ${token}` } });
      })
      .then(r => r?.json())
      .then(data => {
        if (data?.state) setState(hydrateState(JSON.stringify(data.state)));
      })
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        setAuthUser(null);
      })
      .finally(() => setAuthChecked(true));
  }, []);

  // ── Periodic state save to API ──
  useEffect(() => {
    if (!authUser) return;
    const interval = setInterval(() => {
      const headers = getAuthHeaders();
      if (!headers) return;
      fetch('/api/state/save', { method: 'POST', headers, body: JSON.stringify(state) }).catch(() => {});
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [authUser, state]);

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
        config: { systemInstruction: `SmartGrid AI Assistant. 
Battery: ${state.batteryPercent.toFixed(1)}%, Mode: ${state.mode}, Load: ${activeLoad}W, Runtime: ${estimatedRuntime.toFixed(1)}h.
Respond with short, concise, and helpful bullet points. Use bold for emphasis and clear headers. Prioritize urgency if battery is low.` },
        contents: question
      });
      setChatMessages(prev => [...prev, { role: 'assistant', text: result.text || 'No response.' }]);
    } catch (e: any) {
      let msg = 'The AI is currently busy or unavailable. Please try again in a moment.';
      try {
        const err = JSON.parse(e.message);
        if (err.error?.code === 503) msg = 'Model is at capacity. Retrying usually helps!';
        else if (err.error?.code === 429) msg = 'Rate limit reached. Please wait a bit.';
        else msg = `Connection Error: ${err.error?.message || e.message}`;
      } catch {
        msg = `Error: ${e.message || 'Unknown connection issue'}`;
      }
      setChatMessages(prev => [...prev, { role: 'assistant', text: msg }]);
    } finally { setIsTyping(false); }
  }

  const handleAuth = useCallback((token: string, user: { id: number; username: string; email: string }) => {
    setAuthUser(user);
    // Load state from server after login
    fetch('/api/state/load', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data?.state) setState(hydrateState(JSON.stringify(data.state)));
      })
      .catch(() => {});
  }, []);

  const handleLogout = useCallback(() => {
    // Save state one last time before logout
    const headers = getAuthHeaders();
    if (headers) {
      fetch('/api/state/save', { method: 'POST', headers, body: JSON.stringify(state) }).catch(() => {});
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setAuthUser(null);
    setState(createInitialState());
  }, [state]);

  const tabs = ['Overview', 'Control', 'Remote Control', 'AI Assistant', 'About'];

  // ── Auth gate ──
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[var(--text-dim)] font-mono uppercase tracking-wider">Loading SmartGrid…</span>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <LoginPage onAuth={handleAuth} />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <nav className="h-14 border-b border-[var(--border)] flex items-center px-5 justify-between bg-[var(--bg)] shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent)] to-[#1e40af] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[var(--accent)]/20 border border-white/10">
            <Zap className="text-white w-4.5 h-4.5 fill-white/20" />
          </div>
          <span className="text-base font-black tracking-tighter text-white">SMARTGRID</span>
        </div>
        <div className="flex gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)]">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-[0.75rem] font-medium transition-all whitespace-nowrap ${
                activeTab === tab ? 'text-white bg-[var(--bg)] border border-[var(--border)] shadow-sm' : 'text-[var(--text-dim)] hover:text-white'
              }`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full text-[0.6rem] font-mono text-[var(--success)] font-bold uppercase tracking-tight">
            <span className={`w-1.5 h-1.5 rounded-full bg-[var(--success)] ${state.isSimulationRunning ? 'animate-pulse' : ''}`} />
            Telemetry Active — {state.usageHistory.length} Samples
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full">
            <UserCircle className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-[0.7rem] font-semibold text-white">{authUser.username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full text-[0.7rem] font-semibold text-[var(--text-dim)] hover:text-[var(--danger)] hover:border-red-500/30 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </nav>

      <main className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="h-full">
            {activeTab === 'Overview' && (
              <OverviewTab state={state} activeLoad={activeLoad} runtime={estimatedRuntime}
                toggleAppliance={toggleAppliance} updateQuantity={updateQuantity}
                handleModeChange={handleModeChange} updateState={updateState} />
            )}
            {activeTab === 'Control' && (
              <ControlTab state={state} updateState={updateState}
                handleModeChange={handleModeChange} addNotification={addNotification}
                sendEmailAlert={sendEmailAlert} simulatedKwh={simulatedKwh} estimatedCost={estimatedCost}
                newAppliance={newAppliance} setNewAppliance={setNewAppliance} />
            )}
            {activeTab === 'Remote Control' && (
              <RemoteTab state={state} handleModeChange={handleModeChange}
                toggleAppliance={toggleAppliance} updateQuantity={updateQuantity} />
            )}
            {activeTab === 'AI Assistant' && (
              <AITab messages={chatMessages} isTyping={isTyping} onAsk={askAI} />
            )}
            {activeTab === 'About' && <AboutTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="h-0.5 w-full bg-[var(--border)] shrink-0">
        <motion.div className="h-full" animate={{ width: `${state.batteryPercent}%` }}
          style={{ backgroundColor: state.batteryPercent > 30 ? 'var(--success)' : state.batteryPercent > 10 ? 'var(--warning)' : 'var(--danger)' }}
          transition={{ duration: 0.8 }} />
      </div>
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ state, activeLoad, runtime, toggleAppliance, updateQuantity, handleModeChange, updateState }: any) {
  const wattsSaved = state.appliances.filter((a: Appliance) => !a.isOn).reduce((s: number, a: Appliance) => s + a.watts * (a.quantity ?? 1), 0);
  const runtimeH = Math.floor(runtime);
  const runtimeM = Math.round((runtime % 1) * 60);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editWatts, setEditWatts] = useState('');
  const [editEssential, setEditEssential] = useState(false);

  const startEdit = (app: Appliance) => {
    setEditingId(app.id);
    setEditName(app.name);
    setEditWatts(String(app.watts));
    setEditEssential(app.isEssential);
  };

  const commitEdit = () => {
    if (!editingId) return;
    const w = parseInt(editWatts, 10);
    if (!editName.trim() || isNaN(w) || w <= 0) { setEditingId(null); return; }
    updateState((p: any) => ({
      ...p,
      appliances: p.appliances.map((a: Appliance) =>
        a.id === editingId ? { ...a, name: editName.trim(), watts: w, isEssential: editEssential } : a
      )
    }));
    setEditingId(null);
  };

  const removeAppliance = (id: string) => {
    updateState((p: any) => ({ ...p, appliances: p.appliances.filter((a: Appliance) => a.id !== id) }));
  };

  return (
    <div className="flex h-full gap-3 p-4 overflow-hidden">

      <aside className="w-[248px] shrink-0 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
        <SideCard title="Battery"
          badge={<span className="bg-blue-500/10 text-[var(--accent)] px-2 py-0.5 rounded text-[0.6rem] font-bold border border-blue-500/20">{state.mode.toUpperCase()}</span>}>
          <div className="p-4 flex flex-col items-center gap-3">
            <ArcGauge pct={state.batteryPercent} />
            <div className="w-full"><ModeSwitcher mode={state.mode} onChange={handleModeChange} /></div>
            <div className="w-full grid grid-cols-2 gap-2">
              <Chip label="Runtime" value={`${runtimeH}h ${runtimeM}m`} />
              <Chip label="Load" value={`${activeLoad}W`} accent="text-[var(--accent)]" />
              <Chip label="Saved" value={`${wattsSaved}W`} accent="text-[var(--success)]" />
              <Chip label="Active" value={`${state.appliances.filter((a: Appliance) => a.isOn && !a.isAutoCut).length}`} />
            </div>
          </div>
        </SideCard>

        <button
          onClick={() => updateState((p: any) => ({ ...p, isSimulationRunning: !p.isSimulationRunning }))}
          className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
            state.isSimulationRunning
              ? 'bg-red-500/10 text-[var(--danger)] border-red-500/25 hover:bg-red-500/20'
              : 'bg-green-500/10 text-[var(--success)] border-green-500/25 hover:bg-green-500/20'
          }`}>
          {state.isSimulationRunning ? '⏹ Stop Simulation' : '▶ Start Simulation'}
        </button>

        <SideCard title="AI Assistant Status">
          <div className="p-4 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${state.batteryPercent > 20 ? 'bg-blue-500/10' : 'bg-red-500/10'}`}>
                <Activity className={`w-5 h-5 ${state.batteryPercent > 20 ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded border ${
                    state.mode === 'Normal' ? 'bg-green-500/10 text-[var(--success)] border-green-500/20' : 
                    state.mode === 'Power Saving' ? 'bg-yellow-500/10 text-[var(--warning)] border-yellow-500/20' : 
                    'bg-red-500/10 text-[var(--danger)] border-red-500/20'
                  }`}>
                    {state.mode.toUpperCase()}
                  </span>
                </div>
                <p className="text-[0.7rem] text-[var(--text-dim)] leading-relaxed">
                  Battery at {Math.round(state.batteryPercent)}% with {activeLoad}W load. {
                    state.batteryPercent < 10 ? 'Critical depletion detected.' : 
                    state.mode !== 'Normal' ? 'Optimization active.' : 'System performing nominally.'
                  }
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[0.6rem] text-[var(--text-dim)] uppercase font-bold tracking-wider">
                <span>Quick Insight</span>
                <span className="text-[var(--accent)]">Live</span>
              </div>
              <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-[0.65rem] leading-relaxed text-white font-medium italic">
                "{state.batteryPercent < 20 ? 'Immediate load shedding recommended to extend runtime.' : 
                  activeLoad > 1000 ? 'High load detected. Consider turning off heavy appliances.' :
                  'System currently optimized for existing battery levels.'}"
              </div>
            </div>
          </div>
        </SideCard>
      </aside>

      {/* CENTER: Appliance List with quantity steppers */}
      <section className="flex-1 min-w-0 flex flex-col gap-3 overflow-hidden">
        <SideCard title="Active Appliances"
          badge={
            <div className="flex items-center gap-2">
              <span className="text-[0.6rem] text-[var(--text-dim)] font-semibold">{state.appliances.filter((a: Appliance) => a.isOn && !a.isAutoCut).length} / {state.appliances.length} ON</span>
            </div>
          }
          className="flex-1">
          <div className="overflow-y-auto custom-scrollbar flex-1 p-3 flex flex-col gap-1.5">
            {state.appliances.map((app: Appliance) => {
              const qty = app.quantity ?? 1;
              const totalW = app.watts * qty;
              return (
                <div key={app.id}
                  className="group flex items-center justify-between px-3 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl hover:border-[var(--border-hover,#3f3f46)] transition-colors">

                  {editingId === app.id ? (
                    /* ── Edit Mode ── */
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${app.isOn && !app.isAutoCut ? 'bg-[var(--success)]' : 'bg-[var(--border)]'}`} />
                      <input
                        autoFocus
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                        className="bg-[var(--surface)] border border-[var(--accent)] rounded-md px-2 py-0.5 text-[0.8rem] w-28 focus:outline-none"
                      />
                      <input
                        type="number"
                        value={editWatts}
                        onChange={e => setEditWatts(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                        className="bg-[var(--surface)] border border-[var(--accent)] rounded-md px-2 py-0.5 text-[0.8rem] w-16 focus:outline-none"
                      />
                      <select
                        value={editEssential ? 't' : 'f'}
                        onChange={e => setEditEssential(e.target.value === 't')}
                        className="bg-[var(--surface)] border border-[var(--border)] rounded-md px-1.5 py-0.5 text-[0.7rem] focus:outline-none"
                      >
                        <option value="f">Regular</option>
                        <option value="t">Essential</option>
                      </select>
                      <button onClick={commitEdit} className="text-[var(--success)] text-[0.75rem] font-bold px-2 hover:opacity-80">✓</button>
                      <button onClick={() => setEditingId(null)} className="text-[var(--text-dim)] text-[0.75rem] px-1 hover:opacity-80">✕</button>
                    </div>
                  ) : (
                    /* ── Display Mode ── */
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${app.isOn && !app.isAutoCut ? 'bg-[var(--success)]' : 'bg-[var(--border)]'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[0.825rem] font-medium truncate">{app.name}</div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startEdit(app)}
                            title="Click to edit"
                            className="text-[0.7rem] text-[var(--accent)] bg-blue-500/8 border border-blue-500/15 px-1.5 py-0 rounded hover:bg-blue-500/20 transition-colors font-mono"
                          >
                            {qty > 1 ? `${totalW}W (${app.watts}W×${qty})` : `${app.watts}W`} ✎
                          </button>
                          <span className="text-[0.65rem] text-[var(--text-dim)]">· {app.isEssential ? 'Essential' : 'Regular'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 shrink-0 ml-1">
                    {app.isAutoCut ? (
                      <span className="text-[0.6rem] font-bold text-[var(--danger)] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">CUT</span>
                    ) : editingId !== app.id ? (
                      <QuantityStepper quantity={qty} onChange={q => updateQuantity(app.id, q)} />
                    ) : null}
                    {editingId !== app.id && (
                      <button
                        onClick={() => removeAppliance(app.id)}
                        title="Remove appliance"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--danger)] text-[0.75rem] w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/10"
                      >✕</button>
                    )}
                    <Toggle isOn={app.isOn && !app.isAutoCut} disabled={app.isAutoCut} onClick={() => toggleAppliance(app.id)} />
                  </div>
                </div>
              );
            })}
          </div>
        </SideCard>
      </section>

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
    const csv = [headers, ...rows].map(row => row.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `smartgrid-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click(); URL.revokeObjectURL(url);
    addNotification('Energy CSV report exported.', 'success');
  };

  const registerDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppliance.name || newAppliance.watts <= 0) return;
    updateState((p: any) => ({
      ...p, appliances: [...p.appliances, {
        id: Date.now().toString(), ...newAppliance,
        quantity: Math.max(1, newAppliance.quantity || 1),
        isOn: false, isAutoCut: false
      }]
    }));
    addNotification(`Registered: ${newAppliance.name} ×${newAppliance.quantity || 1}`);
    setNewAppliance({ name: '', watts: 0, quantity: 1, isEssential: false });
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

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
              <div className="text-[0.65rem] text-[var(--text-dim)] uppercase tracking-wider mb-2 font-semibold">System Mode</div>
              <ModeSwitcher mode={state.mode} onChange={handleModeChange} />
            </div>
          </div>
        </SideCard>

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
          </div>
        </SideCard>

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

        {/* Device Registration — now with Quantity field */}
        <SideCard title="Device Registration" className="xl:col-span-2">
          <div className="p-5">
            <form onSubmit={registerDevice} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="sm:col-span-1 flex flex-col gap-1.5">
                <label className="text-[0.6rem] text-[var(--text-dim)] uppercase font-semibold">Name</label>
                <input type="text" value={newAppliance.name}
                  onChange={e => setNewAppliance({ ...newAppliance, name: e.target.value })}
                  className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm w-full"
                  placeholder="e.g. Microwave" />
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
                <input type="number" min="1" max="10" value={newAppliance.quantity || 1}
                  onChange={e => setNewAppliance({ ...newAppliance, quantity: Math.max(1, Math.min(10, Number(e.target.value))) })}
                  className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm w-full" />
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

function RemoteTab({ state, handleModeChange, toggleAppliance, updateQuantity }: any) {
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
              {state.appliances.map((app: Appliance) => {
                const qty = app.quantity ?? 1;
                return (
                  <div key={app.id} className="flex items-center justify-between bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3">
                    <div>
                      <div className="text-sm font-medium">{app.name}</div>
                      <div className="text-[0.7rem] text-[var(--text-dim)]">
                        {qty > 1 ? `${app.watts * qty}W (×${qty})` : `${app.watts}W`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <QuantityStepper quantity={qty} disabled={app.isAutoCut} onChange={q => updateQuantity(app.id, q)} />
                      <Toggle isOn={app.isOn && !app.isAutoCut} disabled={app.isAutoCut} onClick={() => toggleAppliance(app.id, true)} />
                    </div>
                  </div>
                );
              })}
            </div>

            <ModeSwitcher mode={state.mode} onChange={handleModeChange} />
          </div>
        </SideCard>
      </div>
    </div>
  );
}

// ─── AI Tab ────────────────────────────────────────────────────────────────────

const MarkdownText = ({ text }: { text: string }) => {
  const parseBold = (t: string) => {
    // Match ***bold-italic***, **bold**, or *italic*
    const parts = t.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, pi) => {
      if (part.startsWith('***') && part.endsWith('***')) return <strong key={pi} className="font-black text-white italic">{part.slice(3, -3)}</strong>;
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={pi} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={pi} className="italic opacity-90">{part.slice(1, -1)}</em>;
      return part;
    });
  };

  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        let content: any = line;
        
        // Handle Headers (###)
        if (line.startsWith('### ')) {
          content = <div key={i} className="text-[0.95rem] font-bold mt-4 mb-1.5 text-[var(--accent)]">{parseBold(line.replace('### ', ''))}</div>;
        } 
        // Handle Bullets (* )
        else if (line.trim().startsWith('* ')) {
          content = (
            <div key={i} className="flex gap-2 ml-1 my-0.5">
              <span className="text-[var(--accent)] mt-1">•</span>
              <span className="flex-1">{parseBold(line.trim().slice(2))}</span>
            </div>
          );
        }
        // Handle Regular lines
        else {
          content = (
            <div key={i} className={line.trim() === '' ? 'h-2' : 'my-0.5'}>
              {parseBold(line)}
            </div>
          );
        }
        
        return content;
      })}
    </>
  );
};

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
              }`}>
                {m.role === 'user' ? m.text : <MarkdownText text={m.text} />}
              </div>
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
            <h1 className="text-3xl font-black mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">SmartGrid</h1>
            <div className="space-y-4">
              <p className="text-[var(--text-dim)] text-sm leading-relaxed">
                SmartGrid is a high-performance intelligent energy management system designed to empower homeowners with complete energy independence. 
                By combining real-time telemetry with predictive load-shedding algorithms, it ensures that your critical appliances stay powered during outages while optimizing for battery longevity and cost efficiency.
              </p>
              <p className="text-[var(--text-dim)] text-sm leading-relaxed border-l-2 border-[var(--accent)] pl-4 italic">
                "Our mission is to bridge the gap between complex hardware systems and intuitive user-centric control, making decentralized energy management accessible to everyone."
              </p>
              <p className="text-[var(--text-dim)] text-sm leading-relaxed">
                This platform serves as a central nervous system for your home power, integrating everything from solar generation and grid charging to remote appliance control and AI-driven efficiency reports. 
                Built for stability and speed, it provides a seamless transition from traditional power monitoring to active, intelligent energy conservation.
              </p>
            </div>
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
                System architecture designed for ESP32 / Sonoff integration. Live prototype validated at SmartGrid Lab environment. MQTT-ready gateway for real relay boards.
              </p>
            </div>
          </SideCard>
        <SideCard title="About the Developer">
          <div className="p-4 flex flex-col gap-4">
            <p className="text-sm text-[var(--text-dim)] leading-relaxed">
              I am Shreyansh, a developer passionate about building intelligent solutions for everyday problems. 
              SmartGrid was born out of the need to visualize and optimize home energy usage during power outages. 
              My goal is to bridge the gap between this simulation and real-time hardware integration like ESP32 and MQTT.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="https://github.com/ShreyanshFS/SmartGrid-Intelligent-Home-Power-System" target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 bg-[#24292e] text-white px-4 py-2 rounded-xl text-[0.75rem] font-bold hover:bg-[#2f363d] transition-colors border border-white/10">
                <Github className="w-4 h-4" /> View on GitHub
              </a>
              <a href="mailto:Shreyanshdwivedi15@gmail.com"
                 className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-xl text-[0.75rem] font-bold hover:opacity-90 transition-opacity">
                <Send className="w-4 h-4" /> Email Me
              </a>
            </div>
          </div>
        </SideCard>

        <SideCard title="Developer Contact">
          <div className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-3 bg-[var(--bg)] border border-[var(--border)] p-3 rounded-xl max-w-sm">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white shrink-0">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[0.6rem] text-[var(--text-dim)] uppercase font-bold tracking-wider">Direct Reach</div>
                <div className="text-[0.8rem] font-medium text-white">Shreyanshdwivedi15@gmail.com</div>
              </div>
            </div>
          </div>
        </SideCard>
      </div>
        <div className="text-center py-8 border-t border-[var(--border)] opacity-40">
          <p className="text-[0.6rem] font-mono uppercase tracking-[0.2em]">Home Power Control System </p>
          <h2 className="text-sm font-black tracking-tight mt-1">SMARTGRID</h2>
        </div>
      </div>
    </div>
  );
}
