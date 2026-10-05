import React, { useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
  Popup,
  Tooltip,
} from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '../../store';
import { SensorNode, PipeSegment } from '../../types';
import {
  Layers,
  MapPin,
  Wifi,
  AlertTriangle,
  Droplets,
  Activity,
  Home,
  Gauge,
  Sliders,
} from 'lucide-react';

// Custom icons generator for Leaflet
function createCustomMarkerIcon(node: SensorNode, isSelected: boolean) {
  let bgColor = 'bg-emerald-500';
  let pulseClass = '';

  if (node.status === 'CRITICAL') {
    bgColor = 'bg-red-600';
    pulseClass = 'critical-node-pulse';
  } else if (node.status === 'WARNING') {
    bgColor = 'bg-amber-500';
    pulseClass = 'warning-node-pulse';
  } else if (node.status === 'OFFLINE') {
    bgColor = 'bg-slate-400';
  }

  const isRouter = node.type === 'router' || node.type === 'gateway' || node.type === 'esr';
  const size = isSelected ? 34 : 26;
  const innerSymbol =
    node.type === 'esr'
      ? '🏰'
      : node.type === 'pump_house'
      ? '⚡'
      : node.type === 'gateway'
      ? '📡'
      : isRouter
      ? '🔀'
      : '💧';

  const html = `
    <div class="relative flex items-center justify-center ${pulseClass}" style="width: ${size}px; height: ${size}px;">
      <div class="w-full h-full rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-[11px] shadow-lg border-2 ${
        isSelected ? 'border-cyan-300 scale-125' : 'border-white'
      } transition-transform">
        <span>${innerSymbol}</span>
      </div>
      <div class="absolute -bottom-4 px-1 py-0.2 rounded bg-slate-900/90 text-white text-[9px] font-mono whitespace-nowrap shadow-sm pointer-events-none">
        ${node.id.replace('NODE-', 'N')}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-node-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Simulated Household taps in the village
const SAMPLE_HOUSEHOLDS = [
  { id: 'HH-01', lat: 19.0880, lng: 75.3210, name: 'Tukaram Kadam' },
  { id: 'HH-02', lat: 19.0865, lng: 75.3225, name: 'Anandrao Shinde' },
  { id: 'HH-03', lat: 19.0825, lng: 75.3185, name: 'Santosh Gaikwad' },
  { id: 'HH-04', lat: 19.0815, lng: 75.3230, name: 'Gram Panchayat Kiosk' },
  { id: 'HH-05', lat: 19.0780, lng: 75.3195, name: 'Ambedkar Nagar Tap Post #1' },
  { id: 'HH-06', lat: 19.0750, lng: 75.3225, name: 'Ambedkar Nagar Tap Post #2' },
  { id: 'HH-07', lat: 19.0900, lng: 75.3250, name: 'Maruti Galli Common Standpost' },
  { id: 'HH-08', lat: 19.0840, lng: 75.3145, name: 'West Ward Standpost' },
];

export const GisNetworkMap: React.FC<{ fullScreen?: boolean }> = ({ fullScreen = false }) => {
  const {
    nodes,
    pipeSegments,
    selectedNodeId,
    setSelectedNodeId,
    latestReadings,
    scenarioState,
  } = useStore();

  // Layer toggles
  const [showPipes, setShowPipes] = useState(true);
  const [showNodes, setShowNodes] = useState(true);
  const [showMeshLinks, setShowMeshLinks] = useState(true);
  const [showLeakZones, setShowLeakZones] = useState(true);
  const [showHouseholds, setShowHouseholds] = useState(false);
  const [showPressureHeat, setShowPressureHeat] = useState(false);

  // Center of Maharashtra village
  const centerLat = 19.0835;
  const centerLng = 75.3210;

  // Node Map index
  const nodeMap = useMemo(() => {
    const map = new Map<string, SensorNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Active leak zones from segments
  const activeLeakSegments = useMemo(() => {
    return pipeSegments.filter((seg) => seg.hasLeak || seg.currentRisk !== 'NORMAL');
  }, [pipeSegments]);

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900 ${
      fullScreen ? 'h-[calc(100vh-140px)]' : 'h-[360px] sm:h-[440px] lg:h-[500px]'
    }`}>
      {/* Layer Controls Bar */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-brand-blue" />
          Layers:
        </span>

        <label className="flex items-center space-x-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showPipes}
            onChange={(e) => setShowPipes(e.target.checked)}
            className="rounded text-brand-blue focus:ring-0 w-3.5 h-3.5"
          />
          <span className="text-slate-600 dark:text-slate-300">Pipes</span>
        </label>

        <label className="flex items-center space-x-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showNodes}
            onChange={(e) => setShowNodes(e.target.checked)}
            className="rounded text-brand-blue focus:ring-0 w-3.5 h-3.5"
          />
          <span className="text-slate-600 dark:text-slate-300">Nodes (18)</span>
        </label>

        <label className="flex items-center space-x-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showMeshLinks}
            onChange={(e) => setShowMeshLinks(e.target.checked)}
            className="rounded text-brand-blue focus:ring-0 w-3.5 h-3.5"
          />
          <span className="text-slate-600 dark:text-slate-300">Mesh Topology</span>
        </label>

        <label className="flex items-center space-x-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showLeakZones}
            onChange={(e) => setShowLeakZones(e.target.checked)}
            className="rounded text-red-500 focus:ring-0 w-3.5 h-3.5"
          />
          <span className="text-slate-600 dark:text-slate-300">Leak Zones</span>
        </label>

        <label className="flex items-center space-x-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showHouseholds}
            onChange={(e) => setShowHouseholds(e.target.checked)}
            className="rounded text-cyan-500 focus:ring-0 w-3.5 h-3.5"
          />
          <span className="text-slate-600 dark:text-slate-300">Taps</span>
        </label>

        <label className="flex items-center space-x-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showPressureHeat}
            onChange={(e) => setShowPressureHeat(e.target.checked)}
            className="rounded text-brand-blue focus:ring-0 w-3.5 h-3.5"
          />
          <span className="text-slate-600 dark:text-slate-300">Pressure Radii</span>
        </label>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
        <div className="font-bold text-slate-800 dark:text-slate-200 text-xs border-b border-slate-200 dark:border-slate-800 pb-1">
          Pipeline Risk Legend
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-slate-600 dark:text-slate-400">Normal Gradient (0.8 - 3.5 bar)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-1.5 rounded-full bg-amber-500" />
          <span className="text-slate-600 dark:text-slate-400">Warning (Residual Drop / Pinhole)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-1.5 rounded-full bg-red-600 animate-pulse" />
          <span className="text-slate-600 dark:text-slate-400">Critical Burst / Water Hammer</span>
        </div>
        <div className="flex items-center space-x-2 pt-0.5">
          <span className="w-3 h-0.5 border-t-2 border-dashed border-cyan-400" />
          <span className="text-slate-600 dark:text-slate-400">ESP-NOW / painlessMesh Hop</span>
        </div>
      </div>

      {/* Interactive Leaflet Map */}
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={15}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark:filter dark:invert dark:hue-rotate-180 dark:contrast-75"
        />

        {/* 1. Pipe Segments Polylines */}
        {showPipes &&
          pipeSegments.map((seg) => {
            const fromNode = nodeMap.get(seg.fromNodeId);
            const toNode = nodeMap.get(seg.toNodeId);
            if (!fromNode || !toNode) return null;

            const isCritical = seg.currentRisk === 'CRITICAL';
            const isWarning = seg.currentRisk === 'WARNING';

            const color = isCritical ? '#dc2626' : isWarning ? '#d97706' : '#2563eb';
            const weight = isCritical ? 6 : isWarning ? 4 : 3;
            const opacity = isCritical ? 0.95 : 0.75;

            return (
              <Polyline
                key={seg.id}
                positions={[
                  [fromNode.location.lat, fromNode.location.lng],
                  [toNode.location.lat, toNode.location.lng],
                ]}
                pathOptions={{
                  color,
                  weight,
                  opacity,
                  dashArray: isCritical ? '6, 6' : undefined,
                }}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-slate-900">Segment: {seg.id}</p>
                    <p className="text-slate-600">{fromNode.id} ➔ {toNode.id}</p>
                    <p className="text-slate-600">Material: {seg.material} ({seg.diameterMm}mm)</p>
                    <p className="text-slate-600">Length: {seg.lengthMeters}m</p>
                    <p className={`font-semibold ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                      State: {seg.currentRisk} {seg.hasLeak ? '(Leak Suspected)' : ''}
                    </p>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

        {/* 2. Mesh Topology Animated / Dashed Lines (Leaf -> Router -> Gateway) */}
        {showMeshLinks &&
          nodes.map((node) => {
            if (!node.parentRouterId) return null;
            // If in node failure scenario and Node 04 is failed, re-route to Node 08!
            let targetParentId = node.parentRouterId;
            if (scenarioState.currentScenario === 'NODE_FAILURE' && targetParentId === 'NODE-04') {
              targetParentId = 'NODE-08'; // dynamic mesh re-route!
            }

            const parentNode = nodeMap.get(targetParentId);
            if (!parentNode) return null;

            return (
              <Polyline
                key={`mesh-${node.id}-${parentNode.id}`}
                positions={[
                  [node.location.lat, node.location.lng],
                  [parentNode.location.lat, parentNode.location.lng],
                ]}
                pathOptions={{
                  color: '#06b6d4',
                  weight: 2,
                  opacity: 0.6,
                  dashArray: '4, 8',
                }}
              />
            );
          })}

        {/* 3. Leak Zones (Translucent pulsing circles on estimated leak segments) */}
        {showLeakZones &&
          activeLeakSegments.map((seg) => {
            const fromNode = nodeMap.get(seg.fromNodeId);
            const toNode = nodeMap.get(seg.toNodeId);
            if (!fromNode || !toNode) return null;

            // Interpolate midpoint or leak offset
            const offset = (seg.estimatedLeakOffsetPct || 50) / 100.0;
            const leakLat = fromNode.location.lat + (toNode.location.lat - fromNode.location.lat) * offset;
            const leakLng = fromNode.location.lng + (toNode.location.lng - fromNode.location.lng) * offset;

            const isBurst = seg.currentRisk === 'CRITICAL';
            const radius = isBurst ? 90 : 55;

            return (
              <React.Fragment key={`leak-zone-${seg.id}`}>
                <Circle
                  center={[leakLat, leakLng]}
                  radius={radius}
                  pathOptions={{
                    color: isBurst ? '#dc2626' : '#d97706',
                    fillColor: isBurst ? '#ef4444' : '#f59e0b',
                    fillOpacity: 0.35,
                    weight: 2,
                  }}
                >
                  <Tooltip permanent direction="top" offset={[0, -10]}>
                    <div className="text-center font-sans">
                      <span className="font-extrabold text-[11px] text-red-600 block">
                        {isBurst ? 'BURST ZONE' : 'LEAK ZONE'}
                      </span>
                      <span className="text-[10px] text-slate-700">
                        {seg.leakConfidencePct || 92}% Confidence
                      </span>
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="p-1 text-xs">
                      <p className="font-bold text-red-600">Estimated Leak Location</p>
                      <p className="text-slate-700">Segment: {seg.id} ({fromNode.id} – {toNode.id})</p>
                      <p className="text-slate-600">Offset: ~{Math.round(seg.lengthMeters * offset)}m from {fromNode.id}</p>
                      <p className="font-semibold text-slate-800">
                        Acoustic & Pressure Differential match: {seg.leakConfidencePct || 92}%
                      </p>
                    </div>
                  </Popup>
                </Circle>
              </React.Fragment>
            );
          })}

        {/* 4. Pressure Radii (Heat visualization) */}
        {showPressureHeat &&
          nodes.map((node) => {
            const reading = latestReadings[node.id];
            const p = reading ? reading.pressureBar : 1.5;
            const radius = Math.max(30, Math.min(120, p * 35));
            return (
              <Circle
                key={`p-heat-${node.id}`}
                center={[node.location.lat, node.location.lng]}
                radius={radius}
                pathOptions={{
                  color: '#3b82f6',
                  fillColor: '#60a5fa',
                  fillOpacity: 0.15,
                  weight: 1,
                }}
              />
            );
          })}

        {/* 5. Households */}
        {showHouseholds &&
          SAMPLE_HOUSEHOLDS.map((hh) => (
            <Circle
              key={hh.id}
              center={[hh.lat, hh.lng]}
              radius={12}
              pathOptions={{
                color: '#0891b2',
                fillColor: '#06b6d4',
                fillOpacity: 0.6,
                weight: 1,
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <p className="font-bold text-slate-900">{hh.name}</p>
                  <p className="text-slate-500">Tap Connection: {hh.id}</p>
                </div>
              </Popup>
            </Circle>
          ))}

        {/* 6. Nodes Markers */}
        {showNodes &&
          nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const reading = latestReadings[node.id];
            const icon = createCustomMarkerIcon(node, isSelected);

            return (
              <Marker
                key={node.id}
                position={[node.location.lat, node.location.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    setSelectedNodeId(node.id);
                  },
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[190px] font-sans">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5">
                      <span className="font-extrabold text-xs text-brand-blue">{node.id}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        node.status === 'CRITICAL'
                          ? 'bg-red-100 text-red-700'
                          : node.status === 'WARNING'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {node.status}
                      </span>
                    </div>

                    <p className="font-semibold text-xs text-slate-800">{node.name}</p>
                    <p className="text-[11px] text-slate-500 mb-2">{node.location.landmark}</p>

                    <div className="grid grid-cols-2 gap-1 text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-500 block">Pressure:</span>
                        <strong className="text-slate-900 font-mono">
                          {reading ? `${reading.pressureBar} bar` : '2.1 bar'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Flow:</span>
                        <strong className="text-slate-900 font-mono">
                          {reading ? `${reading.flowLpm} L/m` : '85 L/m'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">TDS:</span>
                        <strong className="text-slate-900 font-mono">
                          {reading ? `${reading.tdsPpm} ppm` : '315 ppm'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Battery:</span>
                        <strong className="text-emerald-700 font-mono">{node.batteryPct}%</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedNodeId(node.id)}
                      className="w-full mt-2 py-1 px-2 text-xs font-semibold rounded bg-brand-blue text-white hover:bg-brand-blueLight transition text-center"
                    >
                      Open Telemetry Drawer ➔
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};
