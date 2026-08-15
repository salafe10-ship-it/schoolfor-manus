import React, { useState, useEffect } from 'react';
import { MonitoringEngine } from '../modules/monitoring/monitoringEngine';
import { Incident } from '../modules/monitoring/types';

export default function MonitoringDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    setIncidents(MonitoringEngine.getIncidents());
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-700 p-6 shadow-xl" id="monitoring-dashboard">
      <h2 className="text-xl font-bold text-white mb-6">Operational Monitoring</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-slate-300">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-4 py-2">Module</th>
              <th className="px-4 py-2">Incident</th>
              <th className="px-4 py-2">Severity</th>
              <th className="px-4 py-2">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-4 text-emerald-400">All Systems Operational</td></tr>
            ) : (
              incidents.map(i => (
                <tr key={i.id} className="border-b border-slate-800">
                  <td className="px-4 py-2 capitalize">{i.module}</td>
                  <td className="px-4 py-2">{i.description}</td>
                  <td className={`px-4 py-2 ${i.severity === 'critical' ? 'text-red-500' : 'text-amber-400'}`}>{i.severity}</td>
                  <td className="px-4 py-2">{new Date(i.timestamp).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
