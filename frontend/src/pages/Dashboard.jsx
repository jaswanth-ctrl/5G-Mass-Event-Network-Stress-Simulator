import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulation } from '../hooks/useSimulation';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { VenueSelector } from '../components/dashboard/VenueSelector';
import { CrowdSlider } from '../components/dashboard/CrowdSlider';
import { MetricCard } from '../components/dashboard/MetricCard';
import { BlockingChart } from '../components/dashboard/BlockingChart';
import { SliceStatusPanel } from '../components/dashboard/SliceStatusPanel';
import { IncidentTrigger } from '../components/dashboard/IncidentTrigger';
import { IncidentAlert } from '../components/dashboard/IncidentAlert';
import { OperatorLog } from '../components/dashboard/OperatorLog';
import { formatNumberIN, formatPercent, formatErlangs } from '../utils/formatters';
import { V2XCanvas } from '../components/v2x/V2XCanvas';
import { LatencyComparison } from '../components/v2x/LatencyComparison';
import { V2XMessageFeed } from '../components/v2x/V2XMessageFeed';
import { NetworkSlicingVisualizer } from '../components/slices/NetworkSlicingVisualizer';
import { Users, Activity, ShieldAlert, Radio, Zap, RotateCcw, Gauge, Timer, Server, Wifi } from 'lucide-react';

