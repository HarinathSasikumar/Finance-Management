import React, { useEffect, useState } from 'react';
import { notificationAPI } from '../api/notification.api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  due_payment:       { icon: '⏰', bg: 'bg-amber-50 dark:bg-amber-900/20', iconBg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-700 dark:text-amber-300' },
  payment_received:  { icon: '💰', bg: 'bg-green-50 dark:bg-green-900/20', iconBg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-700 dark:text-green-300' },
  group_created:     { icon: '🏢', bg: 'bg-blue-50 dark:bg-blue-900/20', iconBg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-700 dark:text-blue-300' },
  member_added:      { icon: '👤', bg: 'bg-cyan-50 dark:bg-cyan-900/20', iconBg: 'bg-cyan-100 dark:bg-cyan-900/50', text: 'text-cyan-700 dark:text-cyan-300' },
  target_achieved:   { icon: '🎯', bg: 'bg-green-50 dark:bg-green-900/20', iconBg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-700 dark:text-green-300' },
  reminder:          { icon: '🔔', bg: 'bg-purple-50 dark:bg-purple-900/20', iconBg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-700 dark:text-purple-300' },
  system:            { icon: 'ℹ️', bg: 'bg-gray-50 dark:bg-gray-800', iconBg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' },
};

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function Notifications() {
  const { isAdmin } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = () => {
    notificationAPI.getAll()
      .then(r => { setNotifs(r.data.notifications); setUnread(r.data.unreadCount); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const markRead = async (id) => { await notificationAPI.markRead(id); load(); };
  const markAllRead = async () => { await notificationAPI.markAllRead(); toast.success('All marked as read'); load(); };
  const sendReminders = async () => {
    setSending(true);
    try { const r = await notificationAPI.sendReminders(); toast.success(r.data.message); load(); }
    catch { toast.error('Failed to send reminders'); }
    finally { setSending(false); }
  };
  const deleteNotif = async (id, e) => { e.stopPropagation(); await notificationAPI.delete(id); load(); };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔔 Notifications</h1>
          <p className="page-subtitle">{unread} unread notification{unread !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {unread > 0 && (
            <button className="btn btn-secondary" onClick={markAllRead}>✅ Mark All Read</button>
          )}
          {isAdmin && (
            <button className="btn btn-primary" onClick={sendReminders} disabled={sending}>
              {sending ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</> : '📨 Send Reminders'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-gray-700" />)}</div>
      ) : notifs.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-2">All caught up!</h3>
          <p className="text-gray-400 text-sm">No notifications to show</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
            return (
              <div
                key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-150 relative
                  ${n.isRead
                    ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    : `${cfg.bg} border-opacity-60 cursor-pointer shadow-sm`
                  }`}
              >
                {/* Unread dot */}
                {!n.isRead && (
                  <span className="absolute top-4 right-12 w-2 h-2 rounded-full bg-primary-600" />
                )}

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${cfg.iconBg}`}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${n.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-800 dark:text-white'}`}>{n.message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                <button
                  onClick={e => deleteNotif(n._id, e)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex-shrink-0 text-xs"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
