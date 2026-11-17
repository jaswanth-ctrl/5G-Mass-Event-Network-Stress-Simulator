import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { ShieldCheck, ArrowRightLeft, Zap, AlertTriangle } from 'lucide-react';

export const NetworkSlicingVisualizer = ({ slices, incidentActive, policyDecisions = [] }) => {
  if (!slices) return <div className="h-64 w-full bg-slate-50 flex items-center justify-center border border-slate-200 rounded-xl text-slate-400">WAITING FOR SDN DATA...</div>;

  const getTrafficDensity = (slice) => {
    if (!slice) return 0;
    return Math.min(100, (slice.trafficErlangs / (slice.allocatedChannels || 1)) * 100);
  };

  const getPipeColor = (type, isViolated, isEmergency) => {
    if (isViolated) return '#ef4444';
    if (isEmergency && incidentActive) return '#ef4444';
    if (isEmergency && !incidentActive) return '#cbd5e1';
    switch (type) {
      case 'eMBB': return '#3b82f6';
      case 'URLLC': return '#8b5cf6';
      case 'mMTC': return '#64748b';
      default: return '#cbd5e1';
    }
  };

  const W = 900;
  const sliceDataList = useMemo(() => [
    { id: 'eMBB', data: slices.embb, yPos: 30, isEmergency: false },
    { id: 'URLLC', data: slices.urllc, yPos: 110, isEmergency: false },
    { id: 'mMTC', data: slices.mmtc, yPos: 190, isEmergency: false },
    { id: 'Emergency', data: slices.emergency, yPos: 270, isEmergency: true }
  ], [slices, incidentActive]);

  const actionIcons = { 'PREEMPT': ArrowRightLeft, 'ACTIVATE': ShieldCheck, 'BOOST': Zap, 'CORRIDOR': ShieldCheck, 'THROTTLE': AlertTriangle };
  const actionColors = { 'PREEMPT': 'text-amber-600 bg-amber-50 border-amber-200', 'ACTIVATE': 'text-emerald-600 bg-emerald-50 border-emerald-200', 'BOOST': 'text-purple-600 bg-purple-50 border-purple-200', 'CORRIDOR': 'text-red-600 bg-red-50 border-red-200', 'THROTTLE': 'text-slate-600 bg-slate-50 border-slate-200' };

  return (
    <div className="space-y-4 mb-6">
      {/* SVG Flow Diagram */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between w-full mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Live Flow Architecture</h3>
            <p className="text-xs text-slate-400">SDN logical paths — active routing visualization</p>
          </div>
          {incidentActive && (
            <div className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full animate-pulse border border-red-200">
              ⚡ EMERGENCY PREEMPTION ACTIVE
            </div>
          )}
        </div>

        <div className="w-full overflow-hidden">
          <svg viewBox="0 0 900 360" width="100%" height="360" className="block">
            <rect x="15" y="90" width="100" height="180" rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
            <text x="65" y="175" textAnchor="middle" fill="#475569" fontSize="14" fontWeight="bold">5G Core</text>
            <text x="65" y="195" textAnchor="middle" fill="#94a3b8" fontSize="10">UPF / MEC</text>

            {sliceDataList.map((slice) => {
              const density = getTrafficDensity(slice.data);
              const isViolated = slice.data?.status === 'VIOLATED';
              const color = getPipeColor(slice.id, isViolated, slice.isEmergency);
              const numParticles = slice.isEmergency && !incidentActive ? 0 : Math.max(1, Math.floor(density / 10));
              const pathId = `path-${slice.id}`;
              const pathD = `M 115 180 C 250 180, 350 ${slice.yPos + 25}, 650 ${slice.yPos + 25}`;
              
              return (
                <g key={slice.id}>
                  <path id={pathId} d={pathD} fill="none" stroke={slice.isEmergency && !incidentActive ? '#f1f5f9' : color} strokeWidth="8" strokeOpacity={slice.isEmergency && !incidentActive ? 1 : 0.15} strokeLinecap="round" />
                  <path d={pathD} fill="none" stroke={slice.isEmergency && !incidentActive ? 'transparent' : color} strokeWidth="2" strokeLinecap="round" />
                  
                  {Array.from({ length: numParticles }).map((_, idx) => (
                    <circle key={`${slice.id}-p-${idx}`} r="4" fill={color} opacity="0.9">
                      <animateMotion dur={`${Math.max(1.5, 4 - (density / 30))}s`} repeatCount="indefinite" begin={`${idx * (2 / Math.max(1, numParticles))}s`}>
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>
                  ))}

                  <rect x="650" y={slice.yPos} width="230" height="50" rx="8" fill="#ffffff" stroke={color} strokeWidth="2" />
                  <rect x="650" y={slice.yPos} width="8" height="50" rx="4" fill={color} />
                  <text x="670" y={slice.yPos + 20} fill="#1e293b" fontSize="12" fontWeight="bold">{slice.id}</text>
                  <text x="670" y={slice.yPos + 38} fill="#64748b" fontSize="10">{slice.data?.allocatedChannels || 0} channels</text>
                  <text x="865" y={slice.yPos + 30} textAnchor="end" fill={color} fontSize="16" fontWeight="bold" fontFamily="monospace">
                    {density.toFixed(0)}%
                  </text>
                  {isViolated && (
                    <circle cx="860" cy={slice.yPos + 10} r="5" fill="#ef4444">
                      <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* SDN Policy Engine Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-1">SDN Policy Engine</h3>
        <p className="text-xs text-slate-400 mb-4">Real-time decisions made by the Software-Defined Network controller</p>

        {!incidentActive && policyDecisions.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <ShieldCheck size={20} className="text-emerald-500" />
            <div>
              <p className="text-sm font-bold text-slate-700">All Slices Nominal</p>
              <p className="text-xs text-slate-400">No preemption needed. Resources balanced across eMBB, URLLC, and mMTC.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {policyDecisions.map((d, i) => {
              const Icon = actionIcons[d.action] || ShieldCheck;
              const colors = actionColors[d.action] || actionColors['THROTTLE'];
              return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${colors}`}
                >
                  <Icon size={16} className="mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{d.action}</span>
                      <span className="text-xs font-bold">{d.slice}</span>
                    </div>
                    <p className="text-xs opacity-80 mt-0.5">{d.detail}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
