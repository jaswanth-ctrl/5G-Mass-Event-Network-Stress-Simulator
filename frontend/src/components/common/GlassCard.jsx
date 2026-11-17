import { motion } from 'framer-motion';

export const GlassCard = ({ children, className = '' }) => {
  return (
    <div className={`bg-white/90 backdrop-blur-[12px] border border-slate-200 rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
};
