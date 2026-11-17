import { useState, useEffect } from 'react';

export const CrowdSlider = ({ initialCrowd, capacity, onCrowdChange }) => {
  const [val, setVal] = useState(initialCrowd);

  useEffect(() => {
    setVal(initialCrowd);
  }, [initialCrowd]);

  const percentage = capacity > 0 ? (val / capacity) * 100 : 0;
  
  const getBarColor = () => {
    if (percentage > 70) return '#ef4444';
    if (percentage > 40) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex justify-between items-end">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Crowd Density</h3>
        <span className="font-mono text-sm text-slate-800 font-bold">{Math.round(val).toLocaleString('en-IN')} <span className="text-slate-400 font-normal">/ {capacity.toLocaleString('en-IN')}</span></span>
      </div>
      
      <input 
        type="range" 
        min="0" 
        max={capacity} 
        value={val} 
        onChange={(e) => {
          const newVal = Number(e.target.value);
          setVal(newVal);
          onCrowdChange(newVal);
        }}
        className="styled-slider"
        style={{
          background: `linear-gradient(to right, ${getBarColor()} ${percentage}%, #e2e8f0 ${percentage}%)`
        }}
      />
      
      {/* Mini capacity bar with dots */}
      <div className="flex gap-[2px]">
        {Array.from({ length: 20 }).map((_, i) => {
          const isFilled = i < (percentage / 5);
          return (
            <div 
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                isFilled 
                  ? percentage > 70 ? 'bg-red-400' : percentage > 40 ? 'bg-amber-400' : 'bg-emerald-400'
                  : 'bg-slate-100'
              }`}
            />
          );
        })}
      </div>
      
      <div className="text-[10px] text-slate-400 text-center">
        Network stress increases above ~60% capacity
      </div>
    </div>
  );
};
