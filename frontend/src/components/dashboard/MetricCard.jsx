import { motion } from 'framer-motion';
import { useMemo, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Mini sparkline drawn on canvas for zero-dependency performance
const Sparkline = ({ data = [], color = '#3b82f6', height = 28, width = 80 }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...data);
    const max = Math.max(...data) || 1;
    const range = max - min || 1;
    const stepX = width / (data.length - 1);

    // Fill
    ctx.beginPath();
    ctx.moveTo(0, height);
    data.forEach((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = color + '15';
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // End dot
    const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;
    ctx.beginPath();
    ctx.arc(width, lastY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [data, color, height, width]);

  return <canvas ref={canvasRef} style={{ width, height }} />;
};

export const MetricCard = ({ title, value, formatter, statusColor = 'text-slate-900', icon, subtitle, history = [], sparkColor, alert }) => {
  const displayValue = formatter ? formatter(value) : value;

  // Compute trend from last 5 values
  const trend = useMemo(() => {
    if (history.length < 3) return 'stable';
    const recent = history.slice(-5);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const diff = last - first;
    if (Math.abs(diff) < 0.5) return 'stable';
    return diff > 0 ? 'up' : 'down';
  }, [history]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-emerald-400' : 'text-slate-300';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border rounded-xl p-4 shadow-sm transition-all relative overflow-hidden ${alert ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}
    >
      {alert && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 via-orange-400 to-red-500 animate-pulse"></div>
      )}
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{title}</h3>
        <div className="flex items-center gap-1">
          <TrendIcon size={12} className={trendColor} />
          {icon && <div className="text-slate-300 ml-1">{icon}</div>}
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <div className={`text-2xl font-black font-mono tracking-tight ${statusColor}`}>
            {displayValue}
          </div>
          {subtitle && <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{subtitle}</p>}
        </div>
        {history.length > 2 && (
          <Sparkline data={history.slice(-20)} color={sparkColor || '#3b82f6'} height={28} width={70} />
        )}
      </div>
    </motion.div>
  );
};
