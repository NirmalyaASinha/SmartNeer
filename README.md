# Smart-Neer (स्मार्ट-नीर)
### IoT Rural Water-Pipeline Leak Detection & Hydraulic Health Monitoring
**Smart India Hackathon 2026 | Problem Statement: PS 26254 | Team: TRISHULI**
**Target Deployment:** Drought-Prone Village Networks, Maharashtra (Jal Jeevan Mission)

---

## 🌊 Overview
**Smart-Neer** is an edge-first, IoT-driven pipeline intelligence platform engineered specifically for rural Indian gravity-fed water supply networks (Elevated Storage Reservoir → PVC/HDPE distribution network → household standposts).

Rural water pipelines in India suffer from **intermittent supply cycles (typically 06:00–08:30 AM & 17:00–19:00 PM)**, high non-revenue water (NRW) losses (20–45%), pressure transients (water hammer), back-siphonage contamination ingress during negative pressure hours, and lack of cellular connectivity at remote tail-ends.

Smart-Neer solves this by uniting:
1. **Edge-Computing Raspberry Pi 4 Gateway** at the Gram Panchayat running an **EPANET Digital Twin** and dual-tier machine learning models (Isolation Forest for anomaly scoring + Random Forest for root-cause fault classification).
2. **Hybrid Mesh Telemetry**: ESP-NOW leaf nodes and painlessMesh routers transmitting pressure (bar), flow (L/min), TDS (ppm), EC (µS/cm), VOC (ppb), and vibration (g).
3. **Automated Govt DLT SMS & WhatsApp Gateway** notifying village pump fitters within **2 seconds** of a pipe burst in **Marathi (मराठी), Hindi (हिंदी), and English**.
4. **Resilient Offline-First Architecture**: Continuous local anomaly detection during internet outages, queuing records in local SQLite/MQTT buffers and auto-syncing upon cloud reconnection.

---

## 🛠 Tech Stack
- **Frontend Framework:** React 18 + Vite + TypeScript
- **Styling & Design System:** Tailwind CSS (Navy/Blue/Green/Amber/Red palette, Dark Mode, High Contrast for Outdoor Sunlight)
- **Mapping & GIS:** Leaflet & React-Leaflet with OpenStreetMap tiles (Topological pipes, leak zones, mesh routing links)
- **Hydraulic & Telemetry Charts:** Recharts (EPANET baseline overlay with shaded anomaly residuals, 100 Hz transient waveform)
- **State Management:** Zustand
- **Real-Time Data Layer:** Reactive Event-Bus Simulator in `/src/mock/simulator.ts` emitting live telemetry every 2 seconds (`setInterval`), easily swappable for FastAPI WebSocket & MQTT broker.
- **Audio Synthesis:** Web Audio API oscillator synthesizing two-tone emergency beeps for critical pipe bursts without external audio assets.
- **Icons:** Lucide React

---

## 🚀 Quick Start Instructions

### Prerequisites
- Node.js >= 18.x (tested on Node v22)
- npm >= 9.x

### Running Locally
```bash
# 1. Install dependencies
npm install

# 2. Launch Vite development server
npm run dev

# 3. Open in browser
# http://localhost:5173
```
*No external API keys, tokens, or map credentials required! Everything works out-of-the-box.*

---

## 📂 File Structure
```
smart-neer/
├── index.html                           # App shell, fonts & Leaflet stylesheet
├── package.json                         # Dependencies & npm scripts
├── tsconfig.json                        # TypeScript configuration
├── vite.config.ts                       # Vite server configuration
├── tailwind.config.js                   # Smart-Neer high-contrast palette
├── postcss.config.js                    # PostCSS configuration
├── src/
│   ├── main.tsx                         # React entry point
│   ├── App.tsx                          # Core application shell & view router
│   ├── index.css                        # Leaflet animations, markers, print stylesheet
│   ├── types/
│   │   └── index.ts                     # TypeScript data contracts & models
│   ├── store/
│   │   ├── useStore.ts                  # Zustand reactive state store & actions
│   │   └── index.ts                     # Store exports
│   ├── mock/
│   │   ├── epanetBaselines.ts           # EPANET digital twin hydraulic model & schedule
│   │   ├── seedData.ts                  # 18 nodes, 20 pipes, tickets, SMS, transients
│   │   └── simulator.ts                 # Real-time event bus simulation engine (2s interval)
│   ├── utils/
│   │   ├── translations.ts              # Trilingual dictionary (English, Marathi, Hindi)
│   │   └── audio.ts                     # Web Audio API alert chime & emergency beep
│   └── components/
│       ├── layout/
│       │   ├── Header.tsx               # Top banner, status pill, offline sync, RBAC, theme
│       │   ├── Sidebar.tsx              # Role-filtered sidebar navigation
│       │   ├── MobileNav.tsx            # Bottom nav bar for 390px mobile view
│       │   └── Footer.tsx               # SIH 2026 PS 26254 attribution & gateway status
│       ├── overview/
│       │   ├── LiveOverviewPage.tsx     # Home dashboard uniting map, KPIs & live feed
│       │   ├── StatusBanner.tsx         # Responsive outdoor-readable village status banner
│       │   ├── KpiGrid.tsx              # Active nodes, alerts, flow, water/₹ lost, editable tariff
│       │   ├── MiniTrendCharts.tsx      # Village pressure, flow & TDS live 30-min trends
│       │   └── LiveAlertFeed.tsx        # Real-time feed with Acknowledge & Resolve actions
│       ├── map/
│       │   └── GisNetworkMap.tsx        # Interactive Leaflet GIS map with leak zones & mesh links
│       ├── node-drawer/
│       │   └── NodeDetailDrawer.tsx     # Telemetry drawer with 5 charts + EPANET baseline + SMS
│       ├── alerts/
│       │   └── AlertsPage.tsx           # Filterable incident log & DLT SMS preview panel
│       ├── transients/
│       │   └── WaveformViewer.tsx       # 100 Hz 10s water hammer waveform & countermeasure guide
│       ├── quality/
│       │   └── WaterQualityPage.tsx     # TDS/EC/VOC trends, repressurization jump & back-siphonage
│       ├── analytics/
│       │   └── AnalyticsPage.tsx        # NRW audit, MNF zone chart, EPANET residuals, CSV/PDF export
│       ├── maintenance/
│       │   └── MaintenanceKanban.tsx    # Kanban work order board (Open -> In Progress -> Fixed)
│       ├── system/
│       │   └── SystemHealthPage.tsx     # RPi 4 hardware CPU/RAM, mesh RF hops, battery predictions
│       ├── demo/
│       │   └── DemoControlsModal.tsx    # Lab panel with 6 fault injectors & keyboard shortcut
│       └── common/
│           ├── RolePickerModal.tsx      # RBAC persona switcher
│           └── ToastNotification.tsx    # Emergency floating toast with sound trigger
```

