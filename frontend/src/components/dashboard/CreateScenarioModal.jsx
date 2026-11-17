import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import axios from 'axios';

export const CreateScenarioModal = ({ isOpen, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    capacity: 50000,
    frequencyBand: '3.5 GHz (n78)',
    incidentTitle: '',
    incidentDescription: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    await axios.post('/api/venues/add', {
      id,
      ...formData
    });
    onCreated(id);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
        >
          <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-900">Create Custom Scenario</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-sm">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Scenario / Venue Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 outline-none focus:border-blue-500" placeholder="e.g. World Cup Final Stadium" />
            </div>
            
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Max Capacity (UEs)</label>
              <input required type="number" min="1000" max="1000000" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 outline-none focus:border-blue-500" />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">V2X Emergency Alert Title</label>
              <input required value={formData.incidentTitle} onChange={e => setFormData({...formData, incidentTitle: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 outline-none focus:border-blue-500" placeholder="e.g. Multi-Vehicle Collision on I-95" />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Alert Description</label>
              <textarea required value={formData.incidentDescription} onChange={e => setFormData({...formData, incidentDescription: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 outline-none focus:border-blue-500 resize-none h-20" placeholder="Describe the incident requirements for the NOC..."></textarea>
            </div>

            <button type="submit" className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">
              Deploy Scenario
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