export default function Dashboard() {
  const { state, venues, v2xState, loading, setCrowdSize, triggerIncident, resetSimulation, fetchInitialData } = useSimulation();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Build sparkline history arrays from metrics history
  const historyArrays = useMemo(() => {
    const h = state?.history || [];
    return {
      crowd: h.map(p => p.crowdSize || 0),
      civBlock: h.map(p => p.civilianBlocking || 0),
      utilization: h.map(p => p.utilization || 0),
      embbLatency: h.map(p => p.embbLatency || 0),
    };
  }, [state?.history]);

  if (loading || !state) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">Connecting to simulation engine...</p>
        </div>
      </div>
    );
  }

  const isCritical = state.networkStatus === 'CRITICAL';
  const isCongested = state.networkStatus === 'CONGESTED';
  const venue = state.venue || {};
  const metrics = state.metrics || {};
  const slices = state.slices || {};
  const policyDecisions = state.policyDecisions || [];

  // Status text for banner
  const statusText = isCritical 
    ? 'Emergency Priority Active — Corridor Mode Engaged' 
    : isCongested 
      ? 'Network Congested — Load Balancing Active' 
      : 'All Systems Nominal — Standard Operations';

  const statusBannerClass = isCritical 
    ? 'bg-red-500 text-white' 
    : isCongested 
      ? 'bg-amber-400 text-amber-900' 
      : 'bg-emerald-500 text-white';

  return (
    <div className={`w-full h-screen flex flex-col ${isCritical ? 'screen-critical-flash' : ''}`}>
      <Header venueName={venue.name} networkStatus={state.networkStatus} />
      
      {/* Live Status Banner */}
      <motion.div 
        className={`w-full px-6 py-1.5 text-center text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 ${statusBannerClass}`}
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {isCritical && <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>}
        {statusText}
      </motion.div>

      <div className="flex flex-1 min-h-0">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 overflow-y-auto p-5 bg-slate-50">
          <AnimatePresence mode="wait">

          {/* ============ DASHBOARD TAB ============ */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-5">
              
              {/* === CENTER PANEL === */}
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                {/* Metric Cards Row 1 — Primary */}
                <div className="grid grid-cols-4 gap-3">
                  <MetricCard 
                    title="Active UEs" 
                    value={state.crowdSize} 
                    formatter={formatNumberIN} 
                    icon={<Users size={14} />} 
                    subtitle={`${metrics.activeCrowd || 0} concurrent calls`}
                    history={historyArrays.crowd}
                    sparkColor="#3b82f6"
                  />
                  <MetricCard 
                    title="Civilian Blocking" 
                    value={metrics.civilianBlocking} 
                    formatter={(v) => formatPercent(v) + '%'} 
                    statusColor={metrics.civilianBlocking > 0.1 ? 'text-red-500' : 'text-emerald-500'} 
                    icon={<Activity size={14} />}
                    subtitle="Erlang-B loss probability"
                    history={historyArrays.civBlock}
                    sparkColor={metrics.civilianBlocking > 0.1 ? '#ef4444' : '#10b981'}
                    alert={metrics.civilianBlocking > 0.2}
                  />
                  <MetricCard 
                    title="Utilization" 
                    value={metrics.utilization} 
                    formatter={(v) => (v || 0).toFixed(1) + '%'} 
                    statusColor={metrics.utilization > 70 ? 'text-amber-500' : 'text-slate-900'} 
                    icon={<Gauge size={14} />}
                    subtitle={`${metrics.totalErlangs || 0} Erlangs offered`}
                    history={historyArrays.utilization}
                    sparkColor="#f59e0b"
                    alert={metrics.utilization > 85}
                  />
                  <MetricCard 
                    title="Emergency Block" 
                    value={metrics.emergencyBlocking} 
                    formatter={(v) => formatPercent(v) + '%'} 
                    statusColor="text-emerald-500" 
                    icon={<ShieldAlert size={14} />}
                    subtitle={state.incidentActive ? 'Dedicated corridor active' : 'Shared with civilian pool'}
                  />
                </div>

                {/* Metric Cards Row 2 — Secondary */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">eMBB Latency</div>
                    <div className="text-lg font-black font-mono text-blue-600">{metrics.latency?.embb || 50}ms</div>
                    <div className="text-[9px] text-slate-400">Video streaming / Social</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">URLLC Latency</div>
                    <div className="text-lg font-black font-mono text-purple-600">{metrics.latency?.urllc || 1}ms</div>
                    <div className="text-[9px] text-slate-400">V2X / Critical control</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Dropped / min</div>
                    <div className={`text-lg font-black font-mono ${metrics.droppedCallsPerMin > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{metrics.droppedCallsPerMin || 0}</div>
                    <div className="text-[9px] text-slate-400">Blocked call attempts</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">eMBB Throughput</div>
                    <div className="text-lg font-black font-mono text-slate-700">{metrics.throughput?.embb || 100} Mbps</div>
                    <div className="text-[9px] text-slate-400">{state.incidentActive ? '⬇ degraded 30%' : 'Full capacity'}</div>
                  </div>
                </div>

                {/* Utilization Bar */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Network Utilization</h3>
                      <p className="text-[10px] text-slate-300 mt-0.5">Erlang-B: B(A, N) = (Aᴺ/N!) / Σ(Aᵏ/k!)</p>
                    </div>
                    <div className="formula-text text-xs">
                      B(A={Math.round(metrics.totalErlangs || 0)}E, N={venue.totalChannels || 0}ch) = {formatPercent(metrics.civilianBlocking)}%
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full transition-colors duration-500 ${
                        (metrics.utilization || 0) > 85 ? 'bg-red-500' : (metrics.utilization || 0) > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      animate={{ width: `${Math.min(100, Math.max(0, metrics.utilization || 0))}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-slate-400">0%</span>
                    <span className="text-[10px] text-slate-600 font-mono font-bold">{(metrics.utilization || 0).toFixed(1)}%</span>
                    <span className="text-[10px] text-slate-400">100%</span>
                  </div>
                </div>

                {/* Blocking Chart — now rich multi-line */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Stress Analysis</h3>
                      <p className="text-[10px] text-slate-300">Per-slice blocking & utilization — 60s window</p>
                    </div>
                    <div className="flex gap-3 text-[10px] text-slate-400 flex-wrap justify-end">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Civilian</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>eMBB</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span>URLLC</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 border border-dashed border-emerald-600"></span>Emergency</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span>Utilization</span>
                    </div>
                  </div>
                  <BlockingChart data={state.history} incidentActive={state.incidentActive} />
                </div>

                {/* Slice Status Panel */}
                <SliceStatusPanel slices={slices} />
              </div>

              {/* === RIGHT SIDEBAR === */}
              <div className="w-[310px] shrink-0 flex flex-col gap-3">
                <IncidentAlert 
                  isIncidentActive={state.incidentActive} 
                  scenario={venue.incidentScenario} 
                  metrics={metrics} 
                  preIncidentMetrics={state.preIncidentMetrics}
                />

                {/* Emergency Corridor Status */}
                {state.incidentActive && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={14} className="text-red-500" />
                      <h4 className="text-xs font-bold text-red-700 uppercase tracking-widest">Emergency Corridor Mode</h4>
                    </div>
                    <div className="space-y-1.5 text-[11px] text-red-600 font-mono">
                      <div className="flex justify-between"><span>Corridor Status</span><span className="font-bold">ACTIVE</span></div>
                      <div className="flex justify-between"><span>Reserved Channels</span><span className="font-bold">{venue.emergencyChannels || 80}</span></div>
                      <div className="flex justify-between"><span>Emergency Latency</span><span className="font-bold text-emerald-600">{metrics.latency?.emergency || 0.8}ms</span></div>
                      <div className="flex justify-between"><span>eMBB Degradation</span><span className="font-bold">-30%</span></div>
                      <div className="flex justify-between"><span>URLLC Priority</span><span className="font-bold text-emerald-600">Level 1</span></div>
                    </div>
                  </motion.div>
                )}
                
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <VenueSelector venues={venues} activeVenueId={venue.id} onSelect={() => fetchInitialData()} onRefresh={fetchInitialData} />
                  <CrowdSlider initialCrowd={state.crowdSize} capacity={venue.capacity || 50000} onCrowdChange={setCrowdSize} />
                  <IncidentTrigger isIncidentActive={state.incidentActive} onTrigger={triggerIncident} />
                  
                  {state.incidentActive && (
                    <motion.button 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      onClick={resetSimulation} 
                      className="mt-3 w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 py-2 rounded-lg transition-colors border border-slate-200"
                    >
                      <RotateCcw size={12} /> Reset Simulation
                    </motion.button>
                  )}
                </div>

                <OperatorLog logs={state.eventLog} />
              </div>
            </motion.div>
          )}

          {/* ============ V2X TAB ============ */}
          {activeTab === 'v2x' && (
            <motion.div key="v2x" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-5">
              <div className="h-[500px]">
                <V2XCanvas v2xState={v2xState} venue={venue} crowdSize={state.crowdSize} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <LatencyComparison stats={v2xState?.latencyStats} />
                <V2XMessageFeed messages={v2xState?.latestMessages || []} msgRate={v2xState?.messagesLastSecond || 0} />
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">MEC Edge Compute</h4>
                    <div className="font-mono text-xs text-sky-400 leading-relaxed whitespace-pre-line">
                      {v2xState?.corridorStatus === 'ACTIVE' 
                        ? '> A* pathfinding: ACTIVE\n> Waypoints computed\n> Obstacle avoidance: ON\n> URLLC latency: <1ms\n> Corridor Mode: ENGAGED' 
                        : '> MEC Server: STANDBY\n> Awaiting incident...\n> A* engine: loaded\n> V2X GeoCast: ready\n> Corridor Mode: OFF'}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Zap size={12} className={v2xState?.corridorStatus === 'ACTIVE' ? 'text-sky-400' : 'text-slate-600'} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${v2xState?.corridorStatus === 'ACTIVE' ? 'text-sky-400' : 'text-slate-600'}`}>
                      {v2xState?.corridorStatus || 'STANDBY'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ============ SLICES TAB ============ */}
          {activeTab === 'slices' && (
            <motion.div key="slices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h1 className="text-xl font-bold text-slate-800">5G Network Slice Manager</h1>
                  <p className="text-xs text-slate-400 mt-0.5">SDN Policy Engine — Resource Allocation & Preemption Control</p>
                </div>
                {state.incidentActive && (
                  <div className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg animate-pulse shadow-lg">
                    ⚡ EMERGENCY CORRIDOR MODE
                  </div>
                )}
              </div>
              <NetworkSlicingVisualizer slices={slices} incidentActive={state.incidentActive} policyDecisions={policyDecisions} />
              <SliceStatusPanel slices={slices} />
            </motion.div>
          )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
