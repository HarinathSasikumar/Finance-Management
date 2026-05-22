import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../api/notification.api';

const NAV = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/groups',    icon: '👥', label: 'Groups' },
  { to: '/analytics', icon: '📈', label: 'Analytics' },
  { to: '/rankings',  icon: '🏆', label: 'Rankings' },
  { to: '/notifications', icon: '🔔', label: 'Notifications', badge: true },
];

export default function Sidebar({ onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    notificationAPI.getAll().then(r => setUnread(r.data.unreadCount)).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="h-full bg-primary-600 flex flex-col shadow-xl">
      {/* Logo */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div>
          <h1 className="font-display text-xl font-bold text-white tracking-tight">🌿 RWDM</h1>
          <p className="text-blue-200 text-[10px] mt-0.5 leading-tight">Rural Woman Development Mission</p>
        </div>
        <button onClick={onClose} className="lg:hidden text-white/70 hover:text-white p-1 rounded-lg">✕</button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-blue-300 text-[10px] font-semibold uppercase tracking-widest px-3 mb-3 mt-2">Main Menu</p>
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link-inactive'}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge && unread > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <p className="text-blue-300 text-[10px] font-semibold uppercase tracking-widest px-3 mb-3 mt-6">Admin</p>
            <NavLink to="/groups" onClick={onClose} className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link-inactive'}>
              <span className="text-lg">⚙️</span>
              <span>Manage Groups</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/10 mb-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-blue-200 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-sm font-medium text-blue-200 hover:text-red-400 bg-white/5 hover:bg-red-500/10 py-2.5 rounded-xl transition-all group">
          <svg className="w-4 h-4 text-blue-200 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
