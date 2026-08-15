import React from 'react';
import { DSSEngine } from '../modules/dss/dssEngine';

export default function DecisionSupportDashboard() {
  const insights = DSSEngine.getExecutiveInsights();
  const alerts = DSSEngine.getExecutiveAlerts();

  return (
    <div className="bg-slate-900 border border-slate-700 p-6 shadow-xl" id="dss-dashboard">
      <h2 className="text-xl font-bold text-white mb-6">Decision Support Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-emerald-400 mb-4">Executive Insights</h3>
          {insights.map(i => (
            <div key={i.id} className="bg-slate-800 p-4 mb-2 rounded border border-slate-700 text-white">
              <p className="font-bold">{i.summary}</p>
              <p className="text-sm text-slate-400">Rec: {i.recommendation}</p>
            </div>
          ))}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-amber-400 mb-4">Executive Alerts</h3>
          {alerts.map(a => (
            <div key={a.id} className="bg-slate-800 p-4 mb-2 rounded border border-slate-700 text-white">
              <p className="font-bold">{a.source}: {a.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
