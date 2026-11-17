import { Activity, Radio, Network } from 'lucide-react';
import { motion } from 'framer-motion';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', icon: <Activity size={20} />, label: 'Live Dashboard' },
    { id: 'v2x', icon: <Radio size={20} />, label: 'V2X Emergency' },
    { id: 'slices', icon: <Network size={20} />, label: 'Network Slices' }
  ];

  return (
    <div className="w-60 h-full bg-white border-r border-slate-200 p-4 flex flex-col shadow-sm">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-3 mb-3">Navigation</h3>
      <nav className="flex flex-col gap-1">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-3 p-3 rounded-xl transition-all font-semibold text-sm ${
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebarActive" 
                  className="absolute inset-0 bg-blue-50 border border-blue-200 rounded-xl z-0" 
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-3">
                {tab.icon}
                {tab.label}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 text-slate-400 px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-[10px] font-mono">Engine v2.1 • Connected</span>
        </div>
      </div>
    </div>
  );
};
