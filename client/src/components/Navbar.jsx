import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notificationAPI } from '../api/notification.api';

const TITLES = {
  '/dashboard':    'Dashboard',
  '/groups':       'Groups',
  '/analytics':    'Analytics',
  '/rankings':     'Rankings',
  '/notifications':'Notifications',
};

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    notificationAPI.getAll().then(r => setUnread(r.data.unreadCount)).catch(() => {});
  }, [location]);

  const title = Object.entries(TITLES).find(([path]) => location.pathname.startsWith(path))?.[1] || 'RWDM';

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 h-16 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center px-4 lg:px-8 z-10 shadow-sm">
      {/* Hamburger (mobile) */}
      <button
        className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white p-2 rounded-lg mr-2"
        onClick={onMenuClick}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Title */}
      <h2 className="font-display font-bold text-slate-800 dark:text-white text-lg flex-1">{title}</h2>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Notifications"
        >
          🔔
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* User info */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-100 dark:border-gray-700 ml-1">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-slate-700 dark:text-white leading-none">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize leading-none mt-0.5">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
