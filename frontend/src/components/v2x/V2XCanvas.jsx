import { useEffect, useRef, useCallback } from 'react';

export const V2XCanvas = ({ v2xState, venue, crowdSize }) => {
  const canvasRef = useRef(null);
  // Store data in refs so the animation loop reads latest data WITHOUT re-creating
  const dataRef = useRef({ v2xState: null, venue: null, crowdSize: 0 });
  const animRef = useRef(null);
  const angleRef = useRef(0);

  // Update ref on every prop change — NO re-render of canvas
  useEffect(() => {
    dataRef.current = { v2xState, venue, crowdSize };
  }, [v2xState, venue, crowdSize]);

  // Single persistent animation loop — created ONCE, never destroyed
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const { v2xState: state, venue: v } = dataRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const angle = angleRef.current;

      // === BACKGROUND ===
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y <= H; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Radar circles
      const maxR = Math.min(W, H) * 0.45;
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75, 1.0].forEach(f => {
        ctx.beginPath(); ctx.arc(cx, cy, maxR * f, 0, Math.PI * 2); ctx.stroke();
      });

      // Crosshair
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();

      // Sweep
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR);
      sg.addColorStop(0, 'rgba(56,189,248,0.25)');
      sg.addColorStop(1, 'rgba(56,189,248,0.01)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, maxR, -0.5, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(56,189,248,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(maxR, 0); ctx.stroke();
      ctx.restore();

      angleRef.current += 0.012;

      // === DATA LAYER ===
      const vehicles = state?.vehicles || [];
      const civilians = state?.civilianVehicles || [];

      // Target zone
      if (v?.incidentScenario?.targetLocation) {
        const tgt = v.incidentScenario.targetLocation;
        const tx = tgt.x * W, ty = tgt.y * H;
        const pulse = 28 + Math.sin(angle * 3) * 6;
        
        ctx.beginPath(); ctx.arc(tx, ty, pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239,68,68,0.08)'; ctx.fill();
        ctx.strokeStyle = 'rgba(239,68,68,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
        
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(239,68,68,0.4)';
        ctx.beginPath(); ctx.moveTo(tx - 20, ty); ctx.lineTo(tx + 20, ty); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx, ty - 20); ctx.lineTo(tx, ty + 20); ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#ef4444'; ctx.font = 'bold 9px monospace';
        ctx.fillText('INCIDENT', tx + 16, ty - 8);
      }

      // A* paths
      vehicles.forEach(ev => {
        if (!ev.path || ev.path.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(ev.position.x * W, ev.position.y * H);
        const start = ev.pathIndex || 0;
        for (let i = start; i < ev.path.length; i++) {
          ctx.lineTo(ev.path[i].x * W, ev.path[i].y * H);
        }
        const c = ev.type === 'ambulance' ? '56,189,248' : ev.type === 'police' ? '168,85,247' : '239,68,68';
        ctx.strokeStyle = `rgba(${c},0.25)`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Civilians
      civilians.forEach(c => {
        const px = c.position.x * W, py = c.position.y * H;
        let color, r;
        if (c.status === 'warned') { color = '#fbbf24'; r = 5; }
        else if (c.status === 'cleared') { color = '#34d399'; r = 3.5; }
        else { color = '#64748b'; r = 3.5; }
        
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
        
        if (c.status === 'warned') {
          ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(251,191,36,0.12)'; ctx.fill();
        }
      });

      // Emergency vehicles
      vehicles.forEach(ev => {
        const px = ev.position.x * W, py = ev.position.y * H;
        const rgb = ev.type === 'ambulance' ? '56,189,248' : ev.type === 'police' ? '168,85,247' : '239,68,68';
        const hex = ev.type === 'ambulance' ? '#38bdf8' : ev.type === 'police' ? '#a855f7' : '#ef4444';
        
        // Glow ring
        const ringR = 14 + Math.sin(angle * 6) * 3;
        ctx.beginPath(); ctx.arc(px, py, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb},0.4)`; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = `rgba(${rgb},0.06)`; ctx.fill();
        
        // Solid dot
        ctx.shadowBlur = 15;
        ctx.shadowColor = hex;
        ctx.fillStyle = hex;
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        
        // Label
        ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 10px monospace';
        ctx.fillText(ev.id, px + 12, py + 3);
        ctx.fillStyle = ev.status === 'ARRIVED' ? '#34d399' : '#94a3b8';
        ctx.font = '8px monospace';
        ctx.fillText(ev.status || 'EN ROUTE', px + 12, py + 14);
      });

      // HUD overlay
      const hudH = 55;
      ctx.fillStyle = 'rgba(15,23,42,0.85)';
      const hudR = { x: 10, y: H - hudH - 10, w: 210, h: hudH };
      ctx.fillRect(hudR.x, hudR.y, hudR.w, hudR.h);
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
      ctx.strokeRect(hudR.x, hudR.y, hudR.w, hudR.h);
      
      const warned = civilians.filter(c => c.status === 'warned').length;
      const cleared = civilians.filter(c => c.status === 'cleared').length;
      
      ctx.font = '9px monospace';
      ctx.fillStyle = '#94a3b8'; ctx.fillText(`TOTAL: ${civilians.length}`, hudR.x + 8, hudR.y + 14);
      ctx.fillStyle = '#38bdf8'; ctx.fillText(`RESPONDERS: ${vehicles.length}`, hudR.x + 110, hudR.y + 14);
      ctx.fillStyle = '#fbbf24'; ctx.fillText(`WARNED: ${warned}`, hudR.x + 8, hudR.y + 30);
      ctx.fillStyle = '#34d399'; ctx.fillText(`CLEARED: ${cleared}`, hudR.x + 8, hudR.y + 46);
      ctx.fillStyle = state?.incidentActive ? '#ef4444' : '#64748b';
      ctx.fillText(state?.incidentActive ? 'ACTIVE' : 'STANDBY', hudR.x + 110, hudR.y + 30);

      animRef.current = requestAnimationFrame(render);
    };

    render();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []); // Empty deps — runs ONCE, reads data from ref

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden rounded-2xl bg-slate-900 shadow-xl border border-slate-700" style={{minHeight: '500px'}}>
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-white font-bold tracking-widest uppercase text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
          Tactical V2X Orchestration
        </h3>
        <p className="text-slate-400 text-xs font-mono mt-1">Live C-V2X (PC5) Node Map | MEC Compute Active</p>
      </div>

      <div className="absolute top-4 right-4 z-10 bg-slate-800/90 backdrop-blur border border-slate-700 p-3 rounded-lg text-[11px] font-mono flex flex-col gap-1.5">
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-slate-400 rounded-full"></div><span className="text-slate-300">Civilian</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-amber-400 rounded-full"></div><span className="text-amber-300">Warned</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-400 rounded-full"></div><span className="text-emerald-300">Cleared</span></div>
        <hr className="border-slate-700 my-0.5" />
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-sky-400 rounded-full"></div><span className="text-sky-300">Ambulance</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-purple-400 rounded-full"></div><span className="text-purple-300">Police</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-red-400 rounded-full"></div><span className="text-red-300">Fire</span></div>
      </div>

      <div className="flex-1 w-full">
        <canvas ref={canvasRef} width={1000} height={600} className="w-full h-full" />
      </div>
    </div>
  );
};
