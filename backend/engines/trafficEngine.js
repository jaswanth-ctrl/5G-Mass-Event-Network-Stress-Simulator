// trafficEngine calculates load metrics based on crowd and venue.

function computeTrafficLoad(crowdSize, venueConfig) {
  // Peak busy hour assumption: 25% of crowd simultaneously active.
  const activeCrowd = crowdSize * 0.25;
  
  // Traffic intensity per UE increased to cause saturation tracking
  const totalErlangs = activeCrowd * 0.05;

  // Breakdown by slice roughly
  // eMBB: 70%, URLLC: 10%, MMTC: 20%
  // During an incident, URLLC volume surges, eMBB crashes
  return {
    totalErlangs,
    activeCrowd,
    embb: totalErlangs * 0.70,
    urllc: totalErlangs * 0.10,
    mmtc: totalErlangs * 0.20
  };
}

module.exports = {
  computeTrafficLoad
};
