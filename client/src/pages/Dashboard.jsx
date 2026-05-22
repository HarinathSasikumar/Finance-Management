import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI } from '../api/analytics.api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

const StatCard = ({ icon, label, value, sub, color }) => {
  const colors = {
    blue:   { icon: 'bg-blue-100 dark:bg-blue-900/50',   text: 'text-blue-600 dark:text-blue-400',   bar: 'bg-blue-600' },
    green:  { icon: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-400', bar: 'bg-green-600' },
    red:    { icon: 'bg-red-100 dark:bg-red-900/50',     text: 'text-red-600 dark:text-red-400',     bar: 'bg-red-600' },
    purple: { icon: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-600' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-4">
        <div className={`stat-icon ${c.icon}`}>
          <span className="text-xl">{icon}</span>
        </div>
        <span className={`text-2xl font-display font-bold ${c.text}`}>{value}</span>
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-sm">
      <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-semibold">₹{p.value?.toLocaleString()}</p>)}
    </div>
  );
};

const ProgressBar = ({ percent }) => {
  const color = percent >= 75 ? 'bg-green-500' : percent >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="progress-bar">
      <div className={`progress-fill ${color}`} style={{ width: `${Math.min(100, percent)}%` }} />
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    analyticsAPI.getDashboard().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const { stats, monthlyTrend, groupPerformance, insights } = data;
  const pieData = groupPerformance.map(g => ({ name: g.name, value: g.collectedAmount || 0 }));

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Good {
            new Date().getHours() < 4 ? 'Night' :
            new Date().getHours() < 12 ? 'Morning' :
            new Date().getHours() < 17 ? 'Afternoon' : 'Evening'
          }, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="page-subtitle">Here's your financial overview for today.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon="💰" label="Total Collection" value={`₹${stats.totalCollected?.toLocaleString()}`} color="blue" />
        <StatCard icon="👥" label="Total Groups" value={stats.totalGroups} sub={`${stats.totalMembers} members`} color="green" />
        <StatCard icon="⏳" label="Pending Payments" value={stats.pendingCount} color="red" />
        <StatCard icon="✅" label="Payments Collected" value={stats.paidCount} color="purple" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="card lg:col-span-2">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white text-base mb-6">📈 Monthly Collection Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyTrend} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white text-base mb-6">🍩 Collection by Group</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData.length ? pieData : [{ name: 'No data', value: 1 }]} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => `₹${v.toLocaleString()}`} contentStyle={{ background: 'var(--tw-prose-body)', border: 'none', borderRadius: 8, fontSize: 12 }} />
              <Legend formatter={v => <span className="text-xs text-gray-500 dark:text-gray-400">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Group Performance */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white text-base">🏢 Group Performance</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/groups')}>View All →</button>
        </div>
        {groupPerformance.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-semibold text-slate-700 dark:text-white">No groups yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Create your first group to see data here</p>
            <button className="btn btn-primary" onClick={() => navigate('/groups')}>Create Group</button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
            <table className="w-full">
              <thead>
                <tr>
                  {['Group', 'Members', 'Collected', 'Target', 'Progress', 'Status'].map(h => (
                    <th key={h} className="table-th first:rounded-tl-xl last:rounded-tr-xl">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupPerformance.map(g => (
                  <tr key={g.id} onClick={() => navigate(`/groups/${g.id}`)} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors">
                    <td className="table-td font-semibold">{g.name}</td>
                    <td className="table-td">{g.memberCount}</td>
                    <td className="table-td text-green-600 dark:text-green-400 font-medium">₹{g.collectedAmount?.toLocaleString()}</td>
                    <td className="table-td text-gray-500">₹{g.target?.toLocaleString()}</td>
                    <td className="table-td" style={{ minWidth: 140 }}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 progress-bar">
                          <div className={`progress-fill ${g.achievedPercent >= 75 ? 'bg-green-500' : g.achievedPercent >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, g.achievedPercent)}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 min-w-[36px]">{g.achievedPercent}%</span>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className={g.achievedPercent >= 100 ? 'badge-paid' : 'badge-pending'}>
                        {g.achievedPercent >= 100 ? '✅ Achieved' : '⏳ Ongoing'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Smart Insights */}
      {insights?.length > 0 && (
        <div className="card">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white text-base mb-5">💡 Smart Insights</h3>
          <div className="space-y-3">
            {insights.map((ins, i) => (
              <div key={i} className={`insight-${ins.type}`}>{ins.message}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
