import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { CreateScenarioModal } from './CreateScenarioModal';

export const VenueSelector = ({ venues, activeVenueId, onSelect, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const switchVenue = async (id) => {
    await axios.post('/api/simulation/configure', { venueId: id });
    onSelect(id);
  };

  const handleCreated = async (id) => {
    await onRefresh();
    await switchVenue(id);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center pr-1">
        <h3 className="text-xs font-bold text-slate-500 uppercase">Venue Configuration</h3>
        <button onClick={() => setIsModalOpen(true)} className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs font-bold">
          <Plus size={14} /> NEW
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {Object.values(venues).map(v => {
          const isActive = activeVenueId === v.id;
          return (
            <button
              key={v.id}
              onClick={() => switchVenue(v.id)}
              className={`relative text-left p-3 rounded-lg border transition-colors ${isActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
            >
              {isActive && (
                <motion.div 
                  layoutId="venueActive" 
                  className="absolute inset-0 border-2 border-blue-500 rounded-lg z-0" 
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative z-10">
                <div className={`font-semibold text-sm mb-1 ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>{v.name.split('—')[0]}</div>
                <div className={`text-xs font-mono ${isActive ? 'text-blue-500' : 'text-slate-500'}`}>{v.frequencyBand}</div>
              </div>
            </button>
          );
        })}
      </div>
      
      <CreateScenarioModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={handleCreated} 
      />
    </div>
  );
};
