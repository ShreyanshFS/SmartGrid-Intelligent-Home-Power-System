import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Battery, Zap, Plus, Trash2, Send, RefreshCcw, Activity, Smartphone, Settings, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

interface Appliance {
  id: string;
  name: string;
  watts: number;
  isEssential: boolean;
  isOn: boolean;
  isAutoCut: boolean;
}

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: string;
}

interface SystemState {
  batteryPercent: number;
  mode: 'Normal' | 'Power Saving' | 'Ultra';
  powerSavingThreshold: number;
  ultraThreshold: number;
  isSimulationRunning: boolean;
  appliances: Appliance[];
  notifications: Notification[];
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

const BATTERY_TOTAL_WH = 1000, SYNC_KEY = 'sg-state', SYNC_INTERVAL_MS = 3000, SIM_TICK_MS = 4000;

const BentoCard = ({ title, children, className = '', rightElement }: any) => (
  <div className={`bento-card flex flex-col min-h-0 ${className}`}>
    <div className="flex justify-between items-center mb-5 shrink-0">
      <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.05em] text-[var(--text-dim)]">{title}</h3>
      {rightElement}
    </div>
    <div className="flex-1 flex flex-col min-h-0">
      {children}
    </div>
  </div>
);

const Toggle = ({ isOn, disabled, onClick }: { isOn: boolean; disabled?: boolean; onClick: () => void }) => (
  <button 
    disabled={disabled}
    onClick={onClick}
    className={`w-10 h-5 rounded-full relative transition-all duration-300 ${
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

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [state, setState] = useState<SystemState>(() => {
    const saved = localStorage.getItem(SYNC_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error("Failed to parse saved state", e); }
    }
    return {
      batteryPercent: 85,
      mode: 'Normal',
      powerSavingThreshold: 30,
      ultraThreshold: 5,
      isSimulationRunning: false,
      appliances: INITIAL_APPLIANCES,
      notifications: [{
        id: Date.now().toString(),
        type: 'info',
        message: 'SmartGrid System Initiated.',
        timestamp: new Date().toLocaleTimeString()
      }]
    };
  });

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [newAppliance, setNewAppliance] = useState({ name: '', watts: 0, isEssential: false });

  const activeLoad = useMemo(() => state.appliances.filter(a => a.isOn && !a.isAutoCut).reduce((sum, a) => sum + a.watts, 0), [state.appliances]);
  const estimatedRuntime = useMemo(() => {
    if (activeLoad === 0) return 99.9;
    const remainingWh = (state.batteryPercent / 100) * BATTERY_TOTAL_WH;
    return remainingWh / activeLoad;
  }, [state.batteryPercent, activeLoad]);
  const wattsSaved = useMemo(() => {
    const potentialLoad = state.appliances.filter(a => a.isOn).reduce((sum, a) => sum + a.watts, 0);
    return potentialLoad - activeLoad;
  }, [state.appliances, activeLoad]);

  const addNotification = (message: string, type: Notification['type'] = 'info') => {
    setState(prev => ({
      ...prev,
      notifications: [{ id: Date.now().toString(), type, message, timestamp: new Date().toLocaleTimeString() }, ...prev.notifications].slice(0, 50)
    }));
  };

  const updateState = (updater: (prev: SystemState) => SystemState) => {
    setState(prev => {
      const next = updater(prev);
      localStorage.setItem(SYNC_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleModeChange = (newMode: SystemState['mode']) => {
    updateState(prev => ({
      ...prev,
      mode: newMode,
      appliances: prev.appliances.map(a => {
        if (newMode === 'Power Saving') return { ...a, isAutoCut: !a.isEssential };
        if (newMode === 'Ultra') return { ...a, isAutoCut: !a.isEssential };
        return { ...a, isAutoCut: false };
      })
    }));
    addNotification(`System mode manually set to ${newMode}.`);
  };

  const toggleAppliance = (id: string, isRemote = false) => {
    updateState((prev: SystemState) => ({
      ...prev,
      appliances: prev.appliances.map(a => a.id === id ? { ...a, isOn: !a.isOn } : a)
    }));
    const app = state.appliances.find(a => a.id === id);
    addNotification(`${isRemote ? '[Remote] ' : ''}${app?.name} switched ${!app?.isOn ? 'ON' : 'OFF'}.`);
  };

  useEffect(() => {
    const { batteryPercent, powerSavingThreshold, ultraThreshold, mode } = state;
    let targetMode = mode;
    if (batteryPercent <= ultraThreshold) targetMode = 'Ultra';
    else if (batteryPercent <= powerSavingThreshold) targetMode = 'Power Saving';

    if (targetMode !== mode) {
      updateState(prev => ({
        ...prev,
        mode: targetMode,
        appliances: prev.appliances.map(a => ({ ...a, isAutoCut: (targetMode !== 'Normal' && !a.isEssential) }))
      }));
      addNotification(`Mode auto-switched to ${targetMode} (Battery critical).`, 'warning');
    }
  }, [state.batteryPercent]);

  useEffect(() => {
    if (!state.isSimulationRunning) return;
    const interval = setInterval(() => {
      updateState(prev => {
        if (prev.batteryPercent <= 0) return { ...prev, batteryPercent: 0, isSimulationRunning: false };
        const drain = (activeLoad / 1000) * 100 * (SIM_TICK_MS / 3600000);
        return { ...prev, batteryPercent: Math.max(0, prev.batteryPercent - drain) };
      });
    }, SIM_TICK_MS);
    return () => clearInterval(interval);
  }, [state.isSimulationRunning, activeLoad]);

  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem(SYNC_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setState(prev => JSON.stringify(prev) !== JSON.stringify(parsed) ? parsed : prev);
        } catch (e) {}
      }
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  async function askAI(question: string) {
    if (!question) return;
    setChatMessages(prev => [...prev, { role: 'user', text: question }]);
    setIsTyping(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: "AI not configured. Set VITE_GEMINI_API_KEY in .env.local" }]);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are the SmartGrid AI Assistant.
            Status: ${state.batteryPercent.toFixed(1)}% battery, ${state.mode} mode, ${activeLoad}W load.
            Runtime: ${estimatedRuntime.toFixed(1)}h.
            Apps: ${state.appliances.map(a => `${a.name}(${a.isOn && !a.isAutoCut ? 'ON' : 'OFF'})`).join(', ')}.`
        },
        contents: question
      });
      setChatMessages(prev => [...prev, { role: 'assistant', text: result.text || "No response." }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: `Error: ${(e as any).message || 'Failed to connect to Gemini.'}` }]);
    } finally { setIsTyping(false); }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Nav-bar */}
      <nav className="h-16 border-b border-[var(--border)] flex items-center px-6 justify-between bg-[var(--bg)] shrink-0">
        <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center">
             <Zap className="text-white w-5 h-5 fill-white" />
          </div>
          SmartGrid
        </div>
        
        <div className="flex gap-2 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)]">
          {['Overview', 'Control', 'Remote Control', 'AI Assistant', 'About'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-[0.825rem] font-medium transition-all ${
                activeTab === tab ? 'text-[var(--text)] bg-[var(--bg)] border border-[var(--border)] shadow-sm' : 'text-[var(--text-dim)] hover:text-[var(--text)]'
              }`}
            >
              {tab.replace(' Control', '').replace(' Assistant', '')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[0.7rem] font-mono text-[var(--success)] font-medium">
          <div className={`w-1.5 h-1.5 rounded-full bg-[var(--success)] ${state.isSimulationRunning ? 'animate-pulse' : ''}`} />
          LIVE SYNC — 3S
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 min-h-0 overflow-hidden p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="h-full min-h-0"
          >
            {activeTab === 'Overview' && <OverviewTab state={state} activeLoad={activeLoad} runtime={estimatedRuntime} saved={wattsSaved} toggleAppliance={toggleAppliance} />}
            {activeTab === 'Control' && <ControlTab state={state} updateState={updateState} handleModeChange={handleModeChange} addNotification={addNotification} newAppliance={newAppliance} setNewAppliance={setNewAppliance} />}
            {activeTab === 'Remote Control' && <RemoteTab state={state} handleModeChange={handleModeChange} toggleAppliance={toggleAppliance} />}
            {activeTab === 'AI Assistant' && <AITab messages={chatMessages} isTyping={isTyping} onAsk={askAI} />}
            {activeTab === 'About' && <AboutTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Battery Status Line */}
      <div className="h-0.5 w-full bg-[var(--border)]">
        <motion.div 
          className="h-full transition-all"
          style={{ 
            width: `${state.batteryPercent}%`, 
            backgroundColor: state.batteryPercent > 30 ? 'var(--success)' : state.batteryPercent > 10 ? 'var(--warning)' : 'var(--danger)' 
          }}
        />
      </div>
    </div>
  );
}

// --- Tab Implementations ---

function OverviewTab({ state, activeLoad, runtime, saved, toggleAppliance }: any) {
  const getBatColor = (p: number) => {
    if (p > 30) return 'text-[var(--success)]';
    if (p > 10) return 'text-[var(--warning)]';
    return 'text-[var(--danger)]';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_320px] auto-rows-max md:auto-rows-[1fr_auto] gap-4 h-full min-h-0 content-start">
      {/* Battery Status Card */}
      <BentoCard 
        title="Battery Status" 
        className="md:row-span-2 flex flex-col min-h-0"
        rightElement={<span className="bg-blue-500/10 text-[var(--accent)] px-2 py-0.5 rounded text-[0.65rem] font-bold border border-blue-500/20">{state.mode.toUpperCase()} MODE</span>}
      >
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4">
           <div className={`text-[4.5rem] font-mono font-bold leading-none ${getBatColor(state.batteryPercent)}`}>
             {state.batteryPercent.toFixed(0)}%
           </div>
           <div className="w-full h-3 bg-[var(--bg)] border border-[var(--border)] rounded-full overflow-hidden">
             <motion.div 
               className="h-full"
               initial={{ width: 0 }}
               animate={{ width: `${state.batteryPercent}%` }}
               style={{ backgroundColor: state.batteryPercent > 30 ? 'var(--success)' : state.batteryPercent > 10 ? 'var(--warning)' : 'var(--danger)' }}
             />
           </div>
           <p className="text-[0.8rem] text-[var(--text-dim)]">Operating at optimal efficiency</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-auto">
          {[
            { label: 'RUNTIME', value: `${Math.floor(runtime)}h ${Math.round((runtime % 1) * 60)}m` },
            { label: 'LOAD', value: `${activeLoad}W` },
            { label: 'SAVED', value: `${saved}W` },
            { label: 'DEVICES', value: `${state.appliances.filter((a:any) => a.isOn && !a.isAutoCut).length} ON` },
          ].map((s, i) => (
            <div key={i} className="inner-card p-3">
              <div className="text-[0.6rem] text-[var(--text-dim)] mb-1">{s.label}</div>
              <div className="text-[1.1rem] font-mono font-semibold">{s.value}</div>
            </div>
          ))}
        </div>
      </BentoCard>

      {/* Appliances Card */}
      <BentoCard title="Active Appliances" className="md:row-span-2" rightElement={<span className="text-[0.65rem] font-bold text-[var(--text-dim)]">PRIORITY: ESSENTIAL</span>}>
        <div className="flex-1 min-h-0 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {state.appliances.map((app: Appliance) => (
            <div key={app.id} className="inner-card flex items-center justify-between py-3">
              <div className="flex flex-col">
                <span className="text-[0.825rem] font-medium">{app.name}</span>
                <span className="text-[0.7rem] text-[var(--text-dim)]">{app.watts}W • {app.isEssential ? 'Essential' : 'Regular'}</span>
              </div>
              <div className="flex items-center gap-4">
                 {app.isAutoCut && <span className="text-[0.6rem] font-bold text-[var(--danger)]">CUT</span>}
                 <Toggle 
                   isOn={app.isOn && !app.isAutoCut} 
                   disabled={app.isAutoCut} 
                   onClick={() => toggleAppliance(app.id)} 
                 />
              </div>
            </div>
          ))}
        </div>
      </BentoCard>

      {/* AI Mini Card */}
      <BentoCard title="AI Assistant" className="min-h-0">
        <div className="flex flex-col gap-3">
           <div className="inner-card text-[0.75rem] leading-relaxed italic opacity-80">
             Grid battery is {state.batteryPercent.toFixed(0)}%. No critical load detected. Manual override enabled.
           </div>
           <div className="flex flex-wrap gap-2 mt-auto">
             {['Overview', 'Usage', 'Tips'].map(btn => (
                <button key={btn} className="bg-[var(--bg)] border border-[var(--border)] px-3 py-1.5 rounded-md text-[0.65rem] text-[var(--text-dim)] hover:text-white transition-colors">{btn}</button>
             ))}
           </div>
        </div>
      </BentoCard>

      {/* Activity Log Card */}
      <BentoCard title="Activity Log">
         <div className="space-y-3 pr-1 text-[0.75rem]">
            {state.notifications.slice(0, 10).map((n: Notification) => (
               <div key={n.id} className="flex gap-3 border-l-2 border-[var(--accent)] pl-3 py-0.5">
                 <span className="font-mono text-[var(--text-dim)] shrink-0">{n.timestamp}</span>
                 <span className="opacity-90">{n.message}</span>
               </div>
            ))}
         </div>
      </BentoCard>
    </div>
  );
}

function ControlTab({ state, updateState, handleModeChange, addNotification, newAppliance, setNewAppliance }: any) {
  const toggleSimulation = () => {
    updateState((prev: SystemState) => ({ ...prev, isSimulationRunning: !prev.isSimulationRunning }));
    addNotification(`Power simulation ${!state.isSimulationRunning ? 'STARTED' : 'STOPPED'}.`);
  };

  const registerDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppliance.name || newAppliance.watts <= 0) return;
    updateState((p: any) => ({
      ...p,
      appliances: [...p.appliances, { id: Date.now().toString(), ...newAppliance, isOn: false, isAutoCut: false }]
    }));
    setNewAppliance({ name: '', watts: 0, isEssential: false });
    addNotification(`Registered ${newAppliance.name}.`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto pr-2 custom-scrollbar">
      <BentoCard title="Grid Simulation">
        <div className="flex justify-between items-center bg-[var(--bg)] border border-[var(--border)] p-4 rounded-xl mb-6">
           <div>
             <div className="text-xs font-bold font-mono">STATUS: {state.isSimulationRunning ? 'RUNNING' : 'IDLE'}</div>
             <div className="text-[0.65rem] text-[var(--text-dim)]">Real-time depletion {state.isSimulationRunning ? 'active' : 'paused'}</div>
           </div>
           <button 
             onClick={toggleSimulation}
             className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
               state.isSimulationRunning ? 'bg-[var(--danger)] text-white' : 'bg-[var(--success)] text-white'
             }`}
           >
             {state.isSimulationRunning ? 'STOP CUT' : 'START CUT'}
           </button>
        </div>

        <div className="space-y-8">
           <div className="space-y-4">
             <div className="flex justify-between items-center text-xs font-mono">
               <span>BATTERY OVERRIDE</span>
               <span className="text-[var(--accent)]">{state.batteryPercent.toFixed(0)}%</span>
             </div>
             <input type="range" className="w-full" value={state.batteryPercent} onChange={e => updateState((p:any) => ({ ...p, batteryPercent: Number(e.target.value) }))} />
           </div>

           <div className="grid grid-cols-3 gap-2">
             {['Normal', 'Power Saving', 'Ultra'].map(m => (
               <button 
                key={m} 
                onClick={() => handleModeChange(m as any)}
                className={`py-3 rounded-xl text-[0.65rem] font-bold border ${state.mode === m ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-dim)]'}`}
               >
                 {m.toUpperCase()}
               </button>
             ))}
           </div>
        </div>
      </BentoCard>

      <BentoCard title="Automatic Logic">
         <div className="space-y-8 py-4">
            {[
              { label: 'POWER SAVING TRIGGER', val: state.powerSavingThreshold, key: 'powerSavingThreshold', color: 'bg-[var(--warning)]' },
              { label: 'ULTRA SAVER TRIGGER', val: state.ultraThreshold, key: 'ultraThreshold', color: 'bg-[var(--danger)]' }
            ].map(s => (
              <div key={s.key} className="space-y-4">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span>{s.label}</span>
                  <span className="text-[var(--text)]">{s.val}%</span>
                </div>
                <input type="range" className="w-full" value={s.val} onChange={e => updateState((p:any) => ({ ...p, [s.key]: Number(e.target.value) }))} />
              </div>
            ))}
         </div>
      </BentoCard>

      <BentoCard title="Device Registration" className="md:col-span-2">
        <form onSubmit={registerDevice} className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="space-y-1">
             <label className="text-[0.6rem] text-[var(--text-dim)] uppercase">Appliance Name</label>
             <input type="text" value={newAppliance.name} onChange={e => setNewAppliance({...newAppliance, name: e.target.value})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" placeholder="e.g. Microwave"/>
           </div>
           <div className="space-y-1">
             <label className="text-[0.6rem] text-[var(--text-dim)] uppercase">Load (Watts)</label>
             <input type="number" value={newAppliance.watts || ''} onChange={e => setNewAppliance({...newAppliance, watts: Number(e.target.value)})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" placeholder="e.g. 500"/>
           </div>
           <div className="space-y-1">
             <label className="text-[0.6rem] text-[var(--text-dim)] uppercase">Priority</label>
             <select value={newAppliance.isEssential ? 't' : 'f'} onChange={e => setNewAppliance({...newAppliance, isEssential: e.target.value === 't'})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm">
                <option value="f">Non-Essential</option>
                <option value="t">Essential</option>
             </select>
           </div>
           <div className="flex items-end">
             <button type="submit" className="w-full py-2 bg-[var(--accent)] text-white rounded-lg text-xs font-bold uppercase tracking-widest">Register</button>
           </div>
        </form>
      </BentoCard>
    </div>
  );
}

function RemoteTab({ state, handleModeChange, toggleAppliance }: any) {
  return (
    <div className="max-w-xl mx-auto h-full flex flex-col gap-4">
      <BentoCard title="Remote Terminal" className="flex-1 shadow-2xl">
        <div className="flex justify-between items-center mb-8 bg-[var(--bg)] p-4 rounded-xl border border-[var(--border)]">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
               <Smartphone className="w-4 h-4 text-[var(--accent)]" />
             </div>
             <div>
               <div className="text-xs font-bold">NODE: SMARTPHONE_APP</div>
               <div className="text-[0.6rem] text-[var(--success)] font-mono">CONNECTED TO HUB</div>
             </div>
           </div>
           <div className="text-right">
             <div className="text-[0.6rem] text-[var(--text-dim)]">BATT LEVEL</div>
             <div className="text-xl font-mono font-bold">{state.batteryPercent.toFixed(0)}%</div>
           </div>
        </div>

        <div className="space-y-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
          {state.appliances.map((app: Appliance) => (
            <div key={app.id} className="inner-card flex items-center justify-between">
              <span className="text-sm font-medium">{app.name}</span>
              <Toggle isOn={app.isOn && !app.isAutoCut} disabled={app.isAutoCut} onClick={() => toggleAppliance(app.id, true)} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-6">
           {['Normal', 'Power Saving', 'Ultra'].map(m => (
             <button key={m} onClick={() => handleModeChange(m as any)} className={`py-2 rounded-lg text-[0.6rem] font-bold border ${state.mode === m ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-dim)]'}`}>{m.toUpperCase()}</button>
           ))}
        </div>
      </BentoCard>
    </div>
  );
}

function AITab({ messages, isTyping, onAsk }: any) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isTyping]);

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col gap-4">
      <BentoCard title="GridAI Console" className="flex-1 border-amber-500/20 shadow-xl overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar p-1">
          {messages.map((m: any, i: number) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`p-3 rounded-xl text-[0.85rem] max-w-[85%] ${m.role === 'user' ? 'bg-[var(--accent)] text-white shadow-md' : 'bg-[var(--bg)] border border-[var(--border)] text-[var(--text)]'}`}>
                 {m.text}
               </div>
            </div>
          ))}
          {isTyping && <div className="text-[var(--text-dim)] text-xs animate-pulse">AI is analyzing grid metrics...</div>}
        </div>
        
        <form onSubmit={e => { e.preventDefault(); onAsk(input); setInput(''); }} className="mt-4 flex gap-2">
           <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" placeholder="Ask AI about consumption..."/>
           <button type="submit" className="bg-[var(--accent)] p-2 rounded-lg text-white shadow-lg"><Send className="w-4 h-4" /></button>
        </form>
      </BentoCard>
      
      <div className="flex justify-center gap-2">
         {['Usage', 'Optimization', 'Report'].map(btn => (
           <button key={btn} onClick={() => onAsk(btn)} className="bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 rounded-md text-[0.65rem] text-[var(--text-dim)] hover:text-white">{btn}</button>
         ))}
      </div>
    </div>
  );
}

