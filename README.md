# FestivalNet — 5G Mass Event Network Stress Simulator

FestivalNet is an academic project demonstrating 5G network slicing, Erlang-B traffic theory, V2X communications, MEC, URLLC, and SDN concepts. It simulates a 5G NOC dashboard during mass events, complete with visual metrics and emergency slice rebalancing.

## Setup Instructions

This project requires Node.js 20+ installed on your system.

### Installation

Run the following command from the root directory to install all dependencies for both the root, backend, and frontend:

```bash
npm run install:all
```

### Running the Simulator

To start both the backend simulation engine and the frontend NOC dashboard concurrently, run:

```bash
npm start
```

This will automatically launch the backend server at `http://localhost:4000` and the frontend server at `http://localhost:5173`.

## Features
- **Dashboard Tab:** Live network status, utilization indicators, Erlang-B formula view, and emergency scenario trigger.
- **V2X Tab:** Animated visualization of vehicles using A* pathfinding via Multi-Access Edge Computing (MEC) and real-time URLLC message latency feeds.
- **Slices Tab:** Detailed SLA status for all network slices representing Unit 4 concepts.

## Syllabus Reference
- **Unit 2:** eMBB / URLLC / MMTC usage scenarios, V2X communications.
- **Unit 3:** URLLC latency requirements (<1ms).
- **Unit 4:** Network slicing, SDN policy engine, Multi-Access Edge Computing (MEC).
