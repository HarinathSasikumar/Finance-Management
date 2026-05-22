import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contributionAPI } from '../api/contribution.api';
import { memberAPI } from '../api/member.api';
import { groupAPI } from '../api/group.api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Status badge
const StatusBadge = ({ status, paidAmount, amount }) => {
  if (status === 'paid')    return <span className="badge-paid">✓ Paid</span>;
  if (status === 'partial') return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400">◑ Partial ₹{paidAmount?.toLocaleString()}</span>;
  return <span className="badge-pending">○ Pending</span>;
};

// Matrix cell
const ContribCell = ({ c, required, onClick }) => {
  if (!c || c.status === 'pending')
    return <div className="contrib-cell-pending" onClick={onClick} title="Pending — click to record payment">○</div>;
  if (c.status === 'paid')
    return <div className="contrib-cell-paid" onClick={onClick} title={`Paid ₹${c.paidAmount?.toLocaleString()}`}>✓</div>;
  // partial
  const pct = Math.round(((c.paidAmount || 0) / required) * 100);
  return (
    <div
      onClick={onClick}
      title={`Partial: ₹${c.paidAmount?.toLocaleString()} of ₹${required?.toLocaleString()}`}
      className="w-full h-9 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-150 select-none bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 hover:opacity-80 border border-orange-300 dark:border-orange-700"
    >
      {pct}%
    </div>
  );
};

