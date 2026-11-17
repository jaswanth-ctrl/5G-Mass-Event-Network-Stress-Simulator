import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const IncidentTrigger = ({ isIncidentActive, onTrigger }) => {
  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <AnimatePresence mode="wait">
        {!isIncidentActive ? (
          <motion.button 
            key="trigger"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onTrigger}
            className="w-full relative overflow-hidden group rounded-xl bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-gradient-x opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative px-6 py-4 flex flex-col items-center justify-center gap-2">
              <AlertTriangle className="text-white animate-bounce" size={28} />
              <span className="text-white font-black text-sm tracking-widest uppercase">Trigger Mass Incident</span>
              <span className="text-red-100 text-[10px] uppercase font-mono tracking-wider">Execute Simulation Scenario</span>
            </div>
          </motion.button>
        ) : (
          <motion.div 
            key="active"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full relative overflow-hidden rounded-xl bg-emerald-50 border border-emerald-200 shadow-inner"
          >
            <div className="px-6 py-4 flex items-center justify-center gap-3">
              <ShieldCheck className="text-emerald-500" size={24} />
              <div className="flex flex-col text-left">
                <span className="text-emerald-800 font-bold text-sm tracking-widest uppercase">SDN Response Active</span>
                <span className="text-emerald-600 text-[10px] font-mono uppercase">Incident Managed by Policy Engine</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
