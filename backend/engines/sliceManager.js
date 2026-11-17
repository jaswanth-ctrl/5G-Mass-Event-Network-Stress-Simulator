const { state, getVenueObj } = require('../state/globalState');
const { logEvent } = require('../utils/logger');
const { computeTrafficLoad } = require('./trafficEngine');
const { erlangB } = require('./erlangB');

let sliceStates = {
  embb: { allocatedChannels: 0, rejectedRequests: 0, status: 'GUARANTEED', latency: 30, trafficErlangs: 0, blocking: 0 },
  urllc: { allocatedChannels: 0, rejectedRequests: 0, status: 'GUARANTEED', latency: 1, trafficErlangs: 0, blocking: 0 },
  mmtc: { allocatedChannels: 0, rejectedRequests: 0, status: 'GUARANTEED', latency: 200, trafficErlangs: 0, blocking: 0 },
  emergency: { allocatedChannels: 0, rejectedRequests: 0, status: 'GUARANTEED', latency: 1, trafficErlangs: 0, blocking: 0 }
};

let degradedPercent = 0;

function setupSlices(venue) {
  sliceStates.embb.allocatedChannels = venue.slices.embb.channels;
  sliceStates.urllc.allocatedChannels = venue.slices.urllc.channels;
  sliceStates.mmtc.allocatedChannels = venue.slices.mmtc.channels;
  sliceStates.emergency.allocatedChannels = venue.emergencyChannels;
  
  sliceStates.embb.status = 'GUARANTEED';
  sliceStates.urllc.status = 'GUARANTEED';
  sliceStates.mmtc.status = 'GUARANTEED';
  sliceStates.emergency.status = 'GUARANTEED';

  degradedPercent = 0;
}

function rebalanceSlices() {
  const venue = getVenueObj();
  const traffic = computeTrafficLoad(state.crowdSize, venue);
  
  // Apply degraded percentage to eMBB if active
  let embbChannels = venue.slices.embb.channels;
  if (degradedPercent > 0) {
    const degradedAmount = Math.floor(embbChannels * (degradedPercent / 100));
    embbChannels -= degradedAmount;
    sliceStates.embb.allocatedChannels = embbChannels;
    sliceStates.urllc.allocatedChannels = venue.slices.urllc.channels + degradedAmount;
  } else {
    sliceStates.embb.allocatedChannels = embbChannels;
    sliceStates.urllc.allocatedChannels = venue.slices.urllc.channels;
  }

  // Calculate specific blockings
  sliceStates.embb.trafficErlangs = traffic.embb;
  sliceStates.embb.blocking = erlangB(traffic.embb, sliceStates.embb.allocatedChannels);
  
  sliceStates.urllc.trafficErlangs = traffic.urllc;
  sliceStates.urllc.blocking = erlangB(traffic.urllc, sliceStates.urllc.allocatedChannels);

  sliceStates.mmtc.trafficErlangs = traffic.mmtc;
  sliceStates.mmtc.blocking = erlangB(traffic.mmtc, sliceStates.mmtc.allocatedChannels);

  // Emergency is considered isolated
  const emergencyErlangs = state.emergencySliceActive ? 2.0 : 0;
  sliceStates.emergency.trafficErlangs = emergencyErlangs;
  sliceStates.emergency.blocking = state.emergencySliceActive ? erlangB(emergencyErlangs, sliceStates.emergency.allocatedChannels) : 0;

  // Evaluate SLA constraints
  const evaluateSLA = (sliceId, blocking, maxLatency) => {
    let stat = 'GUARANTEED';
    let addedLatency = 0;
    if (blocking > 0.05) {
      stat = 'AT RISK';
      addedLatency = Math.floor(maxLatency * 0.5);
    }
    if (blocking > 0.15) {
      stat = 'VIOLATED';
      addedLatency = Math.floor(maxLatency * 1.5);
    }
    
    // Check if status changed
    if (sliceStates[sliceId].status !== stat) {
      logEvent(stat === 'VIOLATED' ? 'ALERT' : stat === 'AT RISK' ? 'WARN' : 'INFO', 
        `Slice ${sliceId.toUpperCase()} status changed to ${stat}`, sliceId);
      // We will emit 'slice:changed' from index.js or let index.js observe it
    }
    
    sliceStates[sliceId].status = stat;
    
    // Simulate latency variation based on SLA and load adding jitter for all slices
    const baseLatency = venue.slices[sliceId === 'emergency' ? 'urllc' : sliceId]?.maxLatencyMs || maxLatency || 1;
    let jitter = (Math.random() * 0.1 - 0.05) * baseLatency; // 5% jitter
    if(sliceId === 'urllc' || sliceId === 'emergency'){
       jitter = (Math.random() * 0.4 - 0.2); // tighter jitter for URLLC
    }
    sliceStates[sliceId].latency = +(baseLatency + addedLatency + jitter).toFixed(2);
  };

  evaluateSLA('embb', sliceStates.embb.blocking, venue.slices.embb.maxLatencyMs);
  evaluateSLA('urllc', sliceStates.urllc.blocking, venue.slices.urllc.maxLatencyMs);
  evaluateSLA('mmtc', sliceStates.mmtc.blocking, venue.slices.mmtc.maxLatencyMs);
  
  if(state.emergencySliceActive){
    evaluateSLA('emergency', sliceStates.emergency.blocking, 1);
  }

  // Admissions control tracking
  ['embb', 'urllc', 'mmtc', 'emergency'].forEach(slice => {
    // If utilization > 90%, admission requests are rejected
    // Approximation: traffic / channels
    const util = (sliceStates[slice].trafficErlangs / (sliceStates[slice].allocatedChannels || 1));
    if (util > 0.9) {
      // Simulate rejecting requests
      sliceStates[slice].rejectedRequests += Math.floor(Math.random() * 5);
    }
  });

}

function activateEmergencySlice() {
  state.emergencySliceActive = true;
  logEvent('PROTECT', 'Emergency slice ACTIVATED. Channels reserved exclusively.');
}

function degradeEmbbSlice(percent) {
  degradedPercent = percent;
  logEvent('SYSTEM', `SDN Policy Enforced: eMBB slice degraded by ${percent}% to protect URLLC.`);
}

function getSliceStatus() {
  return sliceStates;
}

module.exports = {
  setupSlices,
  rebalanceSlices,
  activateEmergencySlice,
  degradeEmbbSlice,
  getSliceStatus
};
