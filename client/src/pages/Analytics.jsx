import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../api/analytics.api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2','#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-sm">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name === 'achievedPercent' ? `${p.value}%` : `₹${p.value?.toLocaleString()}`}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsAPI.getDashboard(), analyticsAPI.getGroupRankings()])
      .then(([r1, r2]) => { setData(r1.data); setRankings(r2.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const { stats, monthlyTrend, groupPerformance } = data;
  const paymentRatioData = [
    { name: 'Paid', value: stats.paidCount },
    { name: 'Pending', value: stats.pendingCount },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">📈 Analytics</h1>
        <p className="page-subtitle">Deep financial insights across all groups</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { icon: '👥', label: 'Groups', value: stats.totalGroups, color: 'bg-blue-100 dark:bg-blue-900/50', tv: 'text-blue-600' },
          { icon: '👤', label: 'Members', value: stats.totalMembers, color: 'bg-green-100 dark:bg-green-900/50', tv: 'text-green-600' },
          { icon: '💰', label: 'Collected', value: `₹${stats.totalCollected?.toLocaleString()}`, color: 'bg-purple-100 dark:bg-purple-900/50', tv: 'text-purple-600' },
          { icon: '⏳', label: 'Pending', value: stats.pendingCount, color: 'bg-red-100 dark:bg-red-900/50', tv: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="card flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-lg flex-shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className={`font-display text-xl font-bold ${s.tv}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white text-base mb-6">📊 Monthly Collection Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyTrend} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" name="amount" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white text-base mb-6">🍩 Payment Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={paymentRatioData} cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                <Cell fill="#16a34a" />
                <Cell fill="#d97706" />
              </Pie>
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }} />
              <Legend formatter={v => <span className="text-xs text-gray-500">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Group Performance Horizontal Bar */}
      {groupPerformance.length > 0 && (
        <div className="card">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white text-base mb-6">🏢 Group Achievement Progress</h3>
          <ResponsiveContainer width="100%" height={groupPerformance.length * 56 + 40}>
            <BarChart data={groupPerformance} layout="vertical" barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="achievedPercent" name="achievedPercent" fill="#16a34a" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Smart Insights */}
      {data.insights?.length > 0 && (
        <div className="card">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white text-base mb-5">💡 Smart Insights</h3>
          <div className="space-y-3">
            {data.insights.map((ins, i) => <div key={i} className={`insight-${ins.type}`}>{ins.message}</div>)}
          </div>
        </div>
      )}

      {/* Group Rankings */}
      <div className="card">
        <h3 className="font-display font-semibold text-slate-800 dark:text-white text-base mb-5">🏆 Group Rankings</h3>
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
          <table className="w-full">
            <thead><tr><th className="table-th">Rank</th><th className="table-th">Group</th><th className="table-th">Members</th><th className="table-th">Collected</th><th className="table-th">Target</th><th className="table-th">Score</th></tr></thead>
            <tbody>
              {rankings.map(g => (
                <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="table-td text-xl font-bold">{g.rank === 1 ? '🥇' : g.rank === 2 ? '🥈' : g.rank === 3 ? '🥉' : `#${g.rank}`}</td>
                  <td className="table-td font-semibold">{g.name}</td>
                  <td className="table-td">{g.memberCount}</td>
                  <td className="table-td text-green-600 font-medium">₹{g.collectedAmount?.toLocaleString()}</td>
                  <td className="table-td text-gray-400">₹{g.target?.toLocaleString()}</td>
                  <td className="table-td" style={{ minWidth: 140 }}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${g.score >= 75 ? 'bg-green-500' : g.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${g.score}%` }} />
                      </div>
                      <span className="text-xs font-bold text-gray-500">{g.score}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {rankings.length === 0 && <tr><td colSpan={6} className="table-td text-center text-gray-400 py-8">No groups yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
