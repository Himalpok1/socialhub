import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsApi } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

const PLATFORM_ICONS = { facebook: '👥', instagram: '📸', tiktok: '🎵' };
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const toast = useToast();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    setLoading(true);
    postsApi.list({ limit: 200 })
      .then((res) => setPosts(res.data.posts.filter((p) => p.scheduledAt || p.publishedAt)))
      .catch(() => toast.error('Failed to load posts.'))
      .finally(() => setLoading(false));
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const getPostsForDay = (day) => {
    return posts.filter((p) => {
      const d = p.scheduledAt ? new Date(p.scheduledAt) : new Date(p.publishedAt);
      return isSameDay(d, day);
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Content Calendar</h1>
          <p>View and manage your scheduled content</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/compose')}>
          ✏️ New Post
        </button>
      </div>

      {/* Month Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          ← Prev
        </button>
        <h2 style={{ fontSize: '1.25rem', minWidth: 220, textAlign: 'center' }}>
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button className="btn btn-secondary btn-sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          Next →
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setCurrentMonth(new Date())}>
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {DAYS.map((d) => (
          <div key={d} className="calendar-day-header">{d}</div>
        ))}
        {calDays.map((day) => {
          const dayPosts = getPostsForDay(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentMonth);
          return (
            <div
              key={day.toString()}
              className={`calendar-day${isToday ? ' today' : ''}${!isCurrentMonth ? ' other-month' : ''}`}
              onClick={() => navigate('/compose')}
            >
              <div className="calendar-day-number">{format(day, 'd')}</div>
              {dayPosts.slice(0, 3).map((p) => (
                <div
                  key={p._id}
                  className={`calendar-post-dot ${p.status}`}
                  title={p.content}
                  onClick={(e) => { e.stopPropagation(); setSelectedPost(p); }}
                  style={{ cursor: 'pointer' }}
                >
                  {p.platforms.map((pl) => PLATFORM_ICONS[pl]).join('')} {p.content.substring(0, 18)}
                </div>
              ))}
              {dayPosts.length > 3 && (
                <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', padding: '0 4px' }}>
                  +{dayPosts.length - 3} more
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>Post Details</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPost(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {selectedPost.platforms.map((p) => (
                  <span key={p} className={`platform-badge ${p}`}>{PLATFORM_ICONS[p]} {p}</span>
                ))}
                <span className={`status-badge ${selectedPost.status}`}>{selectedPost.status}</span>
              </div>
              <div style={{ padding: '12px', background: 'var(--color-surface-2)', borderRadius: 8, fontSize: '0.9375rem', lineHeight: 1.6 }}>
                {selectedPost.content}
              </div>
              {selectedPost.scheduledAt && (
                <div style={{ fontSize: '0.875rem', color: 'var(--color-scheduled)' }}>
                  📅 Scheduled: {new Date(selectedPost.scheduledAt).toLocaleString()}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedPost(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => navigate(`/compose/${selectedPost._id}`)}>
                ✏️ Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
