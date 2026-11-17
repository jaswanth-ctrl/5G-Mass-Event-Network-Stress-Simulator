const { v4: uuidv4 } = require('uuid');
const { logEvent } = require('../utils/logger');

let vehicles = [];
let civilianVehicles = [];
let v2xInterval = null;
let broadcastInterval = null;

let isIncidentActive = false;
let globalIoRef = null;

// A* Node struct
class AStarNode {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.parent = null;
  }
}

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Compute A* Path across 50x50 grid for 0-1 coords
function computePathAStar(startX, startY, targetX, targetY) {
  const GRID_SIZE = 50;
  
  const sX = Math.floor(startX * (GRID_SIZE - 1));
  const sY = Math.floor(startY * (GRID_SIZE - 1));
  const tX = Math.floor(targetX * (GRID_SIZE - 1));
  const tY = Math.floor(targetY * (GRID_SIZE - 1));

  let grid = new Array(GRID_SIZE);
  for (let i = 0; i < GRID_SIZE; i++) {
    grid[i] = new Array(GRID_SIZE);
    for (let j = 0; j < GRID_SIZE; j++) {
      grid[i][j] = new AStarNode(i, j);
    }
  }

  let openList = [];
  let closedSet = new Set();
  
  const startNode = grid[sX][sY];
  const targetNode = grid[tX][tY];
  openList.push(startNode);

  const startTime = Date.now();
  let reached = false;

  while (openList.length > 0) {
    let lowInd = 0;
    for (let i = 0; i < openList.length; i++) {
      if (openList[i].f < openList[lowInd].f) lowInd = i;
    }
    let current = openList[lowInd];

    if (current.x === targetNode.x && current.y === targetNode.y) {
      reached = true;
      break;
    }

    openList.splice(lowInd, 1);
    closedSet.add(`${current.x},${current.y}`);

    let neighbors = [];
    if (current.x > 0) neighbors.push(grid[current.x - 1][current.y]);
    if (current.x < GRID_SIZE - 1) neighbors.push(grid[current.x + 1][current.y]);
    if (current.y > 0) neighbors.push(grid[current.x][current.y - 1]);
    if (current.y < GRID_SIZE - 1) neighbors.push(grid[current.x][current.y + 1]);

    for (let neighbor of neighbors) {
      if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;
      
      let gScore = current.g + 1;
      let gScoreIsBest = false;

      if (!openList.includes(neighbor)) {
        gScoreIsBest = true;
        neighbor.h = manhattan(neighbor, targetNode);
        openList.push(neighbor);
      } else if (gScore < neighbor.g) {
        gScoreIsBest = true;
      }

      if (gScoreIsBest) {
        neighbor.parent = current;
        neighbor.g = gScore;
        neighbor.f = neighbor.g + neighbor.h;
      }
    }
  }

  const computeTimeMs = Date.now() - startTime;
  let path = [];
  if (reached) {
    let curr = targetNode;
    while (curr.parent) {
      path.push({
        x: curr.x / (GRID_SIZE - 1),
        y: curr.y / (GRID_SIZE - 1)
      });
      curr = curr.parent;
    }
    path.reverse();
  }

  logEvent('SYSTEM', `MEC A* path: ${path.length} waypoints, ${Math.max(1, computeTimeMs)}ms compute`);
  return path;
}

function initAmbientTraffic() {
  if (civilianVehicles.length > 0) return;
  for (let i = 0; i < 30; i++) {
    civilianVehicles.push({
      id: `CIV-${i}`,
      position: { x: 0.1 + Math.random() * 0.8, y: 0.1 + Math.random() * 0.8 },
      status: 'normal',
      clearDirection: { dx: 0, dy: 0 },
      ambientDirection: { dx: (Math.random() - 0.5) * 0.005, dy: (Math.random() - 0.5) * 0.005 }
    });
  }
}

// Single v2xTick — called from main index.js every 2s
// Sets up the 200ms animation interval once
function v2xTick(io) {
  globalIoRef = io;
  initAmbientTraffic();
  
  if (!v2xInterval) {
    v2xInterval = setInterval(() => {
      updateVehiclePositions();
    }, 200);
  }
}

function triggerV2XIncident(venue) {
  isIncidentActive = true;
  vehicles = [];

  const types = ['ambulance', 'police', 'fire', 'ambulance', 'police', 'fire'];

  for (let i = 0; i < venue.incidentScenario.vehicleCount; i++) {
    const type = types[i % types.length];
    const startX = i % 2 === 0 ? 0.05 : 0.95;
    const startY = 0.1 + (i * 0.15);

    const path = computePathAStar(startX, startY, venue.incidentScenario.targetLocation.x, venue.incidentScenario.targetLocation.y);

    vehicles.push({
      id: `${type.substring(0, 3).toUpperCase()}-0${i + 1}`,
      type,
      position: { x: startX, y: startY },
      targetPosition: venue.incidentScenario.targetLocation,
      pathIndex: 0,
      path,
      velocity: { vx: 0, vy: 0 },
      status: 'EN ROUTE'
    });
  }

  logEvent('INFO', `V2X: ${vehicles.length} emergency vehicles dispatched via A* pathfinding.`);

  if (!broadcastInterval) {
    broadcastInterval = setInterval(() => {
      broadcastV2X();
    }, 100);
  }
}

