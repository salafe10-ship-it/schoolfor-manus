
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AnalyticsSummary } from '../modules/examination/analyticsEngine';

interface ExaminationAnalyticsDashboardProps {
  summary: AnalyticsSummary;
}

export default function ExaminationAnalyticsDashboard({ summary }: ExaminationAnalyticsDashboardProps) {
  const data = [
    { name: 'Average Score', value: summary.averageScore },
    { name: 'Pass Rate', value: summary.passRate },
  ];

  return (
    <div className="bg-slate-900 border border-slate-700 p-6 shadow-xl" id="exam-analytics-dashboard">
      <h2 className="text-xl font-bold text-white mb-6">Examination Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="text-white">
          <p>Top Performers: {summary.topPerformers.join(', ')}</p>
          <p>Risk Students: {summary.riskStudents.join(', ')}</p>
        </div>
      </div>
    </div>
  );
}
