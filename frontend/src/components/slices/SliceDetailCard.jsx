import { motion } from 'framer-motion';

const sliceDescriptions = {
  'eMBB': 'High throughput for HD streaming, social media, and video calls',
  'URLLC': 'Ultra-low latency for V2X, emergency comms, and critical control',
  'mMTC': 'IoT sensors, CCTV cameras, turnstile gates, and crowd counters',
  'Emergency': 'Reserved priority corridor for NDRF, ambulance, and police'
};

const statusBadge = {
  'GUARANTEED': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  'AT RISK':    { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200' },
  'VIOLATED':   { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200' }
};

export const SliceDetailCard = ({ title, type, colorTag, sliceStatus }) => {
  const s = sliceStatus || {};
  const badge = statusBadge[s.status] || statusBadge['GUARANTEED'];
  const blocking = s.blocking || 0;
  const utilPct = s.allocatedChannels > 0 ? Math.min(100, (s.trafficErlangs / s.allocatedChannels) * 100) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border rounded-xl p-4 shadow-sm transition-all ${s.status === 'VIOLATED' ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${colorTag}`}></div>
          <h4 className="font-bold text-sm text-slate-800">{title}</h4>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
          {s.status || 'GUARANTEED'}
        </span>
      </div>
      
      {/* Description */}
      <p className="text-[10px] text-slate-400 mb-3 leading-relaxed ml-4.5">{sliceDescriptions[type] || ''}</p>

      {/* Capacity bar */}
      <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
        <span>{(s.trafficErlangs || 0).toFixed(1)} Erlangs</span>
        <span>{s.allocatedChannels || 0} channels</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
        <motion.div 
          className={`h-full rounded-full ${utilPct > 80 ? 'bg-red-500' : utilPct > 50 ? 'bg-amber-400' : colorTag}`}
          animate={{ width: `${Math.min(100, utilPct)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-[9px] text-slate-400 uppercase tracking-wider">Blocking</div>
          <div className={`text-sm font-black font-mono ${blocking > 0.05 ? 'text-red-500' : 'text-emerald-500'}`}>
            {(blocking * 100).toFixed(1)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-slate-400 uppercase tracking-wider">Latency</div>
          <div className="text-sm font-black font-mono text-slate-700">
            {typeof s.latency === 'number' ? s.latency.toFixed(1) : '—'}ms
          </div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-slate-400 uppercase tracking-wider">Load</div>
          <div className={`text-sm font-black font-mono ${utilPct > 70 ? 'text-amber-500' : 'text-slate-700'}`}>
            {utilPct.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Rejected requests indicator */}
      {(s.rejectedRequests || 0) > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-red-500 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
          {s.rejectedRequests} admission requests rejected
        </div>
      )}
    </motion.div>
  );
};
