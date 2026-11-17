export const formatNumberIN = (num) => {
  if (num === null || num === undefined) return '0';
  return Math.round(num).toLocaleString('en-IN');
};

export const formatPercent = (val) => {
  if (val === null || val === undefined) return '0.0';
  return (val * 100).toFixed(1);
};

export const formatErlangs = (val) => {
  if (val === null || val === undefined) return '0';
  return Math.round(val).toLocaleString('en-IN') + ' E';
};

export const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'NOMINAL':
    case 'GUARANTEED':
      return 'text-emerald-600';
    case 'CONGESTED':
    case 'AT RISK':
      return 'text-amber-600';
    case 'CRITICAL':
    case 'VIOLATED':
      return 'text-red-600';
    default:
      return 'text-slate-500';
  }
};
