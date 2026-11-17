require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { state, getVenueObj } = require('./state/globalState');
const { computeNetworkMetrics } = require('./engines/erlangB');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
});

app.set('io', io);
require('./utils/logger').setLoggerIo(io);

const { setupSlices, rebalanceSlices, getSliceStatus } = require('./engines/sliceManager');
const { v2xTick } = require('./engines/v2xEngine');
const { initMailer } = require('./utils/mailer');

initMailer();
setupSlices(getVenueObj());

const simulationRoutes = require('./routes/simulation');
const sliceRoutes = require('./routes/slices');

app.use('/api/simulation', simulationRoutes);
app.use('/api/slices', sliceRoutes);
app.use('/api/v2x', require('./routes/v2x'));

app.get('/api/venues', (req, res) => {
  const { venues } = require('./state/globalState');
  res.json(venues);
});

app.post('/api/venues/add', (req, res) => {
  const { addVenue } = require('./state/globalState');
  const { id, name, capacity, frequencyBand, backhaul, incidentTitle, incidentDescription } = req.body;
  const cap = parseInt(capacity) || 50000;

  const newVenue = {
    id, name, capacity: cap,
    totalChannels: Math.floor(cap * 0.01),
    smallCells: Math.floor(cap / 5000) + 5,
    frequencyBand: frequencyBand || "3.5 GHz (n78)",
    backhaul: backhaul || "Fiber",
    emergencyChannels: Math.floor(cap * 0.0015),
    slices: {
      embb:  { channels: Math.floor(cap * 0.005), minBandwidthMbps: 100, maxLatencyMs: 50 },
      urllc: { channels: Math.floor(cap * 0.002), minBandwidthMbps: 10,  maxLatencyMs: 1  },
      mmtc:  { channels: Math.floor(cap * 0.0015), minBandwidthMbps: 1,   maxLatencyMs: 500}
    },
    incidentScenario: {
      title: incidentTitle || "Unexpected Emergency",
      description: incidentDescription || "Emergency declared. Routing units via MEC edge.",
      vehicleCount: 4,
      targetLocation: { x: 0.5, y: 0.5 }
    }
  };

  addVenue(id, newVenue);
  const { logEvent } = require('./utils/logger');
  logEvent('SYSTEM', `New Custom Scenario Created: ${name}`);
  res.json({ success: true, venue: newVenue });
});

app.get('/', (req, res) => {
  res.send('5G Network Simulation Engine Running');
});

// ======= MAIN SIMULATION LOOP — 1s tick for live feel =======
let tickCount = 0;

setInterval(() => {
  const venue = getVenueObj();
  tickCount++;

  // Realistic crowd fluctuation (smaller, more frequent)
  const fluctuation = Math.floor(Math.random() * 600) - 300;
  state.crowdSize = Math.max(1000, Math.min(venue.capacity, state.crowdSize + fluctuation));

  // Compute full metrics
  const newMetrics = computeNetworkMetrics(
    state.crowdSize, venue, state.emergencySliceActive, state.incidentActive
  );
  state.activeMetrics = newMetrics;

  rebalanceSlices();
  v2xTick(io);

  // Network status determination
  if (state.incidentActive) {
    state.networkStatus = "CRITICAL";
  } else if (newMetrics.civilianBlocking > 0.5) {
    state.networkStatus = "CRITICAL";
  } else if (newMetrics.civilianBlocking > 0.05 || newMetrics.utilization > 60) {
    state.networkStatus = "CONGESTED";
  } else {
    state.networkStatus = "NOMINAL";
  }

  // Build rich history point
  const slices = getSliceStatus();
  const historyPoint = {
    time: Date.now(),
    tick: tickCount,
    civilianBlocking: +(newMetrics.civilianBlocking * 100).toFixed(2),
    emergencyBlocking: +(newMetrics.emergencyBlocking * 100).toFixed(2),
    utilization: +newMetrics.utilization.toFixed(1),
    embbBlocking: +(slices.embb.blocking * 100).toFixed(2),
    urllcBlocking: +(slices.urllc.blocking * 100).toFixed(2),
    mmtcBlocking: +(slices.mmtc.blocking * 100).toFixed(2),
    embbLatency: slices.embb.latency,
    urllcLatency: slices.urllc.latency,
    crowdSize: state.crowdSize,
    incidentActive: state.incidentActive
  };

  state.metricsHistory.push(historyPoint);
  if (state.metricsHistory.length > 120) {
    state.metricsHistory.shift();
  }

  // Build policy decisions list (what SDN is doing right now)
  const policyDecisions = [];
  if (state.incidentActive) {
    policyDecisions.push({ action: 'PREEMPT', slice: 'eMBB', detail: 'Degraded 30% → channels shifted to URLLC' });
    policyDecisions.push({ action: 'ACTIVATE', slice: 'Emergency', detail: `${venue.emergencyChannels} channels reserved exclusively` });
    policyDecisions.push({ action: 'BOOST', slice: 'URLLC', detail: 'Priority 1 — sub-1ms guaranteed for V2X' });
    policyDecisions.push({ action: 'CORRIDOR', slice: 'Emergency', detail: 'Emergency Corridor Mode — priority zone active' });
  }

  if (newMetrics.utilization > 70) {
    policyDecisions.push({ action: 'THROTTLE', slice: 'mMTC', detail: `High load ${newMetrics.utilization.toFixed(0)}% — IoT deprioritized` });
  }

  // Emit comprehensive update
  io.emit('metrics:update', {
    metrics: newMetrics,
    crowdSize: state.crowdSize,
    history: state.metricsHistory,
    networkStatus: state.networkStatus,
    slices,
    policyDecisions,
    incidentActive: state.incidentActive
  });

  io.emit('slice:changed', slices);

}, 1000); // 1-second tick for live feel

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Backend simulation engine running on port ${PORT}`);
});