function AboutTab() {
  return (
    <div className="h-full overflow-y-auto pr-4 custom-scrollbar space-y-8 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <BentoCard title="Project Definition" className="md:col-span-2">
            <h1 className="text-3xl font-black mb-4">SmartGrid</h1>
            <p className="text-[var(--text-dim)] leading-relaxed text-sm">An integrated intelligence layer for the decentralized home energy independence. Optimized for high-durability backup scenarios.</p>
         </BentoCard>

         <BentoCard title="Core Features">
            <div className="grid grid-cols-2 gap-3 text-[0.7rem] font-medium text-[var(--text-dim)]">
               {['Battery Intel', 'Appliance Control', 'Remote Node', 'AI Assistant', 'Smart Modes', 'Live Logs'].map(f => (
                 <div key={f} className="flex items-center gap-2 bg-[var(--bg)] p-2 rounded-lg border border-[var(--border)] text-white">
                    <CheckCircle2 className="w-3 h-3 text-[var(--success)]" /> {f}
                 </div>
               ))}
            </div>
         </BentoCard>

         <BentoCard title="Hardware Context">
            <p className="text-xs text-[var(--text-dim)] leading-relaxed">System architecture designed for ESP32/Sonoff integration. Live prototype validation completed at PSIT Kanpur Lab environment.</p>
         </BentoCard>
      </div>

      <div className="text-center py-12 border-t border-[var(--border)] space-y-2 opacity-50">
         <p className="text-[0.6rem] font-mono uppercase tracking-[0.2em]">Electronics Engineering Division</p>
         <h2 className="text-sm font-black tracking-tight">PSIT KANPUR UNIVERSITY</h2>
      </div>
    </div>
  );
}
