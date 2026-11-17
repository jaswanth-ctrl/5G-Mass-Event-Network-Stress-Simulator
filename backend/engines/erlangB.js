/**
 * Erlang-B blocking probability engine
 * Implements the exact Jagerman recursive formula.
 */

function erlangB(A, N) {
  if (N <= 0) return 1;
  if (A <= 0) return 0;
  let B = 1;
  for (let i = 1; i <= N; i++) {
    B = (A * B) / (i + A * B);
  }
  return Math.min(B, 0.9999);
}

/**
 * Computes comprehensive network metrics with per-slice breakdown.
 */
function computeNetworkMetrics(crowdSize, venue, emergencySliceActive, incidentActive) {
  const activeCrowd = crowdSize * 0.25;
  // Increase offered traffic per user to ensure the network actually saturates and blocks 
  const totalErlangs = activeCrowd * 0.05;

  // --- Jitter for live feel (±3%) ---
  const jitter = () => 1 + (Math.random() * 0.06 - 0.03);

  let civilianChannels = venue.totalChannels;
  let emergencyChannelsAllocated = 0;

  if (emergencySliceActive) {
    civilianChannels -= venue.emergencyChannels;
    emergencyChannelsAllocated = venue.emergencyChannels;
  }

  const civilianBlocking = erlangB(totalErlangs * jitter(), civilianChannels);
  // Simulate heavy emergency comms load when active (close to allocated capacity to show slight blocking)
  const emergencyErlangs = emergencySliceActive ? (emergencyChannelsAllocated * 0.9) * jitter() : 0;
  let emergencyBlocking = 0;

  if (emergencySliceActive && emergencyChannelsAllocated > 0) {
    emergencyBlocking = erlangB(emergencyErlangs, emergencyChannelsAllocated);
  } else if (!emergencySliceActive && emergencyErlangs > 0) {
    emergencyBlocking = erlangB(totalErlangs + emergencyErlangs, civilianChannels);
  }

  const utilization = Math.min((totalErlangs / (civilianChannels > 0 ? civilianChannels : 1)) * 100, 100);
  const callsPerMinute = activeCrowd * 0.1;
  const droppedCallsPerMin = Math.round(callsPerMinute * civilianBlocking);

  // --- Per-slice latency that reacts to load ---
  const loadFactor = utilization / 100;
  const baseEmbbLatency = venue.slices.embb.maxLatencyMs;
  const baseUrllcLatency = venue.slices.urllc.maxLatencyMs;
  const baseMmtcLatency = venue.slices.mmtc.maxLatencyMs;

  // Latency increases under load — exponentially near saturation
  const latencyMultiplier = 1 + Math.pow(loadFactor, 3) * 4;
  const incidentPenalty = incidentActive ? 1.8 : 1.0;

  const embbLatency = +(baseEmbbLatency * latencyMultiplier * incidentPenalty * jitter()).toFixed(1);
  const urllcLatency = +(baseUrllcLatency * jitter() * (incidentActive ? 0.5 : 1)).toFixed(2); // URLLC improves during incident (preemption)
  const mmtcLatency = +(baseMmtcLatency * latencyMultiplier * incidentPenalty * jitter()).toFixed(0);
  const emergencyLatency = emergencySliceActive ? +(0.8 * jitter()).toFixed(2) : 0;

  // --- Throughput per slice ---
  const embbThroughput = Math.max(5, Math.round(venue.slices.embb.minBandwidthMbps * (1 - loadFactor * 0.6) * (incidentActive ? 0.6 : 1) * jitter()));
  const urllcThroughput = Math.round(venue.slices.urllc.minBandwidthMbps * jitter());
  const mmtcThroughput = Math.max(0.1, +(venue.slices.mmtc.minBandwidthMbps * (1 - loadFactor * 0.3) * jitter()).toFixed(1));

  return {
    civilianBlocking,
    emergencyBlocking,
    totalErlangs: +(totalErlangs * jitter()).toFixed(1),
    utilization: +utilization.toFixed(1),
    droppedCallsPerMin,
    activeCrowd: Math.round(activeCrowd),
    // Per-slice latencies
    latency: { embb: embbLatency, urllc: urllcLatency, mmtc: mmtcLatency, emergency: emergencyLatency },
    // Throughput
    throughput: { embb: embbThroughput, urllc: urllcThroughput, mmtc: mmtcThroughput },
    // Load factor for UI
    loadFactor: +loadFactor.toFixed(3)
  };
}

module.exports = { erlangB, computeNetworkMetrics };
