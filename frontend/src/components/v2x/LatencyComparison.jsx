import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const LatencyComparison = ({ stats }) => {
  if (!stats) return null;

  const data = Object.entries(stats).map(([k, v]) => ({
    name: k,
    latency: v
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 shadow-lg p-3 rounded-xl">
          <p className="font-mono text-sm text-slate-800">{payload[0].payload.name}</p>
          <p className="font-mono text-lg font-bold text-blue-600">{payload[0].value}ms</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col h-[260px]">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Call Setup Latency Comparison</h3>
      <p className="text-[10px] text-slate-400 mb-3">Why URLLC matters for emergency response</p>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} width={80} />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.02)'}} />
            <Bar dataKey="latency" isAnimationActive={true} animationDuration={1000} radius={[0, 6, 6, 0]}>
              {data.map((entry, index) => {
                let color = '#ef4444';
                if (entry.latency < 2) color = '#10b981';
                else if (entry.latency < 50) color = '#f59e0b';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
