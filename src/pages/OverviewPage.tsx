import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { Activity, AlertTriangle, CheckCircle, Wifi, Droplets } from 'lucide-react';

export default function OverviewPage() {
  const token = useAuthStore(state => state.token);
  const [kpis, setKpis] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [wsStatus, setWsStatus] = useState('Connecting...');

  // Fetch initial KPIs
  useEffect(() => {
    if (!token) return;
    axios.get('https://smartneer.onrender.com/api/kpis', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setKpis(res.data))
      .catch(console.error);
  }, [token]);

  // WebSocket Connection
  useEffect(() => {
    const ws = new WebSocket('wss://smartneer.onrender.com/ws/telemetry');
    ws.onopen = () => setWsStatus('Connected');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'TELEMETRY_BATCH') {
        setTelemetry(data.readings);
      }
    };
    ws.onclose = () => setWsStatus('Disconnected');
    return () => ws.close();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Village Overview</h1>
        <div className="flex items-center text-sm">
          <Wifi className={`h-4 w-4 mr-2 ${wsStatus === 'Connected' ? 'text-green-500' : 'text-red-500'}`} />
          <span className="text-gray-500">{wsStatus}</span>
        </div>
      </div>

      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Flow (Lpm)</p>
              <h3 className="text-2xl font-bold text-gray-900">{kpis.totalFlowLpm}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-full"><Droplets className="h-6 w-6 text-primary" /></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Avg Pressure (Bar)</p>
              <h3 className="text-2xl font-bold text-gray-900">{kpis.avgPressureBar}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-full"><Activity className="h-6 w-6 text-primary" /></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Active Nodes</p>
              <h3 className="text-2xl font-bold text-gray-900">{kpis.onlineNodes} / {kpis.totalNodes}</h3>
            </div>
            <div className="bg-green-50 p-3 rounded-full"><CheckCircle className="h-6 w-6 text-success" /></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Critical Alerts</p>
              <h3 className="text-2xl font-bold text-red-600">{kpis.criticalAlerts}</h3>
            </div>
            <div className="bg-red-50 p-3 rounded-full"><AlertTriangle className="h-6 w-6 text-critical" /></div>
          </div>
        </div>
      )}

      {/* Basic Node Table displaying live telemetry */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Live Node Telemetry</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Node ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pressure (Bar)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flow (Lpm)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TDS (Ppm)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {telemetry && Object.values(telemetry).map((node: any) => (
                <tr key={node.nodeId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{node.nodeId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{node.pressureBar}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{node.flowLpm}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{node.tdsPpm}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${node.riskState === 'NORMAL' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {node.riskState}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
