import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupAPI } from '../api/group.api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const ProgressBar = ({ percent }) => {
  const color = percent >= 75 ? 'bg-green-500' : percent >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = percent >= 75 ? 'text-green-600' : percent >= 40 ? 'text-amber-600' : 'text-red-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-500 dark:text-gray-400">Collection Progress</span>
        <span className={`font-bold ${textColor}`}>{percent}%</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
    </div>
  );
};

const GroupCard = ({ group, onView, onEdit, onDelete, isAdmin }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col gap-4">
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-display font-bold text-slate-800 dark:text-white text-lg truncate">{group.name}</h3>
          <span className={`badge-${group.status} flex-shrink-0`}>{group.status}</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{group.description || 'No description'}</p>
      </div>
      {isAdmin && (
        <div className="flex gap-1 ml-2 flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); onEdit(group); }} className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit">✏️</button>
          <button onClick={e => { e.stopPropagation(); onDelete(group._id); }} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete">🗑️</button>
        </div>
      )}
    </div>

    {/* Stats grid */}
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: 'Members', value: group.memberCount || 0, icon: '👥' },
        { label: 'Monthly', value: `₹${group.monthlyContribution?.toLocaleString()}`, icon: '💳' },
        { label: 'Collected', value: `₹${(group.totalCollected || 0).toLocaleString()}`, icon: '💰' },
        { label: 'Duration', value: `${group.durationMonths}m`, icon: '📅' },
      ].map(s => (
        <div key={s.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{s.icon} {s.label}</p>
          <p className="font-bold text-slate-700 dark:text-white text-sm">{s.value}</p>
        </div>
      ))}
    </div>

    <ProgressBar percent={group.achievedPercent || 0} />

    {/* Custom target badge */}
    {group.useCustomTarget && group.customTarget > 0 && (
      <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-1.5">
        <span>🎯</span>
        <span>Custom Target: ₹{group.customTarget?.toLocaleString()}</span>
      </div>
    )}

    <button
      onClick={() => onView(group._id)}
      className="w-full btn btn-primary justify-center"
    >
      View Details →
    </button>
  </div>
);


const defaultForm = {
  name: '', description: '', monthlyContribution: '', durationMonths: '',
  startDate: '', status: 'active', useCustomTarget: false, customTarget: ''
};

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    groupAPI.getAll().then(r => setGroups(r.data)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditGroup(null); setForm(defaultForm); setModal(true); };
  const openEdit = (g) => {
    setEditGroup(g);
    setForm({
      name: g.name,
      description: g.description || '',
      monthlyContribution: g.monthlyContribution,
      durationMonths: g.durationMonths,
      startDate: g.startDate?.slice(0, 10),
      status: g.status,
      useCustomTarget: g.useCustomTarget || false,
      customTarget: g.customTarget || '',
    });
    setModal(true);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this group and all its data?')) return;
    try { await groupAPI.delete(id); toast.success('Group deleted'); load(); }
    catch { toast.error('Failed to delete group'); }
  };
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editGroup) { await groupAPI.update(editGroup._id, form); toast.success('Group updated!'); }
      else { await groupAPI.create(form); toast.success('Group created!'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const filtered = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Groups</h1>
          <p className="page-subtitle">{groups.length} group{groups.length !== 1 ? 's' : ''} managed</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              className="form-input pl-9 w-56"
              placeholder="Search groups..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button id="create-group-btn" className="btn btn-primary" onClick={openCreate}>
              + Create Group
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-64 animate-pulse bg-gray-100 dark:bg-gray-700" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-2">{search ? 'No groups found' : 'No groups yet'}</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">{search ? 'Try a different search term' : 'Create your first savings group to get started'}</p>
          {isAdmin && !search && <button className="btn btn-primary mx-auto" onClick={openCreate}>+ Create Group</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(g => (
            <GroupCard
              key={g._id}
              group={g}
              isAdmin={isAdmin}
              onView={id => navigate(`/groups/${id}`)}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editGroup ? '✏️ Edit Group' : '+ Create Group'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Group Name *</label>
            <input className="form-input" placeholder="e.g. Monthly Savings Club" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" placeholder="Brief description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Monthly Contribution (₹) *</label>
              <input className="form-input" type="number" min="1" placeholder="5000" value={form.monthlyContribution} onChange={e => setForm({ ...form, monthlyContribution: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (months) *</label>
              <input className="form-input" type="number" min="1" placeholder="12" value={form.durationMonths} onChange={e => setForm({ ...form, durationMonths: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input className="form-input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* ── Custom Target Section ── */}
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-600 p-4 space-y-3 bg-gray-50 dark:bg-gray-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-white">🎯 Custom Target Amount</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {form.useCustomTarget
                    ? 'Using your custom target below'
                    : form.monthlyContribution && form.durationMonths
                      ? `Auto-calculated: ₹${(Number(form.monthlyContribution) * Number(form.durationMonths)).toLocaleString()} × members`
                      : 'Auto-calculated from contribution × months × members'}
                </p>
              </div>
              {/* Toggle switch */}
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-3">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.useCustomTarget}
                  onChange={e => setForm({ ...form, useCustomTarget: e.target.checked, customTarget: e.target.checked ? form.customTarget : '' })}
                />
                <div className="w-10 h-5 bg-gray-200 dark:bg-gray-600 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:bg-primary-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>

            {/* Custom target input — shown only when toggle ON */}
            {form.useCustomTarget && (
              <div className="space-y-1.5">
                <label className="form-label">Target Amount (₹) *</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  placeholder="e.g. 120000"
                  value={form.customTarget}
                  onChange={e => setForm({ ...form, customTarget: e.target.value })}
                  required={form.useCustomTarget}
                />
                {/* Live preview */}
                {form.customTarget > 0 && form.monthlyContribution && form.durationMonths && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    📊 Auto would be ₹{(Number(form.monthlyContribution) * Number(form.durationMonths)).toLocaleString()} × members
                    &nbsp;→ Your target: ₹{Number(form.customTarget).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2 justify-end">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : editGroup ? '✅ Update' : '+ Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
