export const PulsingDot = ({ colorClass = 'bg-accent-green', animationClass = 'animate-pulse-nominal' }) => {
  return (
    <div className={`w-3 h-3 rounded-full ${colorClass} ${animationClass}`} />
  );
};
