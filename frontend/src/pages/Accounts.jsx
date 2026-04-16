import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { accountsApi } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

const PLATFORMS = [
  {
    id: 'facebook',
    label: 'Facebook',
    icon: '👥',
    color: 'var(--color-facebook)',
    bg: 'rgba(24, 119, 242, 0.1)',
    border: 'rgba(24, 119, 242, 0.3)',
    desc: 'Connect your Facebook Page to publish posts, photos, and videos.',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: '📸',
    color: 'var(--color-instagram)',
    bg: 'rgba(225, 48, 108, 0.1)',
    border: 'rgba(225, 48, 108, 0.3)',
    desc: 'Connect your Instagram Business or Creator account to publish posts and reels.',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    icon: '🎵',
    color: 'var(--color-tiktok)',
    bg: 'rgba(255, 0, 80, 0.1)',
    border: 'rgba(255, 0, 80, 0.3)',
    desc: 'Connect your TikTok account to publish and schedule video content.',
  },
];

export default function Accounts() {
  const toast = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);

  const refreshAccounts = () => {
    setLoading(true);
    accountsApi.list()
      .then((res) => setAccounts(res.data.accounts))
      .catch(() => toast.error('Failed to load accounts.'))
      .finally(() => setLoading(false));
  };

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    refreshAccounts();

    const searchParams = new URLSearchParams(location.search);
    const errorMsg = searchParams.get('error');
    const connectedMsg = searchParams.get('connected');

    if (errorMsg) {
      toast.error(`Connection Error: ${errorMsg}`);
      navigate('/accounts', { replace: true });
    } else if (connectedMsg) {
      toast.success(`${connectedMsg.charAt(0).toUpperCase() + connectedMsg.slice(1)} account connected!`);
      navigate('/accounts', { replace: true });
    }
  }, [location.search, navigate, toast]);

  const handleConnect = async (platform) => {
    setConnecting(platform);
    try {
      const res = await accountsApi.connect(platform);
      if (res.data.authUrl) {
        window.location.href = res.data.authUrl;
      } else {
        toast.success(res.data.message || `${platform} connected!`);
        refreshAccounts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to connect ${platform}.`);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (id, name) => {
    if (!confirm(`Disconnect "${name}"?`)) return;
    try {
      await accountsApi.disconnect(id);
      toast.success('Account disconnected.');
      refreshAccounts();
    } catch {
      toast.error('Failed to disconnect account.');
    }
  };

  const getConnectedAccount = (platformId) =>
    accounts.find((a) => a.platform === platformId);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Social Accounts</h1>
          <p>Connect and manage your social media accounts</p>
        </div>
      </div>


      {/* Platform Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {PLATFORMS.map((platform) => {
          const connected = getConnectedAccount(platform.id);
          return (
            <div
              key={platform.id}
              className="card"
              style={{
                borderColor: connected ? platform.border : 'var(--color-border)',
                background: connected ? platform.bg : 'var(--color-surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: platform.bg,
                  border: `1px solid ${platform.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>
                  {platform.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: platform.color }}>
                    {platform.label}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    {connected ? '● Connected' : '○ Not connected'}
                  </div>
                </div>
              </div>

              {connected ? (
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px', background: 'rgba(0,0,0,0.2)',
                    borderRadius: 10, marginBottom: 14,
                  }}>
                    {connected.accountAvatar && (
                      <img
                        src={connected.accountAvatar}
                        alt={connected.accountName}
                        style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem' }} className="truncate">
                        {connected.accountName}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {connected.accountHandle || connected.platform}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => handleConnect(platform.id)}
                      disabled={connecting === platform.id}
                    >
                      🔄 Reconnect
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => handleDisconnect(connected._id, connected.accountName)}
                    >
                      🔌 Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                    {platform.desc}
                  </p>
                  <button
                    id={`connect-${platform.id}-btn`}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', background: platform.color }}
                    onClick={() => handleConnect(platform.id)}
                    disabled={connecting === platform.id}
                  >
                    {connecting === platform.id ? (
                      <><span className="spinner" /> Connecting...</>
                    ) : (
                      `Connect ${platform.label}`
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Connected Accounts Summary */}
      {accounts.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>✅ All Connected Accounts ({accounts.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {accounts.map((acc) => {
              const p = PLATFORMS.find((pl) => pl.id === acc.platform);
              return (
                <div key={acc._id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                }}>
                  <span style={{ fontSize: '1.2rem' }}>{p?.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }} className="truncate">{acc.accountName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{acc.accountHandle}</div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Connected {new Date(acc.connectedAt).toLocaleDateString()}
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDisconnect(acc._id, acc.accountName)}
                    style={{ color: 'var(--color-error)' }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
