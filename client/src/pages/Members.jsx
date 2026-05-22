import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { memberAPI } from '../api/member.api';
import { groupAPI } from '../api/group.api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const defaultForm = { name: '', email: '', phone: '' };

export default function Members() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([memberAPI.getByGroup(groupId), groupAPI.getById(groupId)])
      .then(([r1, r2]) => { setMembers(r1.data); setGroup(r2.data.group); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [groupId]);

  const openCreate = () => { setEditMember(null); setForm(defaultForm); setModal(true); };
  const openEdit = (m) => { setEditMember(m); setForm({ name: m.name, email: m.email || '', phone: m.phone || '' }); setModal(true); };
  const handleDelete = async (id) => {
    if (!window.confirm('Remove this member?')) return;
    try { await memberAPI.delete(groupId, id); toast.success('Member removed'); load(); }
    catch { toast.error('Failed to remove member'); }
  };
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editMember) { await memberAPI.update(groupId, editMember._id, form); toast.success('Member updated'); }
      else { await memberAPI.add(groupId, form); toast.success('Member added! Contributions auto-generated.'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/groups/${groupId}`)}>
        ← Back to {group?.name || 'Group'}
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Members</h1>
          <p className="page-subtitle">{group?.name} — {members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <button id="add-member-btn" className="btn btn-primary" onClick={openCreate}>+ Add Member</button>
      </div>

      {loading ? (
        <div className="card animate-pulse h-48" />
      ) : members.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-2">No members yet</h3>
          <p className="text-gray-400 text-sm mb-6">Add members to start tracking contributions</p>
          <button className="btn btn-primary mx-auto" onClick={openCreate}>+ Add First Member</button>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
            <table className="w-full">
              <thead>
                <tr>
                  {['Rank', 'Member', 'Email', 'Phone', 'Score', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="table-td text-xl font-bold">
                      {m.rank === 1 ? '🥇' : m.rank === 2 ? '🥈' : m.rank === 3 ? '🥉' : <span className="text-sm text-gray-500">#{m.rank}</span>}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {m.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700 dark:text-white">{m.name}</p>
                          <p className="text-xs text-gray-400">Member</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td text-gray-400 text-xs">{m.email || '—'}</td>
                    <td className="table-td text-gray-400 text-xs">{m.phone || '—'}</td>
                    <td className="table-td" style={{ minWidth: 130 }}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${m.score >= 75 ? 'bg-green-500' : m.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${m.score || 0}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 min-w-[32px]">{m.score || 0}%</span>
                      </div>
                    </td>
                    <td className="table-td text-xs text-gray-400">{new Date(m.joinedAt).toLocaleDateString()}</td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(m)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editMember ? '✏️ Edit Member' : '+ Add Member'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" type="tel" placeholder="+91 99999 99999" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : editMember ? '✅ Update' : '+ Add Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
