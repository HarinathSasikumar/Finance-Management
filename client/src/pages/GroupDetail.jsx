import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupAPI } from '../api/group.api';
import { analyticsAPI } from '../api/analytics.api';

const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ProgressBar = ({ percent, showLabel = true }) => {
  const color = percent >= 75 ? 'bg-green-500' : percent >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = percent >= 75 ? 'text-green-600' : percent >= 40 ? 'text-amber-600' : 'text-red-500';
  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-500">Overall Achievement</span>
          <span className={`font-bold ${textColor}`}>{percent}% — {percent >= 100 ? 'Achieved ✅' : 'In Progress'}</span>
        </div>
      )}
      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
    </div>
  );
};

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    setLoading(true);
    Promise.all([groupAPI.getById(id), analyticsAPI.getPredictions(id)])
      .then(([r1, r2]) => { setData(r1.data); setPrediction(r2.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const { group, members, contributions, ledger, summary } = data;
  const months = [];
  const start = new Date(group.startDate);
  for (let i = 0; i < group.durationMonths; i++) {
    const d = new Date(start); d.setMonth(d.getMonth() + i);
    months.push({ month: d.getMonth() + 1, year: d.getFullYear(), label: `${MONTHS[d.getMonth() + 1]}'${d.getFullYear().toString().slice(2)}` });
  }
  const getContrib = (memberId, month, year) => contributions.find(c => c.memberId?._id === memberId && c.month === month && c.year === year);

  const TABS = ['overview', 'members', 'contributions', 'prediction'];

  return (
    <div className="space-y-6">
      {/* Back */}
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/groups')}>← Back to Groups</button>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-3xl font-bold">{group.name}</h1>
                <span className={`badge text-xs font-semibold px-3 py-1 rounded-full ${ group.status === 'active' ? 'bg-green-400/20 text-green-200' : 'bg-white/20 text-white/80'}`}>{group.status}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-blue-200 text-sm">
                <span>📅 Started: {new Date(group.startDate).toLocaleDateString('en-IN')}</span>
                <span>⏱️ {group.durationMonths} months</span>
                <span>💰 ₹{group.monthlyContribution?.toLocaleString()}/month</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors" onClick={() => navigate(`/groups/${id}/members`)}>👥 Members</button>
              <button className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors" onClick={() => navigate(`/groups/${id}/contributions`)}>💳 Contributions</button>
              <button className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors" onClick={() => navigate(`/groups/${id}/ledger`)}>📒 Ledger</button>
            </div>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Collected', value: `₹${summary.totalCollected?.toLocaleString()}`, color: 'text-green-300' },
              { label: 'Target', value: `₹${summary.totalTarget?.toLocaleString()}`, color: 'text-white' },
              { label: 'Remaining', value: `₹${summary.remainingBalance?.toLocaleString()}`, color: 'text-amber-300' },
              { label: 'Members', value: summary.memberCount, color: 'text-blue-200' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <p className="text-blue-200 text-xs uppercase tracking-wide mb-1">{s.label}</p>
                <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <ProgressBar percent={summary.achievedPercent} />
        </div>
      </div>

      {/* Pending Alert */}
      {summary.pendingMembers?.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-sm font-medium">
          ⚠️ Pending this month: <strong>{summary.pendingMembers.join(', ')}</strong>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar">
        {TABS.map(t => (
          <div key={t} className={tab === t ? 'tab-active' : 'tab-inactive'} onClick={() => setTab(t)}>
            {t === 'overview' ? '📊 Overview' : t === 'members' ? '👥 Members' : t === 'contributions' ? '💳 Contributions' : '🔮 Prediction'}
          </div>
        ))}
      </div>

      {/* TAB: Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-display font-semibold text-base text-slate-800 dark:text-white mb-4">📒 Recent Transactions</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
              <table className="w-full">
                <thead><tr><th className="table-th">Date</th><th className="table-th">Type</th><th className="table-th">Amount</th><th className="table-th">Balance</th></tr></thead>
                <tbody>
                  {ledger.slice(-5).reverse().map(e => (
                    <tr key={e._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="table-td text-xs text-gray-400">{new Date(e.date).toLocaleDateString()}</td>
                      <td className="table-td"><span className={`badge-${e.type}`}>{e.type}</span></td>
                      <td className={`table-td font-semibold ${e.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>{e.type === 'credit' ? '+' : '-'}₹{e.amount?.toLocaleString()}</td>
                      <td className="table-td font-bold">₹{e.runningBalance?.toLocaleString()}</td>
                    </tr>
                  ))}
                  {ledger.length === 0 && <tr><td colSpan={4} className="table-td text-center text-gray-400 py-6">No transactions yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 className="font-display font-semibold text-base text-slate-800 dark:text-white mb-4">🏅 Top Performers</h3>
            <div className="space-y-4">
              {members.slice(0, 5).map((m, i) => (
                <div key={m._id} className="flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-slate-700 dark:text-white truncate">{m.name}</span>
                      <span className="text-xs font-bold text-gray-500 ml-2">{m.score || 0}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary-600" style={{ width: `${m.score || 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              {members.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No members added yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Members */}
      {tab === 'members' && (
        <div className="card">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-display font-semibold text-base text-slate-800 dark:text-white">👥 All Members ({members.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={() => navigate(`/groups/${id}/members`)}>Manage →</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
            <table className="w-full">
              <thead><tr><th className="table-th">Rank</th><th className="table-th">Member</th><th className="table-th">Phone</th><th className="table-th">Score</th><th className="table-th">Joined</th></tr></thead>
              <tbody>
                {members.map(m => (
                  <tr key={m._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="table-td font-bold text-lg">{m.rank === 1 ? '🥇' : m.rank === 2 ? '🥈' : m.rank === 3 ? '🥉' : `#${m.rank}`}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 font-bold text-xs">{m.name?.charAt(0)}</div>
                        <span className="font-semibold">{m.name}</span>
                      </div>
                    </td>
                    <td className="table-td text-gray-400">{m.phone || '—'}</td>
                    <td className="table-td" style={{ minWidth: 120 }}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-600 rounded-full" style={{ width: `${m.score || 0}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{m.score || 0}%</span>
                      </div>
                    </td>
                    <td className="table-td text-gray-400 text-xs">{new Date(m.joinedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Contributions grid */}
      {tab === 'contributions' && (
        <div className="card">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-display font-semibold text-base text-slate-800 dark:text-white">💳 Contribution Matrix</h3>
              <p className="text-xs text-gray-400 mt-1">✓ = Paid &nbsp;|&nbsp; ○ = Pending</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate(`/groups/${id}/contributions`)}>Mark Payments →</button>
          </div>
          <div className="overflow-x-auto">
            <table style={{ borderCollapse: 'separate', borderSpacing: 4 }}>
              <thead>
                <tr>
                  <th className="text-left text-xs text-gray-400 font-semibold uppercase px-3 py-2" style={{ minWidth: 130 }}>Member</th>
                  {months.map(m => <th key={`${m.year}-${m.month}`} className="text-xs text-gray-400 font-semibold text-center px-1 py-2" style={{ minWidth: 68 }}>{m.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member._id}>
                    <td className="text-sm font-semibold px-3 py-1 text-slate-700 dark:text-gray-200">{member.name}</td>
                    {months.map(m => {
                      const c = getContrib(member._id, m.month, m.year);
                      return (
                        <td key={`${m.year}-${m.month}`} className="p-0.5">
                          <div className={c?.status === 'paid' ? 'contrib-cell-paid' : 'contrib-cell-pending'}>
                            {c?.status === 'paid' ? '✓' : '○'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Prediction */}
      {tab === 'prediction' && prediction && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <h3 className="font-display font-semibold text-base text-slate-800 dark:text-white">🔮 Predictive Analysis</h3>
            <div className={prediction.willAchieve ? 'insight-success' : 'insight-warning'}>{prediction.message}</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Collected', value: `₹${prediction.totalCollected?.toLocaleString()}`, color: 'text-green-600' },
                { label: 'Target', value: `₹${prediction.groupTarget?.toLocaleString()}`, color: '' },
                { label: 'Projected', value: `₹${prediction.projectedTotal?.toLocaleString()}`, color: prediction.willAchieve ? 'text-green-600' : 'text-amber-600' },
                { label: 'Months Left', value: prediction.remainingMonths, color: '' },
                { label: 'Avg/Month', value: `₹${prediction.avgMonthlyRate?.toLocaleString()}`, color: '' },
                { label: 'Confidence', value: `${prediction.confidence}%`, color: prediction.confidence >= 100 ? 'text-green-600' : 'text-amber-600' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                  <p className={`font-bold text-base ${item.color || 'text-slate-800 dark:text-white'}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card flex flex-col items-center justify-center text-center py-8">
            <div className="text-6xl mb-4">{prediction.willAchieve ? '🎯' : '📉'}</div>
            <div className={`font-display text-6xl font-black mb-3 ${prediction.willAchieve ? 'text-green-600' : 'text-amber-500'}`}>
              {prediction.confidence}%
            </div>
            <p className="font-semibold text-slate-700 dark:text-white text-lg">{prediction.willAchieve ? 'On Track!' : 'Below Target'}</p>
            <p className="text-gray-400 text-sm mt-1">{prediction.willAchieve ? 'Projected to achieve the target' : 'Collection speed needs to improve'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
