import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './pages/Dashboard';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="w-full h-full relative">
      <AnimatePresence>
        {loading && (
          <motion.div
            key="splash"
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Animated ring */}
            <div className="relative w-32 h-32 mb-8">
              <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-blue-400 rounded-full animate-spin"></div>
              <div className="absolute inset-3 border-2 border-transparent border-b-sky-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.8)]"></div>
              </div>
            </div>
            
            <motion.h1 
              className="text-4xl font-extrabold text-white mb-1 tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              5G Mass Event <span className="text-blue-400">Network</span>
            </motion.h1>
            <motion.p 
              className="text-blue-300/70 text-sm tracking-widest uppercase mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Network Operations Center
            </motion.p>
            <div className="w-64 h-1 bg-white/10 rounded overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.6, ease: "easeInOut" }}
              />
            </div>
            <motion.p 
              className="text-blue-300/50 text-xs mt-4 font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Initializing Erlang-B engine & SDN controller...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!loading && (
        <motion.div
          className="w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Dashboard />
        </motion.div>
      )}
    </div>
  );
}

export default App;