---

## 👥 Role-Based Access Control (RBAC)
Smart-Neer adapts its UI to 4 distinct stakeholders via the **Role Switcher** in the top navigation:

| Stakeholder | Key Visible Views | Restricted / Tailored Elements |
|---|---|---|
| **1. Pump Operator** *(Suresh Patil)* | Live Overview, GIS Map, Alerts & SMS, Maintenance | Simplified high-contrast buttons, **Financial ₹ loss analytics hidden**, instant "Acknowledge" & "Mark Repaired" buttons. Mobile-friendly (390px). |
| **2. VWSC Member** *(Sunita Gaikwad)* | Operator view + Water Quality, System Health, Work Orders | Water contamination tracking, back-siphonage advisories, battery status. |
| **3. Sarpanch** *(Kailasrao More)* | Village Executive Summary, Analytics & Reports, NRW Audit, SMS Log | Focus on Non-Revenue Water (NRW) %, water saved (kL), money saved (₹), printable official PDF report. |
| **4. District Jal-Nigam Engineer** *(Dattatray Shinde)* | Unrestricted Access across all 8 modules + Demo Lab | EPANET digital twin residuals, 100 Hz water hammer waveform, ML Isolation Forest tuning, CSV raw data export, failure injectors. |


#### Default Demo Credentials (RBAC)
- **Admin / District Engineer:** `admin` / `admin123`
- **Sarpanch:** `sarpanch` / `sarpanch123`
- **Pump Operator:** `operator` / `operator123`

---

## 🔌 Connecting to a Real Backend (FastAPI + MQTT + PostgreSQL)

Smart-Neer was architected from Day 1 with an event-bus interface in `src/mock/simulator.ts` that mirrors an MQTT/WebSocket broker. Swapping in a production backend requires just three simple steps:

### 1. Architecture Flow
```
[ESP32 Sensor Nodes] (ESP-NOW / painlessMesh)
       │
       ▼
[Edge Gateway: Raspberry Pi 4 @ Gram Panchayat]
   ├── Python 3.11 + Mosquitto MQTT Broker (port 1883/8883)
   ├── epanet-python (WNTR) hydraulic engine
   ├── scikit-learn (Isolation Forest & Random Forest models)
   └── FastAPI Web Application (REST API + WebSocket stream)
       │
       ▼ (Encrypted WebSocket over TLS)
[Smart-Neer React Frontend]
```

### 2. FastAPI WebSocket Implementation (`backend/main.py`)
```python
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json

app = FastAPI(title="Smart-Neer Edge Gateway API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/telemetry")
async def telemetry_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Fetch latest hydraulic calculations from local EPANET twin & MQTT queue
            telemetry_payload = await get_latest_edge_readings()
            await websocket.send_text(json.dumps({
                "type": "TELEMETRY_BATCH",
                "readings": telemetry_payload,
                "timestamp": datetime.utcnow().isoformat()
            }))
            await asyncio.sleep(2.0)
    except Exception as e:
        print("WebSocket client disconnected:", e)
```

