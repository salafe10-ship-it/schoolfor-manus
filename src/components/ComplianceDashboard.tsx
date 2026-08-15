import React, { useState, useEffect } from 'react';
import { ComplianceEngine } from '../modules/compliance/complianceEngine';
import { ComplianceViolation } from '../modules/compliance/types';

export default function ComplianceDashboard() {
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);

  useEffect(() => {
    setViolations(ComplianceEngine.getViolations());
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-700 p-6 shadow-xl" id="compliance-dashboard">
      <h2 className="text-xl font-bold text-white mb-6">Compliance Dashboard</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-slate-300">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-4 py-2">Domain</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Severity</th>
              <th className="px-4 py-2">Detected At</th>
            </tr>
          </thead>
          <tbody>
            {violations.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-4">All Systems Compliant</td></tr>
            ) : (
              violations.map(v => (
                <tr key={v.id} className="border-b border-slate-800">
                  <td className="px-4 py-2 capitalize">{v.domain}</td>
                  <td className="px-4 py-2">{v.description}</td>
                  <td className="px-4 py-2 text-red-400">{v.severity}</td>
                  <td className="px-4 py-2">{new Date(v.detectedAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
