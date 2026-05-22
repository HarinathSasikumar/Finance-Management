import React, { useEffect, useState } from 'react';
import { memberAPI } from '../api/member.api';
import { analyticsAPI } from '../api/analytics.api';

const rankIcon = (r) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r}`;
const rankBg = (r) => r === 1 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : r === 2 ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' : r === 3 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700';

export default function Rankings() {
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('members');

  useEffect(() => {
    Promise.all([memberAPI.getRankings(), analyticsAPI.getGroupRankings()])
      .then(([r1, r2]) => { setMembers(r1.data); setGroups(r2.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">🏆 Rankings</h1>
        <p className="page-subtitle">Leaderboard ranked by payment consistency and score</p>
      </div>

      <div className="tab-bar">
        <div className={tab === 'members' ? 'tab-active' : 'tab-inactive'} onClick={() => setTab('members')}>👤 Members</div>
        <div className={tab === 'groups' ? 'tab-active' : 'tab-inactive'} onClick={() => setTab('groups')}>🏢 Groups</div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-gray-700" />)}
        </div>
      ) : tab === 'members' ? (
        <div className="space-y-3">
          {members.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-6xl mb-4">👤</div>
              <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white">No members yet</h3>
            </div>
          ) : members.map((m, i) => (
            <div key={m._id} className={`flex items-center gap-4 p-4 rounded-2xl border ${rankBg(i + 1)} transition-all`}>
              <div className="text-3xl flex-shrink-0 w-12 text-center">{rankIcon(i + 1)}</div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {m.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800 dark:text-white">{m.name}</span>
                  {i === 0 && <span className="badge bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400">Top Performer ⭐</span>}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-gray-400">{m.groupId?.name || '—'}</span>
                  <span className="text-xs text-gray-400">{m.phone || '—'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="hidden sm:block">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-28 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${m.score >= 75 ? 'bg-green-500' : m.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${m.score || 0}%` }} />
                    </div>
                  </div>
                </div>
                <span className="font-display text-xl font-bold text-primary-600 dark:text-primary-400 min-w-[48px] text-right">{m.score || 0}%</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {groups.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white">No groups yet</h3>
            </div>
          ) : groups.map(g => (
            <div key={g.id} className={`flex items-center gap-4 p-4 rounded-2xl border ${rankBg(g.rank)} transition-all`}>
              <div className="text-3xl flex-shrink-0 w-12 text-center">{rankIcon(g.rank)}</div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {g.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800 dark:text-white">{g.name}</span>
                  <span className={`badge-${g.status || 'active'}`}>{g.status}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                  <span>{g.memberCount} members</span>
                  <span>₹{g.collectedAmount?.toLocaleString()} collected</span>
                  <span>Target: ₹{g.target?.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="hidden sm:block w-28 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${g.score >= 75 ? 'bg-green-500' : g.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${g.score}%` }} />
                </div>
                <span className="font-display text-xl font-bold text-green-600 dark:text-green-400 min-w-[48px] text-right">{g.score}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
