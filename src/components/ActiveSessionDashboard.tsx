import React, { useState, useEffect } from 'react';
import { IdentityEngine } from '../modules/identity/identityEngine';
import { Session } from '../modules/identity/types';

export default function ActiveSessionDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    setSessions(IdentityEngine.getActiveSessions());
  }, []);

  const handleRevoke = (sessionId: string) => {
    IdentityEngine.revokeSession(sessionId);
    setSessions(IdentityEngine.getActiveSessions());
  };

  return (
    <div className="bg-slate-900 border border-slate-700 p-6 shadow-xl" id="session-dashboard">
      <h2 className="text-xl font-bold text-white mb-6">Active Sessions</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-slate-300">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-4 py-2">Identity</th>
              <th className="px-4 py-2">Device</th>
              <th className="px-4 py-2">IP Address</th>
              <th className="px-4 py-2">Last Activity</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(session => (
              <tr key={session.id} className="border-b border-slate-800">
                <td className="px-4 py-2">{session.identityId}</td>
                <td className="px-4 py-2">{session.deviceId}</td>
                <td className="px-4 py-2">{session.ipAddress}</td>
                <td className="px-4 py-2">{new Date(session.lastActivity).toLocaleTimeString()}</td>
                <td className="px-4 py-2">
                  <button 
                    className="text-red-400 hover:text-red-300"
                    onClick={() => handleRevoke(session.id)}
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
