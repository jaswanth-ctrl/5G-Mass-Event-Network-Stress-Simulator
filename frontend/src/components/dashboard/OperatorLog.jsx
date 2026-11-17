import { motion, AnimatePresence } from 'framer-motion';

const typeConfig = {
  INFO:    { border: 'border-blue-400',    text: 'text-blue-600',    bg: 'bg-blue-50',    icon: 'ℹ️' },
  WARN:    { border: 'border-amber-400',   text: 'text-amber-600',   bg: 'bg-amber-50',   icon: '⚠️' },
  ALERT:   { border: 'border-red-400',     text: 'text-red-600',     bg: 'bg-red-50',     icon: '🚨' },
  SYSTEM:  { border: 'border-purple-400',  text: 'text-purple-600',  bg: 'bg-purple-50',  icon: '⚙️' },
  PROTECT: { border: 'border-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50', icon: '🛡️' }
};

export const OperatorLog = ({ logs }) => {
  const latestAlert = logs?.find(l => l.type === 'ALERT');

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">SDN Operator Log</h3>
      
      {/* Highlight most critical event */}
      {latestAlert && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 p-2.5 bg-red-50 border border-red-200 rounded-lg animate-pulse"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs">🚨</span>
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Priority Alert</span>
          </div>
          <p className="text-[11px] text-red-700 font-mono mt-1 leading-relaxed">{latestAlert.message}</p>
        </motion.div>
      )}

      <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-y-auto shadow-sm max-h-[260px]">
        <div className="p-2.5 flex flex-col gap-1">
          <AnimatePresence initial={false}>
            {logs && logs.slice(0, 20).map((log, idx) => {
              const config = typeConfig[log.type] || typeConfig.INFO;
              const isFirst = idx === 0;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: isFirst ? 1 : 0.85, x: 0 }}
                  className={`pl-2.5 border-l-2 ${config.border} py-1.5 rounded-r transition-opacity ${isFirst ? 'bg-slate-50' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px]">{config.icon}</span>
                      <span className={`text-[9px] font-bold ${config.text} uppercase tracking-wider`}>[{log.type}]</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleTimeString('en-GB')}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug font-mono mt-0.5">{log.message}</p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