export default function Contributions() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [contributions, setContributions] = useState([]);
  const [members, setMembers]     = useState([]);
  const [group, setGroup]         = useState(null);
  const [summary, setSummary]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('matrix');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear]   = useState('');

  // Payment modal state
  const [payModal, setPayModal]         = useState(false);
  const [payTarget, setPayTarget]       = useState(null); // { member, month, year, existing }
  const [payAmount, setPayAmount]       = useState('');
  const [payNote, setPayNote]           = useState('');
  const [paying, setPaying]             = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      contributionAPI.getByGroup(groupId, filterMonth && filterYear ? { month: filterMonth, year: filterYear } : {}),
      memberAPI.getByGroup(groupId),
      groupAPI.getById(groupId),
      contributionAPI.getSummary(groupId),
    ])
      .then(([r1, r2, r3, r4]) => {
        setContributions(r1.data);
        setMembers(r2.data);
        setGroup(r3.data.group);
        setSummary(r4.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [groupId, filterMonth, filterYear]);

  // Open payment modal
  const openPayModal = (member, month, year) => {
    if (!isAdmin) { toast.error('Admin only'); return; }
    const existing = contributions.find(c => c.memberId?._id === member._id && c.month === month && c.year === year);
    setPayTarget({ member, month, year, existing });
    setPayAmount(existing?.paidAmount > 0 ? String(existing.paidAmount) : '');
    setPayNote(existing?.note || '');
    setPayModal(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payTarget) return;
    setPaying(true);
    const { member, month, year } = payTarget;
    const amt = Number(payAmount);
    if (isNaN(amt) || amt < 0) { toast.error('Enter a valid amount'); setPaying(false); return; }
    try {
      await contributionAPI.mark({
        memberId: member._id, groupId, month, year,
        paidAmount: amt,
        note: payNote,
      });
      const required = group?.monthlyContribution || 0;
      const status = amt >= required ? 'paid' : amt > 0 ? 'partial' : 'pending';
      toast.success(
        status === 'paid'    ? `✅ Full payment recorded for ${member.name}` :
        status === 'partial' ? `◑ Partial payment ₹${amt.toLocaleString()} recorded (₹${(required - amt).toLocaleString()} remaining)` :
                               `Payment reset to pending`
      );
      setPayModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setPaying(false); }
  };

  const months = [];
  if (group) {
    const start = new Date(group.startDate);
    for (let i = 0; i < group.durationMonths; i++) {
      const d = new Date(start); d.setMonth(d.getMonth() + i);
      months.push({ month: d.getMonth() + 1, year: d.getFullYear(), label: `${MONTHS[d.getMonth() + 1]}'${d.getFullYear().toString().slice(2)}` });
    }
  }

  const getContrib = (memberId, month, year) =>
    contributions.find(c => c.memberId?._id === memberId && c.month === month && c.year === year);

  const totalCollected = contributions.reduce((s, c) => s + (Number(c.paidAmount) || 0), 0);
  const totalPartial   = contributions.filter(c => c.status === 'partial').reduce((s, c) => s + (c.amount - (c.paidAmount || 0)), 0);
  const totalPending   = contributions.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0);
  const rate = contributions.length > 0
    ? Math.round((contributions.filter(c => c.status === 'paid').length / contributions.length) * 100) : 0;

  const required = group?.monthlyContribution || 0;

  return (
    <div className="space-y-6">
      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/groups/${groupId}`)}>← Back to {group?.name || 'Group'}</button>

      <div className="page-header">
        <div><h1 className="page-title">💳 Contributions</h1><p className="page-subtitle">{group?.name}</p></div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="card flex items-start gap-4">
          <div className="stat-icon bg-green-100 dark:bg-green-900/50"><span>💰</span></div>
          <div><p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Collected</p><p className="font-display text-2xl font-bold text-green-600">₹{totalCollected.toLocaleString()}</p></div>
        </div>
        <div className="card flex items-start gap-4">
          <div className="stat-icon bg-orange-100 dark:bg-orange-900/50"><span>◑</span></div>
          <div><p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Partial Remaining</p><p className="font-display text-2xl font-bold text-orange-500">₹{totalPartial.toLocaleString()}</p></div>
        </div>
        <div className="card flex items-start gap-4">
          <div className="stat-icon bg-amber-100 dark:bg-amber-900/50"><span>⏳</span></div>
          <div><p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Pending</p><p className="font-display text-2xl font-bold text-amber-600">₹{totalPending.toLocaleString()}</p></div>
        </div>
        <div className="card flex items-start gap-4">
          <div className="stat-icon bg-blue-100 dark:bg-blue-900/50"><span>📊</span></div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Collection Rate</p>
            <p className="font-display text-2xl font-bold text-primary-600">{rate}%</p>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-2 w-24 overflow-hidden"><div className={`h-full rounded-full ${rate >= 75 ? 'bg-green-500' : rate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${rate}%` }} /></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {['matrix', 'monthly', 'list'].map(t => (
          <div key={t} className={tab === t ? 'tab-active' : 'tab-inactive'} onClick={() => setTab(t)}>
            {t === 'matrix' ? '📋 Matrix' : t === 'monthly' ? '📅 Monthly' : '📄 List'}
          </div>
        ))}
      </div>

      {loading ? <div className="card animate-pulse h-48" /> : (
        <>
          {/* ── Matrix Tab ── */}
          {tab === 'matrix' && (
            <div className="card">
              {isAdmin && <p className="text-xs text-primary-600 dark:text-primary-400 mb-4 font-medium">💡 Click any cell to record / update payment amount</p>}
              <div className="overflow-x-auto">
                <table style={{ borderCollapse: 'separate', borderSpacing: 4 }}>
                  <thead>
                    <tr>
                      <th className="text-left text-xs text-gray-400 font-semibold uppercase px-3 py-2" style={{ minWidth: 130 }}>Member</th>
                      {months.map(m => <th key={`${m.year}-${m.month}`} className="text-xs text-gray-400 font-semibold text-center px-1 py-2" style={{ minWidth: 72 }}>{m.label}</th>)}
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
                              <ContribCell c={c} required={required} onClick={() => openPayModal(member, m.month, m.year)} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {members.length === 0 && <tr><td colSpan={months.length + 1} className="text-center text-gray-400 py-8 text-sm">No members found</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-4 mt-4 text-xs flex-wrap">
                <span className="badge-paid">✓ Full Paid</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700">◑ Partial (shows %)</span>
                <span className="badge-pending">○ Pending</span>
              </div>
            </div>
          )}

          {/* ── Monthly Tab ── */}
          {tab === 'monthly' && (
            <div className="card overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700 p-0">
              <table className="w-full">
                <thead><tr><th className="table-th">Month/Year</th><th className="table-th">Target</th><th className="table-th">Collected</th><th className="table-th">Paid</th><th className="table-th">Partial</th><th className="table-th">Pending</th><th className="table-th">Achievement</th><th className="table-th">Status</th></tr></thead>
                <tbody>
                  {summary.map(s => (
                    <tr key={`${s.year}-${s.month}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="table-td font-semibold">{MONTHS[s.month]} {s.year}</td>
                      <td className="table-td text-gray-500 font-medium">₹{s.target?.toLocaleString()}</td>
                      <td className="table-td text-green-600 font-medium">₹{s.collected?.toLocaleString()}</td>
                      <td className="table-td"><span className="badge-paid">{s.paid}</span></td>
                      <td className="table-td"><span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700">{s.partial || 0}</span></td>
                      <td className="table-td"><span className="badge-pending">{s.pending}</span></td>
                      <td className="table-td" style={{ minWidth: 140 }}>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${s.achievedPercent >= 75 ? 'bg-green-500' : s.achievedPercent >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.achievedPercent}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 min-w-[36px]">{s.achievedPercent}%</span>
                        </div>
                      </td>
                      <td className="table-td"><span className={s.status === 'Achieved' ? 'badge-paid' : 'badge-pending'}>{s.status}</span></td>
                    </tr>
                  ))}
                  {summary.length === 0 && <tr><td colSpan={8} className="table-td text-center text-gray-400 py-8">No data yet</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ── List Tab ── */}
          {tab === 'list' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <select className="form-input max-w-[140px]" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                  <option value="">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{MONTHS[i+1]}</option>)}
                </select>
                <input className="form-input max-w-[100px]" type="number" placeholder="Year" value={filterYear} onChange={e => setFilterYear(e.target.value)} />
              </div>
              <div className="card overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700 p-0">
                <table className="w-full">
                  <thead><tr>
                    <th className="table-th">Member</th><th className="table-th">Month</th><th className="table-th">Required</th>
                    <th className="table-th">Paid</th><th className="table-th">Remaining</th><th className="table-th">Status</th><th className="table-th">Date</th>
                  </tr></thead>
                  <tbody>
                    {contributions.map(c => {
                      const remaining = c.amount - (c.paidAmount || 0);
                      return (
                        <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="table-td font-semibold">{c.memberId?.name || '—'}</td>
                          <td className="table-td">{MONTHS[c.month]} {c.year}</td>
                          <td className="table-td text-gray-500">₹{c.amount?.toLocaleString()}</td>
                          <td className="table-td font-medium text-green-600">₹{(c.paidAmount || 0).toLocaleString()}</td>
                          <td className={`table-td font-medium ${remaining > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {remaining > 0 ? `₹${remaining.toLocaleString()}` : '—'}
                          </td>
                          <td className="table-td"><StatusBadge status={c.status} paidAmount={c.paidAmount} amount={c.amount} /></td>
                          <td className="table-td text-gray-400 text-xs">{c.paidAt ? new Date(c.paidAt).toLocaleDateString() : '—'}</td>
                        </tr>
                      );
                    })}
                    {contributions.length === 0 && <tr><td colSpan={7} className="table-td text-center text-gray-400 py-8">No contributions found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Payment Modal ── */}
      <Modal isOpen={payModal} onClose={() => setPayModal(false)} title="💳 Record Payment">
        {payTarget && (
          <form onSubmit={handlePaySubmit} className="space-y-5">
            {/* Member info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 font-bold text-sm">
                {payTarget.member.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-white text-sm">{payTarget.member.name}</p>
                <p className="text-xs text-gray-400">{MONTHS[payTarget.month]} {payTarget.year} — Required: <strong className="text-slate-600 dark:text-gray-300">₹{required.toLocaleString()}</strong></p>
              </div>
            </div>

            {/* Amount input */}
            <div className="form-group">
              <label className="form-label">Amount Paid (₹) *</label>
              <input
                className="form-input text-lg font-semibold"
                type="number" min="0" max={required} step="1"
                placeholder={`Max ₹${required.toLocaleString()}`}
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                required
                autoFocus
              />
              {/* Live status preview */}
              {payAmount !== '' && (
                <div className={`mt-2 p-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  Number(payAmount) >= required ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                  Number(payAmount) > 0 ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' :
                  'bg-gray-50 dark:bg-gray-700 text-gray-500'
                }`}>
                  {Number(payAmount) >= required ? (
                    <><span>✅</span> Full payment — will mark as <strong>Paid</strong></>
                  ) : Number(payAmount) > 0 ? (
                    <><span>◑</span> Partial payment — <strong>₹{(required - Number(payAmount)).toLocaleString()}</strong> still remaining</>
                  ) : (
                    <><span>○</span> Will reset to <strong>Pending</strong></>
                  )}
                </div>
              )}
            </div>

            {/* Quick fill buttons */}
            <div className="flex gap-2 flex-wrap">
              <p className="text-xs text-gray-400 w-full">Quick fill:</p>
              {[25, 50, 75, 100].map(pct => (
                <button key={pct} type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                  onClick={() => setPayAmount(String(Math.round(required * pct / 100)))}>
                  {pct}% (₹{Math.round(required * pct / 100).toLocaleString()})
                </button>
              ))}
            </div>

            {/* Note */}
            <div className="form-group">
              <label className="form-label">Note (optional)</label>
              <input className="form-input" placeholder="e.g. Paid via UPI, will pay rest next week..." value={payNote} onChange={e => setPayNote(e.target.value)} />
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button type="button" className="btn btn-secondary" onClick={() => setPayModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={paying}>
                {paying ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : '✅ Save Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
