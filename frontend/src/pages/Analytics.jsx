import { useState, useEffect, useRef } from 'react';
import { analyticsApi, accountsApi } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const RANGES = [
  { label: '7 days', value: '7' },
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
];

const PLATFORM_COLORS = {
  facebook: { bg: 'rgba(24,119,242,0.15)', border: '#1877f2' },
  instagram: { bg: 'rgba(225,48,108,0.15)', border: '#e1306c' },
  tiktok: { bg: 'rgba(255,0,80,0.15)', border: '#ff0050' },
};

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#8b92a8', font: { family: 'Inter', size: 12 }, padding: 20 },
    },
    tooltip: {
      backgroundColor: '#161927',
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      titleColor: '#e8eaf0',
      bodyColor: '#8b92a8',
      padding: 12,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#555e7a', font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#555e7a', font: { size: 11 } },
      beginAtZero: true,
    },
  },
};

function MetricCard({ label, value, icon, color }) {
  return (
    <div className="stat-card" style={{ '--accent-start': color, '--accent-end': color }}>
      <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>{icon}</div>
      <div className="stat-value" style={{ fontSize: '1.75rem' }}>{value.toLocaleString()}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Analytics() {
  const toast = useToast();
  const [range, setRange] = useState('30');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsApi.overview({ range })
      .then((res) => setData(res.data))
      .catch(() => toast.error('Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!data) return null;

  const timeline = data.timeline || [];
  const labels = timeline.map((d) => {
    const dt = new Date(d.date);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const reachData = {
    labels,
    datasets: [
      {
        label: 'Reach',
        data: timeline.map((d) => d.reach),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Impressions',
        data: timeline.map((d) => d.impressions),
        borderColor: '#818cf8',
        backgroundColor: 'rgba(129,140,248,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const engagementData = {
    labels,
    datasets: [
      {
        label: 'Likes',
        data: timeline.map((d) => d.likes),
        backgroundColor: 'rgba(239,68,68,0.7)',
        borderRadius: 4,
      },
      {
        label: 'Comments',
        data: timeline.map((d) => d.comments),
        backgroundColor: 'rgba(59,130,246,0.7)',
        borderRadius: 4,
      },
      {
        label: 'Shares',
        data: timeline.map((d) => d.shares),
        backgroundColor: 'rgba(34,197,94,0.7)',
        borderRadius: 4,
      },
    ],
  };

  const totalReach = timeline.reduce((s, d) => s + d.reach, 0);
  const totalImpressions = timeline.reduce((s, d) => s + d.impressions, 0);
  const totalEngagement = timeline.reduce((s, d) => s + d.engagement, 0);
  const totalFollowers = timeline.reduce((s, d) => s + d.followers, 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Analytics</h1>
          <p>Track your performance across all platforms</p>
        </div>
        <div className="filter-bar" style={{ margin: 0 }}>
          {RANGES.map((r) => (
            <button
              key={r.value}
              className={`filter-btn ${range === r.value ? 'active' : ''}`}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <MetricCard label="Total Reach" value={totalReach} icon="👁️" color="#6366f1" />
        <MetricCard label="Impressions" value={totalImpressions} icon="📊" color="#818cf8" />
        <MetricCard label="Engagements" value={totalEngagement} icon="❤️" color="#ef4444" />
        <MetricCard label="Follower Growth" value={totalFollowers} icon="📈" color="#22c55e" />
        <MetricCard label="Posts Published" value={data.overview.publishedPosts} icon="✅" color="#22c55e" />
        <MetricCard label="Posts Scheduled" value={data.overview.scheduledPosts} icon="📅" color="#f59e0b" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>📈 Reach & Impressions</div>
          <div style={{ height: 260 }}>
            <Line data={reachData} options={chartDefaults} />
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>❤️ Engagement Breakdown</div>
          <div style={{ height: 260 }}>
            <Bar
              data={engagementData}
              options={{
                ...chartDefaults,
                plugins: { ...chartDefaults.plugins, legend: { ...chartDefaults.plugins.legend } },
              }}
            />
          </div>
        </div>
      </div>

      {/* Platform-level summary */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 20 }}>🌐 Platform Breakdown</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {Object.entries(data.platformStats || {}).map(([platform, stats]) => (
            <div key={platform} style={{
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${PLATFORM_COLORS[platform]?.border}33`,
              background: PLATFORM_COLORS[platform]?.bg,
            }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: PLATFORM_COLORS[platform]?.border, marginBottom: 8 }}>
                {platform === 'facebook' ? '👥' : platform === 'instagram' ? '📸' : '🎵'} {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </div>
              {stats.connected ? (
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-success)', marginBottom: 4 }}>● Connected ({stats.accounts} account{stats.accounts > 1 ? 's' : ''})</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    Demo metrics active
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  ○ Not connected
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
