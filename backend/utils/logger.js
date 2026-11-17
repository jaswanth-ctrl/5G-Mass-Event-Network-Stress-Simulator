const { v4: uuidv4 } = require('uuid');

let eventLog = [];
let globalIo = null;

function setLoggerIo(io) {
  globalIo = io;
}

function getLog() {
  return eventLog;
}

function logEvent(type, message, sliceId = null) {
  const entry = {
    id: uuidv4(),
    timestamp: Date.now(),
    type, // [INFO, WARN, ALERT, SYSTEM, PROTECT]
    message,
    sliceId
  };
  eventLog.unshift(entry); // Newest at top
  
  try {
    const io = require('../index'); // this won't work well due to circular dependency, so we'll grab it via app level or pass it
    // Actually simpler to store a global reference or just emit it when we pass io.
    // We can expose a function to register io.
  } catch (e) {}

  // Keep only latest 100
  if (eventLog.length > 100) {
    eventLog.pop();
  }
  
  if (globalIo) {
    globalIo.emit('log:entry', entry);
  }
  
  return entry;
}

// Pre-populate some realistic entries
logEvent('INFO', 'Erlang-B model initialized: A=200E, N=500ch');
logEvent('INFO', 'All 3 slices nominal. Emergency corridor standby.');
logEvent('INFO', 'eMBB utilization: 41.2% — within SLA bounds');

module.exports = {
  getLog,
  logEvent,
  setLoggerIo
};