function broadcastV2X() {
  if (!globalIoRef || !isIncidentActive) return;

  const messages = vehicles.map(v => {
    const latency = (0.75 + Math.random() * 0.45).toFixed(2);
    v.lastMessageLatencyMs = parseFloat(latency);
    
    return {
      messageId: uuidv4(),
      vehicleId: v.id,
      type: v.type,
      position: v.position,
      speed: 40 + Math.floor(Math.random() * 20),
      messageType: 'DENM',
      priority: 'EMERGENCY',
      sliceUsed: 'URLLC',
      latencyMs: v.lastMessageLatencyMs,
      status: v.status
    };
  });

  globalIoRef.emit('v2x:broadcast', messages);

  // Warn civilians near emergency vehicles
  messages.forEach(msg => {
    civilianVehicles.forEach(civ => {
      const dist = Math.hypot(civ.position.x - msg.position.x, civ.position.y - msg.position.y);
      if (dist < 0.15 && civ.status !== 'cleared') {
        civ.status = 'warned';
        civ.clearDirection = {
          dx: (civ.position.x - msg.position.x) * 0.01,
          dy: (civ.position.y - msg.position.y) * 0.01
        };
      }
    });
  });
}

function resolveIncidentV2X() {
  isIncidentActive = false;
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }
  vehicles = [];
  // Reset civilians to normal
  civilianVehicles.forEach(civ => {
    civ.status = 'normal';
    civ.ambientDirection = { dx: (Math.random() - 0.5) * 0.005, dy: (Math.random() - 0.5) * 0.005 };
  });
}

function updateVehiclePositions() {
  if (!globalIoRef) return;

  // ALWAYS move civilians (ambient traffic) regardless of incident state
  civilianVehicles.forEach(civ => {
    if (civ.status === 'warned') {
      civ.position.x += civ.clearDirection.dx;
      civ.position.y += civ.clearDirection.dy;
      civ.position.x = Math.max(0, Math.min(1, civ.position.x));
      civ.position.y = Math.max(0, Math.min(1, civ.position.y));
      if (Math.random() < 0.05) civ.status = 'cleared';
    } else if (civ.status === 'normal') {
      if (!civ.ambientDirection) {
        civ.ambientDirection = { dx: (Math.random() - 0.5) * 0.005, dy: (Math.random() - 0.5) * 0.005 };
      }
      civ.position.x += civ.ambientDirection.dx;
      civ.position.y += civ.ambientDirection.dy;
      if (civ.position.x <= 0.05 || civ.position.x >= 0.95) civ.ambientDirection.dx *= -1;
      if (civ.position.y <= 0.05 || civ.position.y >= 0.95) civ.ambientDirection.dy *= -1;
      if (Math.random() < 0.02) {
        civ.ambientDirection = { dx: (Math.random() - 0.5) * 0.005, dy: (Math.random() - 0.5) * 0.005 };
      }
    }
    // cleared vehicles stay put
  });

  // Move emergency vehicles along A* path
  if (isIncidentActive) {
    vehicles.forEach(v => {
      if (v.path && v.pathIndex < v.path.length) {
        const nextWp = v.path[v.pathIndex];
        const dx = nextWp.x - v.position.x;
        const dy = nextWp.y - v.position.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < 0.02) {
          v.pathIndex++;
        } else {
          v.position.x += dx * 0.2;
          v.position.y += dy * 0.2;
        }
        
        if (v.pathIndex >= v.path.length) {
          v.status = 'ARRIVED';
        }
      }
    });
  }

  // Emit vehicle update to all clients
  globalIoRef.emit('vehicle:update', {
    vehicles,
    civilianVehicles,
    incidentActive: isIncidentActive
  });
}

function getV2XState() {
  return {
    vehicles,
    civilianVehicles,
    incidentActive: isIncidentActive,
    latencyStats: {
      '5G URLLC': 0.9,
      '4G LTE': 45.3,
      '3G HSPA+': 180.2
    },
    messagesLastSecond: isIncidentActive ? vehicles.length * 10 : 0,
    corridorStatus: isIncidentActive ? 'ACTIVE' : 'STANDBY'
  };
}

module.exports = {
  triggerV2XIncident,
  resolveIncidentV2X,
  v2xTick,
  getV2XState
};
