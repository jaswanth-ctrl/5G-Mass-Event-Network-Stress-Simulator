const venues = {
  ipl: {
    id: "ipl",
    name: "IPL Final — MA Chidambaram Stadium, Chennai",
    capacity: 50000,
    totalChannels: 500,
    smallCells: 12,
    frequencyBand: "3.5 GHz (n78)",
    backhaul: "Fiber + mmWave",
    emergencyChannels: 80,
    slices: {
      embb:  { channels: 280, minBandwidthMbps: 100, maxLatencyMs: 50 },
      urllc: { channels: 140, minBandwidthMbps: 10,  maxLatencyMs: 1  },
      mmtc:  { channels: 80,  minBandwidthMbps: 1,   maxLatencyMs: 500}
    },
    incidentScenario: {
      title: "Stampede at Gate 5 — North Stand",
      description: "Crowd surge detected. Gate 5 barrier collapse. 23 injured, 4 critical. NDRF team dispatched from Guindy.",
      vehicleCount: 3,
      targetLocation: { x: 0.65, y: 0.3 }
    }
  },
  kumbh: {
    id: "kumbh",
    name: "Kumbh Mela — Triveni Sangam, Prayagraj",
    capacity: 800000,
    totalChannels: 3000,
    smallCells: 85,
    frequencyBand: "700 MHz (n28) + 3.5 GHz (n78)",
    backhaul: "VSAT + Fiber",
    emergencyChannels: 400,
    slices: {
      embb:  { channels: 1600, minBandwidthMbps: 20,  maxLatencyMs: 100 },
      urllc: { channels: 1000, minBandwidthMbps: 5,   maxLatencyMs: 1   },
      mmtc:  { channels: 400,  minBandwidthMbps: 0.5, maxLatencyMs: 1000}
    },
    incidentScenario: {
      title: "Crowd crush at Sangam Ghat — Prayagraj",
      description: "Mass casualty event. Crowd crush at main bathing ghat. Estimated 60+ affected. NDRF teams en route. Helicopter medical evacuation requested.",
      vehicleCount: 6,
      targetLocation: { x: 0.4, y: 0.55 }
    }
  },
  concert: {
    id: "concert",
    name: "EDM Concert — MMRDA Grounds, BKC Mumbai",
    capacity: 75000,
    totalChannels: 700,
    smallCells: 20,
    frequencyBand: "2.6 GHz (n41) + 28 GHz (n257 mmWave)",
    backhaul: "MPLS + mmWave",
    emergencyChannels: 100,
    slices: {
      embb:  { channels: 400, minBandwidthMbps: 150, maxLatencyMs: 30  },
      urllc: { channels: 200, minBandwidthMbps: 20,  maxLatencyMs: 1   },
      mmtc:  { channels: 100, minBandwidthMbps: 2,   maxLatencyMs: 200 }
    },
    incidentScenario: {
      title: "Stage structure partial collapse — Stage B",
      description: "Structural failure of secondary stage rigging. 3 crew members trapped, 15 audience members injured. Mumbai Fire Brigade and BEST Trauma Unit dispatched.",
      vehicleCount: 4,
      targetLocation: { x: 0.55, y: 0.45 }
    }
  }
};

const state = {
  activeVenue: "ipl",
  crowdSize: 20000,
  incidentActive: false,
  emergencySliceActive: false,
  metricsHistory: [],
  networkStatus: "NOMINAL", // NOMINAL, CONGESTED, CRITICAL
  activeMetrics: {
    civilianBlocking: 0,
    emergencyBlocking: 0,
    totalErlangs: 0,
    utilization: 0,
    droppedCallsPerMin: 0
  }
};

const getVenueObj = () => venues[state.activeVenue];

const addVenue = (venueId, venueData) => {
  venues[venueId] = venueData;
};

module.exports = {
  venues,
  state,
  getVenueObj,
  addVenue
};
