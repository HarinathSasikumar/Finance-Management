import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ledgerAPI } from '../api/ledger.api';
import { groupAPI } from '../api/group.api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Ledger() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ type: 'debit', amount: '', description: '', date: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([ledgerAPI.getByGroup(groupId), groupAPI.getById(groupId)])
      .then(([r1, r2]) => { setData(r1.data); setGroup(r2.data.group); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [groupId]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await ledgerAPI.addEntry(groupId, form);
      toast.success('Ledger entry added');
      setModal(false);
      setForm({ type: 'debit', amount: '', description: '', date: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add entry'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/groups/${groupId}`)}>← Back to {group?.name || 'Group'}</button>

      <div className="page-header">
        <div><h1 className="page-title">📒 Ledger</h1><p className="page-subtitle">{group?.name} — Transaction History</p></div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setModal(true)}>+ Add Entry</button>}
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="card flex items-start gap-4">
            <div className="stat-icon bg-green-100 dark:bg-green-900/50 text-green-600"><span>📥</span></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Credits</p>
              <p className="font-display text-2xl font-bold text-green-600">₹{data.totalCredits?.toLocaleString()}</p>
            </div>
          </div>
          <div className="card flex items-start gap-4">
            <div className="stat-icon bg-red-100 dark:bg-red-900/50"><span>📤</span></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Debits</p>
              <p className="font-display text-2xl font-bold text-red-500">₹{data.totalDebits?.toLocaleString()}</p>
            </div>
          </div>
          <div className="card flex items-start gap-4">
            <div className="stat-icon bg-blue-100 dark:bg-blue-900/50"><span>💳</span></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Balance</p>
              <p className={`font-display text-2xl font-bold ${data.currentBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                ₹{data.currentBalance?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Table */}
      {loading ? (
        <div className="card animate-pulse h-48" />
      ) : (
        <div className="card">
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
            <table className="w-full">
              <thead>
                <tr>
                  {['Date', 'Type', 'Description', 'Amount', 'Running Balance', 'By'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.entries?.map((entry, i) => (
                  <tr key={entry._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${i % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-700/20' : ''}`}>
                    <td className="table-td text-xs text-gray-400">{new Date(entry.date).toLocaleDateString('en-IN')}</td>
                    <td className="table-td"><span className={`badge-${entry.type}`}>{entry.type === 'credit' ? '📥 Credit' : '📤 Debit'}</span></td>
                    <td className="table-td text-gray-600 dark:text-gray-300 max-w-xs truncate">{entry.description}</td>
                    <td className={`table-td font-bold ${entry.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                      {entry.type === 'credit' ? '+' : '-'}₹{entry.amount?.toLocaleString()}
                    </td>
                    <td className={`table-td font-bold ${entry.runningBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      ₹{entry.runningBalance?.toLocaleString()}
                    </td>
                    <td className="table-td text-xs text-gray-400">{entry.addedBy?.name || 'System'}</td>
                  </tr>
                ))}
                {data?.entries?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table-td text-center text-gray-400 py-12">
                      <div className="text-4xl mb-2">📭</div>
                      <p>No ledger entries yet.</p>
                      <p className="text-xs mt-1">Mark contributions as paid to auto-create credit entries.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="+ Add Ledger Entry">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Entry Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[{ val: 'credit', label: '📥 Credit (Money In)' }, { val: 'debit', label: '📤 Debit (Money Out)' }].map(opt => (
                <button key={opt.val} type="button"
                  onClick={() => setForm({ ...form, type: opt.val })}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${form.type === opt.val
                    ? opt.val === 'credit'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input className="form-input" type="number" min="1" placeholder="1000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <input className="form-input" placeholder="e.g. Event expenses, extra contribution..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding...</> : '✅ Add Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
