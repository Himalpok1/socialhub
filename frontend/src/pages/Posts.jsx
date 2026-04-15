import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postsApi } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

const PLATFORM_ICONS = { facebook: '👥', instagram: '📸', tiktok: '🎵' };
const STATUS_FILTERS = ['all', 'draft', 'scheduled', 'published', 'failed', 'partial'];

export default function Posts() {
  const toast = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchPosts = () => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (status !== 'all') params.status = status;
    postsApi.list(params)
      .then((res) => {
        setPosts(res.data.posts);
        setTotal(res.data.total);
      })
      .catch(() => toast.error('Failed to load posts.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, [status, page]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this post?')) return;
    try {
      await postsApi.delete(id);
      toast.success('Post deleted.');
      fetchPosts();
    } catch {
      toast.error('Failed to delete post.');
    }
  };

  const handlePublish = async (id) => {
    try {
      await postsApi.publish(id);
      toast.success('Publishing started!');
      setTimeout(fetchPosts, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Publish failed.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Posts</h1>
          <p>{total} total posts</p>
        </div>
        <Link to="/compose" className="btn btn-primary">✏️ New Post</Link>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            className={`filter-btn ${status === s ? 'active' : ''}`}
            onClick={() => { setStatus(s); setPage(1); }}
          >
            {s === 'all' ? 'All Posts' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Content</th>
              <th>Platforms</th>
              <th>Status</th>
              <th>Scheduled</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>
                  <div className="spinner" style={{ margin: 'auto' }} />
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state" style={{ padding: '48px 24px' }}>
                    <div className="empty-state-icon">📭</div>
                    <h3>No posts found</h3>
                    <p>Create your first post to get started.</p>
                    <Link to="/compose" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                      ✏️ Create Post
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post._id}>
                  <td style={{ maxWidth: 300 }}>
                    <div className="truncate" style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                      {post.content}
                    </div>
                    {post.media?.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 3 }}>
                        📎 {post.media.length} media file{post.media.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {post.platforms.map((p) => (
                        <span key={p} className={`platform-badge ${p}`}>
                          {PLATFORM_ICONS[p]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${post.status}`}>{post.status}</span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                    {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : '—'}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['draft', 'failed'].includes(post.status) && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handlePublish(post._id)}
                        >
                          🚀 Publish
                        </button>
                      )}
                      {['draft', 'scheduled'].includes(post.status) && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/compose/${post._id}`)}
                        >
                          ✏️
                        </button>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(post._id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 10 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            ← Prev
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Page {page} of {Math.ceil(total / 10)}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 10)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
