import { useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import { useSocket } from './useSocket';

export const useSimulation = () => {
  const [venues, setVenues] = useState({});
  const [state, setState] = useState(null);
  const [v2xState, setV2xState] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [venuesRes, stateRes, v2xRes] = await Promise.all([
        api.get('/venues'),
        api.get('/simulation/state'),
        api.get('/v2x/state')
      ]);
      setVenues(venuesRes.data);
      setState(stateRes.data);
      setV2xState(v2xRes.data);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const onSocketEvent = useCallback((eventName, data) => {
    setState(prev => {
      if(!prev) return prev;
      const next = { ...prev };
      
      switch(eventName) {
        case 'metrics:update':
          next.metrics = data.metrics;
          next.crowdSize = data.crowdSize;
          next.networkStatus = data.networkStatus;
          next.history = data.history;
          next.slices = data.slices || next.slices;
          next.policyDecisions = data.policyDecisions || [];
          next.incidentActive = data.incidentActive;
          break;
        case 'incident:triggered':
          next.incidentActive = true;
          next.metrics = data.metrics;
          next.preIncidentMetrics = data.preIncidentMetrics;
          next.emergencySliceActive = true;
          break;
        case 'slice:changed':
          next.slices = data;
          break;
        case 'log:entry':
          next.eventLog = [data, ...(next.eventLog || [])].slice(0, 100);
          break;
      }
      return next;
    });

    setV2xState(prev => {
      if(!prev) return prev;
      const next = { ...prev };
      switch(eventName) {
        case 'vehicle:update':
          next.vehicles = data.vehicles;
          next.civilianVehicles = data.civilianVehicles;
          next.corridorStatus = data.incidentActive ? 'ACTIVE' : 'STANDBY';
          next.incidentActive = data.incidentActive;
          break;
        case 'incident:triggered':
          next.corridorStatus = 'ACTIVE';
          next.incidentActive = true;
          break;
        case 'v2x:broadcast':
          next.latestMessages = [...data, ...(next.latestMessages || [])].slice(0, 50);
          next.messagesLastSecond = data.length * 10;
          break;
      }
      return next;
    });
  }, []);

  useSocket(onSocketEvent);

  const setCrowdSize = async (size) => {
    setState(p => ({ ...p, crowdSize: size }));
    await api.post('/simulation/crowd', { crowdSize: size });
  };

  const triggerIncident = async () => {
    const res = await api.post('/simulation/incident/trigger');
    setState(p => ({ ...p, incidentActive: true, metrics: res.data.metrics, preIncidentMetrics: res.data.preIncidentMetrics }));
  };

  const toggleEmergencySlice = async (active) => {
    await api.post('/simulation/emergency-slice/toggle', { active });
    setState(p => ({ ...p, emergencySliceActive: active }));
  };
  
  const resetSimulation = async () => {
    await api.post('/simulation/reset');
    await fetchInitialData();
  };

  return {
    venues, state, v2xState, loading,
    setCrowdSize, triggerIncident, toggleEmergencySlice,
    resetSimulation, fetchInitialData
  };
};
