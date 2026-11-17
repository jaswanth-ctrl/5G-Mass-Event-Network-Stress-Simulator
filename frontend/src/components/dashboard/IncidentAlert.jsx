import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Mail, ArrowRight, Clock } from 'lucide-react';
import { formatPercent } from '../../utils/formatters';

export const IncidentAlert = ({ isIncidentActive, scenario, metrics, preIncidentMetrics }) => {
  return (
    <AnimatePresence>
      {isIncidentActive && (
        <motion.div
          initial={{ y: -30, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="mb-2"
        >
          <div className="bg-white border-2 border-red-300 rounded-xl shadow-lg shadow-red-100/50 overflow-hidden">
            <div className="bg-red-500 text-white text-xs font-bold uppercase py-2 px-4 tracking-widest text-center flex items-center justify-center gap-2">
              <AlertTriangle size={14} className="animate-pulse" />
              Critical Emergency Alert
            </div>
            <div className="p-4">
              <h3 className="text-red-600 font-bold mb-2 text-sm">{scenario?.title}</h3>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                {scenario?.description}
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-red-50 rounded-lg p-3 text-center border border-red-100">
                  <div className="text-[10px] text-slate-500 uppercase mb-1 font-semibold">Civilian Blocking</div>
                  <div className="text-red-600 font-mono font-black text-lg flex items-center justify-center gap-1">
                    <span className="text-[10px] text-slate-400 font-normal">{formatPercent(preIncidentMetrics?.civilianBlocking)}%</span>
                    <ArrowRight size={10} className="text-slate-400" />
                    {formatPercent(metrics?.civilianBlocking)}%
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-100">
                  <div className="text-[10px] text-slate-500 uppercase mb-1 font-semibold">Emergency Latency</div>
                  <div className="text-emerald-600 font-mono font-black text-lg flex items-center justify-center gap-1">
                    <span className="text-[10px] text-slate-400 font-normal">Unreserved</span>
                    <ArrowRight size={10} className="text-slate-400" />
                    {metrics?.latency?.emergency || 0.8}ms
                  </div>
                </div>
              </div>

              {/* Before/After Comparison */}
              <div className="mt-3 bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono shadow-sm">
                <div className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-1.5 border-b border-slate-100 pb-1">Resource Shift</div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500">eMBB Capacity:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 line-through">100%</span>
                    <ArrowRight size={10} className="text-slate-400" />
                    <span className="text-red-500 font-bold">70%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">URLLC Priority:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Nominal</span>
                    <ArrowRight size={10} className="text-slate-400" />
                    <span className="text-emerald-500 font-bold">Absolute</span>
                  </div>
                </div>
              </div>

              {/* Emergency Event Timeline */}
              <div className="mt-4">
                <div className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-1">
                  <Clock size={10} /> Automated Timeline
                </div>
                <div className="border-l-2 border-slate-200 ml-1 pl-2 space-y-2 text-[10px]">
                  <div className="relative">
                    <div className="absolute -left-[13px] top-1 w-2 h-2 rounded-full bg-slate-300"></div>
                    <span className="text-slate-500">Crowd density threshold exceeded</span>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[13px] top-1 w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                    <span className="text-red-600 font-bold">Critical Incident detected</span>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[13px] top-1 w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className="text-blue-600">SDN Policy Engine engages</span>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[13px] top-1 w-2 h-2 rounded-full bg-purple-400"></div>
                    <span className="text-purple-600">eMBB degraded, URLLC boosted</span>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[13px] top-1 w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-emerald-600 font-bold">Emergency Corridor activated</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-bold text-white bg-blue-500 rounded-lg p-2 shadow-sm shadow-blue-500/20">
                <Mail size={12} /> NOC Alert Email Dispatched
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