### 3. Frontend Adapter (`src/store/useStore.ts`)
In `src/store/useStore.ts`, replace the simulator listener in `initializeSimulatorBridge()` with a native WebSocket connection:
```typescript
export function initializeRealBackendBridge(wsUrl = "ws://localhost:8000/ws/telemetry") {
  const socket = new WebSocket(wsUrl);

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "TELEMETRY_BATCH") {
      // Direct pass-through to existing Zustand state
      useStore.getState().handleTelemetryBatch(data.readings);
    }
  };

  socket.onclose = () => {
    // Automatically trigger Smart-Neer's Edge Offline buffer mode!
    useStore.getState().toggleEdgeOfflineMode();
  };
}
```

---

## 🏆 5-Step Hackathon Presentation Demo Script

Follow this 5-minute presentation script to captivate the SIH jury:

### Step 1: Normal Pressurized Operation & Role Demonstration (0:00 – 1:00)
- **Action:** Open the dashboard at `http://localhost:5173`. Show the green status banner: *"All Systems Optimal – Pipe network pressurized and stable"*.
- **Narrate:** *"Smart-Neer monitors 18 sensor nodes across Shivrajpur Gram Panchayat. Right now, morning supply is ON. Notice our interactive GIS map showing the Elevated Storage Reservoir (ESR), pump house, and color-coded pipelines with real-time mesh routing."*
- **Action:** Click the Role Switcher in the top bar and select **Pump Operator**.
- **Narrate:** *"On a 390px mobile phone screen, our field pump operator gets an uncluttered, high-contrast display with instant action buttons and zero confusing financial tables."*

### Step 2: Inject Catastrophic Pipe Burst (1:00 – 2:00)
- **Action:** Switch back to **District Engineer**. Open **Demo Lab** (or press `Ctrl+Shift+D`) and click **"2. Inject Catastrophic Burst"**.
- **Result:** Within 2 seconds:
  1. An emergency audio warning beep plays.
  2. The status banner turns red: *"CRITICAL ALERT – Catastrophic Pipe Burst at Node 14 (Ambedkar Nagar)"*.
  3. Node 14 and Segment SEG-14 turn flashing red on the GIS map with a **red leak circle zone (96% confidence)**.
  4. An alert arrives in the live feed.
- **Narrate:** *"In seconds, our edge Isolation Forest detected a severe pressure collapse down to 0.18 bar and mass flow surge on segment SEG-14. Notice how the pressure-differential algorithm identified the exact 420m culvert crossing."*

### Step 3: DLT Multilingual SMS Dispatch & Work Order (2:00 – 3:00)
- **Action:** Navigate to **Alerts & SMS Log**.
- **Narrate:** *"Rural operators do not check complex web portals while in the field. Smart-Neer instantly triggers an automated Govt DLT SMS or WhatsApp dispatch in Marathi, Hindi, or English."*
- **Action:** Toggle to **मराठी (Marathi)** and show the SMS text: *"स्मार्ट-नीर तातडीचा इशारा: नोड १४ (आंबेडकर नगर साकव) वर मुख्य पाईप फुटला! दाब ०.१८ बार. व्हॉल्व SV-०४ त्वरित बंद करा!"*
- **Action:** Click **"Ticket"** on the alert. The app navigates to the **Maintenance Planner Kanban** showing the auto-generated work order assigned to Suresh Patil with photo placeholder and ₹2,400 repair estimate.

### Step 4: Water Hammer Transient & Back-Siphonage Contamination (3:00 – 4:00)
- **Action:** Navigate to **Water Hammer & Surge**.
- **Narrate:** *"Water hammer is the number one cause of rural pipe rupture. Smart-Neer features a 100 Hz high-frequency transducer viewer capturing Joukowsky shockwave oscillations. Click 'Trigger Surge Shock' to see the 7.85 bar peak that exceeds the HDPE PN-6 pipe rating."*
- **Action:** Navigate to **Water Quality & Contamination**. Show the back-siphonage illustration card.
- **Narrate:** *"When intermittent supply shuts off, gravity drainage creates negative vacuum pressure, sucking drainage wastewater into loose pipe joints. Notice our 24-hr chart highlighting the 38% TDS spike upon repressurization, allowing the village to flush lines before illness spreads."*

### Step 5: Executive NRW Audit & Edge Island Offline Mode (4:00 – 5:00)
- **Action:** Switch role to **Sarpanch** and click **Analytics & NRW**.
- **Narrate:** *"For village sarpanches and Jal Jeevan Mission engineers, we quantify Non-Revenue Water (NRW) %, water saved (485 kL), and money saved (₹8,970/month) with an editable water tariff rate."*
- **Action:** Click the top bar **"Cloud Sync / Local RPi"** button to simulate an internet outage.
- **Narrate:** *"Rural cellular links fail frequently. Notice the dashboard enters 'Edge Island Mode'—the local Raspberry Pi continues all EPANET comparisons and queues 1,200+ records in SQLite. Now watch when internet returns: click it again, and the system seamlessly animates the MQTT queue flushing down to zero!"*
- **Conclusion:** *"Smart-Neer ensures uninterrupted drinking water security for every rural citizen."*

---

## 📜 Team Attribution
- **Team:** TRISHULI
- **Event:** Smart India Hackathon (SIH) 2026
- **Problem Statement:** PS 26254
- **License:** MIT License
