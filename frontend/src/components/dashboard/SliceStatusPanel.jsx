import { SliceDetailCard } from '../slices/SliceDetailCard';

export const SliceStatusPanel = ({ slices }) => {
  if (!slices || !slices.embb) return null;

  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <SliceDetailCard 
        title="Enhanced Mobile Broadband" 
        type="eMBB" 
        colorTag="bg-blue-500" 
        sliceStatus={slices.embb} 
      />
      <SliceDetailCard 
        title="Ultra-Reliable Low Latency" 
        type="URLLC" 
        colorTag="bg-purple-500" 
        sliceStatus={slices.urllc} 
      />
      <SliceDetailCard 
        title="Massive Machine Type" 
        type="mMTC" 
        colorTag="bg-slate-500" 
        sliceStatus={slices.mmtc} 
      />
      <SliceDetailCard 
        title="Emergency Corridor" 
        type="Emergency" 
        colorTag="bg-emerald-500" 
        sliceStatus={slices.emergency} 
      />
    </div>
  );
};
