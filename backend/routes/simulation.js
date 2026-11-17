const express = require('express');
const router = express.Router();

const { venues, state, getVenueObj } = require('../state/globalState');
const { getLog, logEvent } = require('../utils/logger');
const { activateEmergencySlice, degradeEmbbSlice, setupSlices, rebalanceSlices } = require('../engines/sliceManager');
const { computeNetworkMetrics } = require('../engines/erlangB');

// We'll need a mock or reference to v2xEngine here. We can require it later or pass it.
// To avoid circular dependency during dev, we'll require it when needed.
const { startIncidentVehicles, triggerV2XIncident, resolveIncidentV2X } = require('../engines/v2xEngine');

router.get('/state', (req, res) => {
  const venue = getVenueObj();
  res.json({
    venue,
    crowdSize: state.crowdSize,
    slices: require('../engines/sliceManager').getSliceStatus(),
    metrics: state.activeMetrics,
    incidentActive: state.incidentActive,
    emergencySliceActive: state.emergencySliceActive,
    networkStatus: state.networkStatus,
    eventLog: getLog(),
    history: state.metricsHistory
  });
});

router.post('/configure', (req, res) => {
  const { venueId, crowdSize, emergencySliceActive } = req.body;
  if(venues[venueId]) {
    state.activeVenue = venueId;
    logEvent('SYSTEM', `Venue changed to ${venues[venueId].name}`);
  }
  if(crowdSize !== undefined) state.crowdSize = crowdSize;
  if(emergencySliceActive !== undefined) state.emergencySliceActive = emergencySliceActive;

  const venue = getVenueObj();
  setupSlices(venue);
  rebalanceSlices();
  
  res.json({ success: true, metrics: state.activeMetrics });
});

router.post('/crowd', (req, res) => {
  const { crowdSize } = req.body;
  state.crowdSize = crowdSize;
  
  const venue = getVenueObj();
  state.activeMetrics = computeNetworkMetrics(crowdSize, venue, state.emergencySliceActive);
  
  const io = req.app.get('io');
  if(io) {
    io.emit('metrics:update', {
      metrics: state.activeMetrics,
      crowdSize: state.crowdSize,
      history: state.metricsHistory,
      networkStatus: state.networkStatus
    });
  }

  res.json({ metrics: state.activeMetrics });
});

router.post('/incident/trigger', async (req, res) => {
  const preIncidentMetrics = { ...state.activeMetrics };
  const venue = getVenueObj();
  
  state.incidentActive = true;
  state.emergencySliceActive = true;
  state.crowdSize = Math.floor(venue.capacity * 0.88);
  
  activateEmergencySlice();
  degradeEmbbSlice(30);

  logEvent('ALERT', `🚨 [INCIDENT] ${venue.incidentScenario.title}`);

  // Compute metrics FIRST so we can include them in the email
  const newMetrics = computeNetworkMetrics(state.crowdSize, venue, state.emergencySliceActive);
  state.activeMetrics = newMetrics;

  // V2X Start
  triggerV2XIncident(venue);

  // Send email with current metrics
  const { sendIncidentAlertEmail } = require('../utils/mailer');
  const emailResult = await sendIncidentAlertEmail(venue, {
    crowdSize: state.crowdSize,
    civilianBlocking: newMetrics.civilianBlocking,
    utilization: newMetrics.utilization
  });

  if (emailResult) {
    if (emailResult.type === 'resend') {
      logEvent('INFO', `📧 Alert email delivered to userverified8888@gmail.com via Resend`);
    } else if (emailResult.type === 'gmail') {
      logEvent('INFO', `📧 Alert email delivered to userverified8888@gmail.com via Gmail`);
    } else if (emailResult.previewUrl) {
      logEvent('INFO', `📧 Test email sent. View: ${emailResult.previewUrl}`);
    }
  }

  const io = req.app.get('io');
  if (io) {
    io.emit('incident:triggered', {
      scenario: venue.incidentScenario,
      metrics: state.activeMetrics,
      preIncidentMetrics,
      emailResult
    });
  }

  res.json({ incidentDetails: venue.incidentScenario, metrics: state.activeMetrics, preIncidentMetrics, emailResult });
});

router.post('/incident/resolve', (req, res) => {
  state.incidentActive = false;
  state.emergencySliceActive = false;
  degradeEmbbSlice(0); // Restore eMBB
  
  logEvent('INFO', 'Incident resolved. Resuming nominal operations.');
  
  resolveIncidentV2X();
  
  res.json({ success: true });
});

router.post('/emergency-slice/toggle', (req, res) => {
  const { active } = req.body;
  state.emergencySliceActive = active;
  logEvent('SYSTEM', `Emergency slice manually ${active ? 'ACTIVATED' : 'DEACTIVATED'}`);
  res.json({ success: true, active });
});

router.get('/history', (req, res) => {
  res.json(state.metricsHistory);
});

router.post('/reset', (req, res) => {
  state.crowdSize = 25000;
  state.incidentActive = false;
  state.emergencySliceActive = false;
  degradeEmbbSlice(0);
  resolveIncidentV2X();
  state.metricsHistory = [];
  state.networkStatus = 'NOMINAL';
  logEvent('SYSTEM', 'Simulation full reset initiated.');
  res.json({ success: true });
});

module.exports = router;
