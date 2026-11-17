import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Line, ComposedChart } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const d = payload[0]?.payload;
    return (
      <div className="bg-white border border-slate-200 shadow-xl p-3 rounded-lg text-xs">
        <p className="font-mono text-slate-400 mb-1.5">T-{d?.tick || 0}s</p>
        {payload.map((p, i) => (
          <div key={i} className="flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-bold font-mono">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}%</span>
          </div>
        ))}
        {d?.incidentActive && <div className="mt-1.5 text-red-500 font-bold text-[10px] tracking-widest">⚡ INCIDENT ACTIVE</div>}
      </div>
    );
  }
  return null;
};

export const BlockingChart = ({ data, incidentActive }) => {
  const chartData = (data || []).slice(-60).map((d, i) => ({
    ...d,
    index: i,
    label: `T-${60 - i}s`
  }));

  // Find incident start point
  const incidentStartIdx = chartData.findIndex(d => d.incidentActive);

  return (
    <div className="w-full" style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="gradCiv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02}/>
            </linearGradient>
            <linearGradient id="gradUtil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02}/>
            </linearGradient>
            <linearGradient id="gradEmbb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
          <XAxis dataKey="index" hide={true} />
          <YAxis stroke="rgba(0,0,0,0.15)" fontSize={10} domain={[0, 'auto']} tickFormatter={v => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Utilization area (background) */}
          <Area type="monotone" dataKey="utilization" name="Utilization" stroke="#3b82f6" strokeWidth={1} fillOpacity={1} fill="url(#gradUtil)" dot={false} />
          
          {/* eMBB blocking */}
          <Area type="monotone" dataKey="embbBlocking" name="eMBB Block" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={1} fill="url(#gradEmbb)" dot={false} />

          {/* Main civilian blocking line */}
          <Area type="monotone" dataKey="civilianBlocking" name="Civilian Block" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#gradCiv)" dot={false} />
          
          {/* Emergency blocking line */}
          <Line type="monotone" dataKey="emergencyBlocking" name="Emergency Block" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="4 4" />
          
          {/* URLLC blocking */}
          <Line type="monotone" dataKey="urllcBlocking" name="URLLC Block" stroke="#a855f7" strokeWidth={1.5} dot={false} />

          {/* Incident marker */}
          {incidentStartIdx >= 0 && (
            <ReferenceLine 
              x={incidentStartIdx} 
              stroke="#ef4444" 
              strokeWidth={2} 
              strokeDasharray="6 3" 
              label={{ position: 'insideTopRight', value: '⚡ INCIDENT', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} 
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
