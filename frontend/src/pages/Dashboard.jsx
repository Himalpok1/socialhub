import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postsApi, accountsApi, analyticsApi } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const PLATFORM_ICONS = { facebook: '👥', instagram: '📸', tiktok: '🎵' };
const PLATFORM_COLORS = {
  facebook: 'var(--color-facebook)',
  instagram: 'var(--color-instagram)',
  tiktok: 'var(--color-tiktok)',
};

function StatCard({ icon, value, label, change, accentStart, accentEnd }) {
  return (
    <div className="stat-card" style={{ '--accent-start': accentStart, '--accent-end': accentEnd }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {change && (
        <div className={`stat-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change)}% vs last week
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.overview({ range: 7 }),
      accountsApi.list(),
      postsApi.list({ limit: 5 }),
      postsApi.list({ status: 'scheduled', limit: 5 }),
    ])
      .then(([analyticsRes, accountsRes, postsRes, scheduledRes]) => {
        setStats(analyticsRes.data.overview);
        setAccounts(accountsRes.data.accounts);
        setRecentPosts(postsRes.data.posts);
        setScheduledPosts(scheduledRes.data.posts);
      })
      .catch(() => toast.error('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.875rem' }}>
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ marginTop: 4 }}>Here's an overview of your social media performance.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          icon="📝"
          value={stats?.totalPosts ?? 0}
          label="Total Posts"
          accentStart="#6366f1"
          accentEnd="#818cf8"
        />
        <StatCard
          icon="✅"
          value={stats?.publishedPosts ?? 0}
          label="Published"
          change={12}
          accentStart="#22c55e"
          accentEnd="#4ade80"
        />
        <StatCard
          icon="📅"
          value={stats?.scheduledPosts ?? 0}
          label="Scheduled"
          accentStart="#f59e0b"
          accentEnd="#fbbf24"
        />
        <StatCard
          icon="🔗"
          value={stats?.connectedAccounts ?? 0}
          label="Connected Accounts"
          accentStart="#3b82f6"
          accentEnd="#60a5fa"
        />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Recent Posts */}
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">📝 Recent Posts</span>
              <Link to="/posts" className="btn btn-ghost btn-sm">View all →</Link>
            </div>

            {recentPosts.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon">📭</div>
                <h3>No posts yet</h3>
                <p>Create your first post to get started.</p>
                <Link to="/compose" className="btn btn-primary btn-sm">✏️ Create Post</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentPosts.map((post) => (
                  <div key={post._id} className="post-card">
                    <div className="post-card-header">
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {post.platforms.map((p) => (
                          <span key={p} className={`platform-badge ${p}`}>
                            {PLATFORM_ICONS[p]} {p}
                          </span>
                        ))}
                      </div>
                      <span className={`status-badge ${post.status}`}>{post.status}</span>
                    </div>
                    <div className="post-card-content">{post.content}</div>
                    <div className="post-card-meta">
                      <span className="text-xs text-muted">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                      {post.scheduledAt && (
                        <span className="text-xs" style={{ color: 'var(--color-scheduled)' }}>
                          📅 {new Date(post.scheduledAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Connected Accounts */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🔗 Connected Accounts</span>
              <Link to="/accounts" className="btn btn-ghost btn-sm">Manage →</Link>
            </div>
            {accounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
                  No accounts connected
                </p>
                <Link to="/accounts" className="btn btn-primary btn-sm">Connect Now</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {accounts.map((acc) => (
                  <div key={acc._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                      src={acc.accountAvatar}
                      alt={acc.accountName}
                      className="avatar"
                      style={{ borderRadius: 8 }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }} className="truncate">
                        {acc.accountName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {acc.accountHandle || acc.platform}
                      </div>
                    </div>
                    <span className={`platform-badge ${acc.platform}`}>
                      {PLATFORM_ICONS[acc.platform]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Scheduled */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📅 Upcoming</span>
              <Link to="/calendar" className="btn btn-ghost btn-sm">Calendar →</Link>
            </div>
            {scheduledPosts.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0' }}>
                No scheduled posts
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {scheduledPosts.map((post) => (
                  <div key={post._id} style={{
                    padding: '10px 12px',
                    background: 'var(--color-surface-2)',
                    borderRadius: 8,
                    borderLeft: '3px solid var(--color-scheduled)',
                  }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }} className="truncate">
                      {post.content.substring(0, 60)}...
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-scheduled)' }}>
                      📅 {new Date(post.scheduledAt).toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      {post.platforms.map((p) => (
                        <span key={p} className={`platform-badge ${p}`} style={{ fontSize: '0.65rem' }}>
                          {PLATFORM_ICONS[p]}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>⚡ Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/compose" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                ✏️ Create New Post
              </Link>
              <Link to="/accounts" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                🔗 Connect Account
              </Link>
              <Link to="/analytics" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                📊 View Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
