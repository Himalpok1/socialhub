import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postsApi, accountsApi } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: '👥', limit: 63206 },
  { id: 'instagram', label: 'Instagram', icon: '📸', limit: 2200 },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', limit: 2200 },
];

export default function Composer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [firstComment, setFirstComment] = useState('');
  const [mediaUrls, setMediaUrls] = useState('');

  // Load post if editing
  useEffect(() => {
    accountsApi.list().then((res) => setAccounts(res.data.accounts)).catch(() => {});

    if (id) {
      setLoading(true);
      postsApi.get(id)
        .then((res) => {
          const p = res.data.post;
          setContent(p.content);
          setSelectedPlatforms(p.platforms);
          setSelectedAccounts(p.targetAccounts?.map((a) => a._id) || []);
          setScheduledAt(p.scheduledAt ? new Date(p.scheduledAt).toISOString().slice(0, 16) : '');
          setHashtags(p.hashtags?.join(' ') || '');
          setFirstComment(p.firstComment || '');
        })
        .catch(() => toast.error('Failed to load post.'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const togglePlatform = (pid) => {
    setSelectedPlatforms((prev) =>
      prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]
    );
  };

  const toggleAccount = (accId) => {
    setSelectedAccounts((prev) =>
      prev.includes(accId) ? prev.filter((a) => a !== accId) : [...prev, accId]
    );
  };

  const getCharLimit = () => {
    if (selectedPlatforms.length === 0) return 63206;
    return Math.min(...selectedPlatforms.map((p) => PLATFORMS.find((pl) => pl.id === p)?.limit || 9999));
  };

  const charLimit = getCharLimit();
  const charRemaining = charLimit - content.length;
  const charClass = charRemaining < 50 ? 'danger' : charRemaining < 200 ? 'warning' : '';

  const buildPayload = (status) => ({
    content,
    platforms: selectedPlatforms,
    targetAccounts: selectedAccounts.length > 0 ? selectedAccounts : undefined,
    scheduledAt: scheduledAt || undefined,
    hashtags: hashtags.split(/\s+/).filter(Boolean),
    firstComment: firstComment || undefined,
    media: mediaUrls
      ? mediaUrls.split('\n').filter(Boolean).map((url) => ({ url: url.trim(), type: 'image' }))
      : [],
    status,
  });

  const handleSave = async (mode) => {
    if (!content.trim()) { toast.error('Content is required.'); return; }
    if (selectedPlatforms.length === 0) { toast.error('Select at least one platform.'); return; }
    if (mode === 'schedule' && !scheduledAt) { toast.error('Set a scheduled date/time.'); return; }

    setSaving(true);
    try {
      if (id) {
        await postsApi.update(id, buildPayload(mode === 'schedule' ? 'scheduled' : 'draft'));
        toast.success('Post updated!');
      } else {
        await postsApi.create(buildPayload(mode === 'schedule' ? 'scheduled' : 'draft'));
        toast.success(mode === 'schedule' ? 'Post scheduled!' : 'Draft saved!');
      }
      navigate('/posts');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save post.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishNow = async () => {
    if (!content.trim()) { toast.error('Content is required.'); return; }
    if (selectedPlatforms.length === 0) { toast.error('Select at least one platform.'); return; }

    setSaving(true);
    try {
      let postId = id;
      if (!postId) {
        const res = await postsApi.create(buildPayload('draft'));
        postId = res.data.post._id;
      }
      await postsApi.publish(postId);
      toast.success('🚀 Publishing to all selected platforms!');
      navigate('/posts');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="empty-state"><div className="spinner" style={{ width: 36, height: 36 }} /></div>;
  }

  const filteredAccounts = accounts.filter((a) => selectedPlatforms.includes(a.platform));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>{id ? 'Edit Post' : 'Create New Post'}</h1>
          <p>Craft your content and choose where to publish</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Main Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Platform Selection */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>📱 Select Platforms</div>
            <div className="platform-selector">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  className={`platform-toggle ${selectedPlatforms.includes(p.id) ? `selected ${p.id}` : ''}`}
                  onClick={() => togglePlatform(p.id)}
                  type="button"
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>

            {filteredAccounts.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="form-label" style={{ marginBottom: 8 }}>Target Accounts</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredAccounts.map((acc) => (
                    <label key={acc._id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8,
                      background: selectedAccounts.includes(acc._id) ? 'rgba(99,102,241,0.1)' : 'var(--color-surface-2)',
                      border: selectedAccounts.includes(acc._id) ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--color-border)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedAccounts.includes(acc._id)}
                        onChange={() => toggleAccount(acc._id)}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <span className={`platform-badge ${acc.platform}`}>
                        {acc.platform === 'facebook' ? '👥' : acc.platform === 'instagram' ? '📸' : '🎵'}
                      </span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{acc.accountName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{acc.accountHandle}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {selectedPlatforms.length > 0 && filteredAccounts.length === 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.8125rem', color: 'var(--color-warning)' }}>
                ⚠️ No accounts connected for selected platforms.{' '}
                <a href="/accounts" style={{ color: 'var(--color-warning)', fontWeight: 600 }}>Connect one →</a>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>✍️ Post Content</div>
            <div className="form-group">
              <textarea
                id="composer-content"
                className="form-textarea"
                placeholder="What's on your mind? Write your post content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ minHeight: 200 }}
                maxLength={charLimit}
              />
              <div className={`char-count ${charClass}`}>
                {charRemaining} characters remaining
                {selectedPlatforms.length > 1 && ' (limited by tightest platform)'}
              </div>
            </div>

            {/* Hashtags */}
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label" htmlFor="composer-hashtags"># Hashtags (space-separated)</label>
              <input
                id="composer-hashtags"
                type="text"
                className="form-input"
                placeholder="#socialmedia #marketing #content"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
              />
            </div>

            {/* First Comment (Instagram) */}
            {selectedPlatforms.includes('instagram') && (
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label" htmlFor="composer-first-comment">📸 Instagram First Comment</label>
                <input
                  id="composer-first-comment"
                  type="text"
                  className="form-input"
                  placeholder="Add hashtags in first comment..."
                  value={firstComment}
                  onChange={(e) => setFirstComment(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Media */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>🖼️ Media (Optional)</div>
            <div className="dropzone">
              <div className="dropzone-icon">📎</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Paste media URLs below</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
                One URL per line (images or publicly accessible video URLs)
              </div>
              <textarea
                id="composer-media-urls"
                className="form-textarea"
                placeholder="https://example.com/image.jpg&#10;https://example.com/video.mp4"
                value={mediaUrls}
                onChange={(e) => setMediaUrls(e.target.value)}
                style={{ minHeight: 100, textAlign: 'left', background: 'var(--color-surface-3)' }}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Schedule */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>⏰ Schedule</div>
            <div className="form-group">
              <label className="form-label" htmlFor="composer-schedule">Publish Date & Time</label>
              <input
                id="composer-schedule"
                type="datetime-local"
                className="form-input"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                style={{ colorScheme: 'dark' }}
              />
            </div>
            {scheduledAt && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, fontSize: '0.8125rem', color: 'var(--color-scheduled)' }}>
                📅 Scheduled: {new Date(scheduledAt).toLocaleString()}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>👁️ Preview</div>
            <div style={{
              padding: '12px',
              background: 'var(--color-surface-2)',
              borderRadius: 8,
              minHeight: 80,
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: content ? 'var(--color-text)' : 'var(--color-text-muted)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {content || 'Your post preview will appear here...'}
              {hashtags && (
                <div style={{ marginTop: 8, color: 'var(--color-primary-light)', fontWeight: 500 }}>
                  {hashtags.split(/\s+/).filter(Boolean).map((h) => `${h.startsWith('#') ? '' : '#'}${h}`).join(' ')}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              id="composer-publish-btn"
              className="btn btn-primary"
              onClick={handlePublishNow}
              disabled={saving}
              style={{ justifyContent: 'center' }}
            >
              {saving ? <span className="spinner" /> : '🚀 Publish Now'}
            </button>
            <button
              id="composer-schedule-btn"
              className="btn btn-secondary"
              onClick={() => handleSave('schedule')}
              disabled={saving || !scheduledAt}
              style={{ justifyContent: 'center' }}
            >
              📅 Schedule Post
            </button>
            <button
              id="composer-draft-btn"
              className="btn btn-ghost"
              onClick={() => handleSave('draft')}
              disabled={saving}
              style={{ justifyContent: 'center' }}
            >
              💾 Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
