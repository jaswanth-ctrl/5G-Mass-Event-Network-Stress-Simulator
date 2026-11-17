import { useEffect, useState } from 'react';
import { Activity, Radio } from 'lucide-react';
import { PulsingDot } from '../common/PulsingDot';

export const Header = ({ venueName, networkStatus }) => {
  const [time, setTime] = useState(new Date());
  const [simTime, setSimTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setSimTime(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatSimTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  let statusClass = 'text-emerald-600';
  let badgeClass = 'border-emerald-200 bg-emerald-50';
  let pulseClass = 'bg-emerald-500';
  switch (networkStatus) {
    case 'CONGESTED':
      statusClass = 'text-amber-600';
      badgeClass = 'border-amber-200 bg-amber-50';
      pulseClass = 'bg-amber-500';
      break;
    case 'CRITICAL':
      statusClass = 'text-red-600';
      badgeClass = 'border-red-200 bg-red-50';
      pulseClass = 'bg-red-500';
      break;
  }

  return (
    <header className="w-full h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-20 shadow-sm relative">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Activity size={20} />
        </div>
        <span className="font-extrabold text-slate-800 text-lg tracking-tight">
          5G Mass Event <span className="text-blue-600 font-black">NOC</span>
        </span>
      </div>
      
      <div className="flex flex-col items-center flex-1">
        <h2 className="text-slate-800 text-sm font-bold tracking-wide uppercase">{venueName || 'Initializing Environment'}</h2>
        <div className="font-mono text-xs text-slate-500 mt-1">
          {time.toLocaleTimeString('en-GB')} <span className="mx-2 opacity-30 text-slate-400">|</span> Sim T+ {formatSimTime(simTime)}
        </div>
      </div>
      
      <div className={`flex items-center gap-3 border px-4 py-1.5 rounded-full ${badgeClass} transition-colors duration-500 shadow-sm`}>
        <div className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseClass}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseClass}`}></span>
        </div>
        <span className={`text-xs font-bold tracking-widest ${statusClass}`}>{networkStatus || 'NOMINAL'}</span>
      </div>
    </header>
  );
};
