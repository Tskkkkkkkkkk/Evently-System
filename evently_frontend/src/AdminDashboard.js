import { useState, useEffect, useRef } from 'react';
import api from './api';
import Navbar from './Navbar';
import './AdminDashboard.css';


const StatusBadge = ({ status }) => {
  const cls = status || 'pending';
  return <span className={`badge badge-${cls}`}>{cls}</span>;
};

const Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-box" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3 className="modal-title">{title}</h3>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      {children}
    </div>
  </div>
);


 

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const MonthlyEvents = ({ venues, stats }) => {
  const now = new Date();
  const monthName = MONTH_NAMES[now.getMonth()];
  const year = now.getFullYear();

 
  const newVenuesThisMonth  = stats?.new_venues_this_month  ?? 0;
  const newOwnersThisMonth  = stats?.new_owners_this_month  ?? 0;
  const bookingsThisMonth   = stats?.bookings_this_month    ?? 0;
  const pendingReviews      = venues.filter(v => !v.status || v.status === 'pending').length;

  const events = [
    ...(newVenuesThisMonth > 0 ? [{
      type: 'venue',
      label: `${newVenuesThisMonth} new venue listing${newVenuesThisMonth !== 1 ? 's' : ''} submitted`,
      sub: 'Awaiting review or recently approved',
      color: 'blue',
    }] : []),
    ...(newOwnersThisMonth > 0 ? [{
      type: 'owner',
      label: `${newOwnersThisMonth} new owner${newOwnersThisMonth !== 1 ? 's' : ''} registered`,
      sub: 'New accounts this month',
      color: 'green',
    }] : []),
    ...(bookingsThisMonth > 0 ? [{
      type: 'booking',
      label: `${bookingsThisMonth} booking${bookingsThisMonth !== 1 ? 's' : ''} made`,
      sub: 'Reservations placed this month',
      color: 'purple',
    }] : []),
    ...(pendingReviews > 0 ? [{
      type: 'pending',
      label: `${pendingReviews} venue${pendingReviews !== 1 ? 's' : ''} pending approval`,
      sub: 'Action required',
      color: 'amber',
    }] : []),
  ];


  const showPlaceholder = events.length === 0;

  return (
    <div className="events-section">
      <div className="events-header">
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          {monthName} {year} — Activity
        </h2>
        <span className="events-badge">This month</span>
      </div>

      {showPlaceholder ? (
        <div className="events-placeholder">
          No activity data available for this month yet. Extend the <code>/admin-api/stats/</code> endpoint with <code>new_venues_this_month</code>, <code>new_owners_this_month</code>, and <code>bookings_this_month</code> to populate this section.
        </div>
      ) : (
        <div className="events-list">
          {events.map((ev, i) => (
            <div key={i} className={`event-item event-${ev.color}`}>
              <div className={`event-dot dot-${ev.color}`} />
              <div>
                <div className="event-label">{ev.label}</div>
                <div className="event-sub">{ev.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};



const StatsCharts = ({ venues, stats }) => {
  const barRef  = useRef(null);
  const donutRef = useRef(null);
  const barChart  = useRef(null);
  const donutChart = useRef(null);

  const approved = venues.filter(v => v.status === 'approved').length;
  const pending  = venues.filter(v => !v.status || v.status === 'pending').length;
  const rejected = venues.filter(v => v.status === 'rejected').length;

 
  const monthly = stats?.monthly_bookings ?? Array(6).fill(0);
  const now = new Date();
  const labels = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return MONTH_NAMES[d.getMonth()];
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    script.onload = () => buildCharts();
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, []);

  useEffect(() => {
    if (window.Chart) buildCharts();
  }, [venues, stats]);

  const buildCharts = () => {
    if (!window.Chart) return;

    if (barChart.current)  { barChart.current.destroy();  barChart.current = null; }
    if (donutChart.current){ donutChart.current.destroy(); donutChart.current = null; }

    if (barRef.current) {
      barChart.current = new window.Chart(barRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Bookings',
            data: monthly,
            backgroundColor: '#1a1a1a',
            borderRadius: 6,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 12, family: 'DM Sans' } } },
            y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 12, family: 'DM Sans' }, stepSize: 1 }, beginAtZero: true },
          },
        },
      });
    }

    if (donutRef.current && (approved + pending + rejected) > 0) {
      donutChart.current = new window.Chart(donutRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Approved', 'Pending', 'Rejected'],
          datasets: [{
            data: [approved, pending, rejected],
            backgroundColor: ['#16a34a', '#d97706', '#dc2626'],
            borderWidth: 0,
            hoverOffset: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: { legend: { display: false } },
        },
      });
    }
  };

  const total = approved + pending + rejected;

  return (
    <div className="charts-grid">
      {/* Booking trend */}
      <div className="chart-card">
        <div className="chart-card-header">
          <span className="chart-card-title">Booking trend</span>
          <span className="chart-card-sub">Last 6 months</span>
        </div>
        <div style={{ position: 'relative', height: 180 }}>
          <canvas ref={barRef} />
        </div>
      </div>

      {/* Venue status breakdown */}
      <div className="chart-card">
        <div className="chart-card-header">
          <span className="chart-card-title">Venue status</span>
          <span className="chart-card-sub">{total} total</span>
        </div>
        <div className="donut-wrap">
          <div style={{ position: 'relative', height: 160, width: 160, flexShrink: 0 }}>
            {total > 0
              ? <canvas ref={donutRef} />
              : <div className="donut-empty">No venues yet</div>
            }
          </div>
          <div className="donut-legend">
            {[
              { label: 'Approved', value: approved, color: '#16a34a' },
              { label: 'Pending',  value: pending,  color: '#d97706' },
              { label: 'Rejected', value: rejected, color: '#dc2626' },
            ].map(item => (
              <div key={item.label} className="legend-row">
                <span className="legend-dot" style={{ background: item.color }} />
                <span className="legend-label">{item.label}</span>
                <span className="legend-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


export default function AdminDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('overview');
  const [owners, setOwners] = useState([]);
  const [venues, setVenues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, ownersRes, venuesRes] = await Promise.all([
        api.get('/admin-api/stats/'),
        api.get('/admin-api/owners/'),
        api.get('/admin-api/venues/'),
      ]);
      setStats(statsRes.data);
      setOwners(ownersRes.data);
      setVenues(venuesRes.data);
    } catch (e) {
      setError('Failed to load data: ' + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleOwnerAction = async (id, action) => {
    try {
      if (action === 'remove') {
        await api.delete(`/admin-api/owners/${id}/`);
        setOwners(prev => prev.filter(o => o.id !== id));
      } else {
        await api.patch(`/admin-api/owners/${id}/`, { action });
        setOwners(prev => prev.map(o =>
          o.id === id ? { ...o, status: action === 'suspend' ? 'suspended' : 'active' } : o
        ));
      }
      setConfirmModal(null);
      showToast(action === 'remove' ? 'Owner removed.' : `Owner ${action}d successfully.`);
      loadAll();
    } catch (e) {
      setError(e.response?.data?.detail || 'Action failed.');
      setConfirmModal(null);
    }
  };

  const handleVenueAction = async (id, action) => {
    try {
      if (action === 'remove') {
        await api.delete(`/admin-api/venues/${id}/`);
        setVenues(prev => prev.filter(v => v.id !== id));
      } else {
        await api.patch(`/admin-api/venues/${id}/`, { action });
        setVenues(prev => prev.map(v =>
          v.id === id ? { ...v, status: action === 'approve' ? 'approved' : 'rejected' } : v
        ));
      }
      setConfirmModal(null);
      showToast(action === 'approve' ? 'Venue approved!' : action === 'reject' ? 'Venue rejected.' : 'Venue removed.');
      loadAll();
    } catch (e) {
      setError(e.response?.data?.detail || 'Action failed.');
      setConfirmModal(null);
    }
  };

  const filteredOwners = owners.filter(o =>
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredVenues = venues.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.owner_name?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingVenues = venues.filter(v => !v.status || v.status === 'pending');

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'owners',   label: `Owners (${owners.length})` },
    { key: 'venues',   label: `Venues (${venues.length})` },
    { key: 'pending',  label: `Pending (${pendingVenues.length})` },
  ];

  const STATS = [
    { label: 'Venue Owners',      value: stats?.total_owners   ?? owners.length,        sub: 'Registered',      subColor: '#16a34a' },
    { label: 'Total Venues',      value: stats?.total_venues   ?? venues.length,         sub: 'Active listings', subColor: '#16a34a' },
    { label: 'Pending Approvals', value: stats?.pending_venues ?? pendingVenues.length,  sub: 'Awaiting review', subColor: '#d97706' },
    { label: 'Total Bookings',    value: stats?.total_bookings ?? 0,                     sub: 'All time',        subColor: '#16a34a' },
  ];

  return (
    <div className="admin-root">
      <Navbar user={user} onLogout={onLogout} transparent={false} />

      <main className="admin-main">
        <h1 className="admin-title">Admin Dashboard</h1>
        <p className="admin-subtitle">Manage venue owners, approve listings, and oversee the platform</p>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <p className="loading-text">Loading…</p>
        ) : (
          <>
         
            <div className="stats-grid">
              {STATS.map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-sub" style={{ color: s.subColor }}>{s.sub}</div>
                </div>
              ))}
            </div>

        
            <div className="tabs">
              {TABS.map(t => (
                <button
                  key={t.key}
                  className={`tab-btn${tab === t.key ? ' active' : ''}`}
                  onClick={() => { setTab(t.key); setSearch(''); }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {(tab === 'owners' || tab === 'venues') && (
              <input
                className="search-input"
                placeholder={tab === 'owners' ? 'Search by name or email…' : 'Search by venue or owner…'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            )}

       
            {tab === 'overview' && (
              <div>
               
                <StatsCharts venues={venues} stats={stats} />

           
                <MonthlyEvents venues={venues} stats={stats} />

                <h2 className="section-title">Pending Venue Approvals</h2>
                {pendingVenues.length === 0 ? (
                  <div className="empty-ok">No pending venue approvals</div>
                ) : (
                  <div className="card-list" style={{ marginBottom: 32 }}>
                    {pendingVenues.map(v => (
                      <div key={v.id} className="card pending-card card-row">
                        <div>
                          <div className="card-name">{v.name}</div>
                          <div className="card-meta">{v.owner_name} · {v.city} · {v.capacity} guests</div>
                        </div>
                        <div className="btn-group">
                          <button className="btn btn-dark" onClick={() => setConfirmModal({ type: 'venue', id: v.id, action: 'approve' })}>Approve</button>
                          <button className="btn btn-danger" onClick={() => setConfirmModal({ type: 'venue', id: v.id, action: 'reject' })}>Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <h2 className="section-title">Recent Venue Owners</h2>
                <div className="owner-table">
                  {owners.length === 0
                    ? <div className="owner-row" style={{ color: '#aaa' }}>No venue owners yet.</div>
                    : owners.slice(0, 5).map(o => (
                      <div key={o.id} className="owner-row">
                        <div>
                          <span style={{ fontWeight: 500 }}>{o.name}</span>
                          <span className="card-meta" style={{ marginLeft: 10 }}>{o.email}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span className="card-meta">{o.venues} venues</span>
                          <StatusBadge status={o.status} />
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

          
            {tab === 'owners' && (
              <div className="card-list">
                {filteredOwners.length === 0
                  ? <p className="empty-state">No owners found.</p>
                  : filteredOwners.map(o => (
                    <div key={o.id} className="card card-row">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span className="card-name">{o.name}</span>
                          <StatusBadge status={o.status} />
                        </div>
                        <div className="card-meta">{o.email} · Joined {o.joined} · {o.venues} venue{o.venues !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="btn-group">
                        <button className="btn btn-outline" onClick={() => setSelectedOwner(o)}>View</button>
                        {o.status !== 'suspended'
                          ? <button className="btn btn-warn" onClick={() => setConfirmModal({ type: 'owner', id: o.id, action: 'suspend' })}>Suspend</button>
                          : <button className="btn btn-success" onClick={() => setConfirmModal({ type: 'owner', id: o.id, action: 'activate' })}>Activate</button>
                        }
                        <button className="btn btn-danger" onClick={() => setConfirmModal({ type: 'owner', id: o.id, action: 'remove' })}>Remove</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

          
            {tab === 'venues' && (
              <div className="card-list">
                {filteredVenues.length === 0
                  ? <p className="empty-state">No venues found.</p>
                  : filteredVenues.map(v => (
                    <div key={v.id} className="card card-row">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span className="card-name">{v.name}</span>
                          <StatusBadge status={v.status || 'pending'} />
                        </div>
                        <div className="card-meta">Owner: {v.owner_name} · {v.city} · {v.capacity} guests</div>
                      </div>
                      <div className="btn-group">
                        <button className="btn btn-outline" onClick={() => setSelectedVenue(v)}>Details</button>
                        {(!v.status || v.status === 'pending') && <>
                          <button className="btn btn-dark" onClick={() => setConfirmModal({ type: 'venue', id: v.id, action: 'approve' })}>Approve</button>
                          <button className="btn btn-danger" onClick={() => setConfirmModal({ type: 'venue', id: v.id, action: 'reject' })}>Reject</button>
                        </>}
                        <button className="btn btn-danger" onClick={() => setConfirmModal({ type: 'venue', id: v.id, action: 'remove' })}>Remove</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

           
            {tab === 'pending' && (
              <div>
                {pendingVenues.length === 0
                  ? <div className="empty-state">No pending approvals</div>
                  : pendingVenues.map(v => (
                    <div key={v.id} className="card pending-card" style={{ marginBottom: 10 }}>
                      <div className="card-row">
                        <div>
                          <div className="card-name" style={{ marginBottom: 6 }}>{v.name}</div>
                          <div className="card-meta" style={{ marginBottom: 10 }}>Owner: {v.owner_name} · {v.city} · {v.capacity} guests</div>
                          <StatusBadge status="pending" />
                        </div>
                        <div className="btn-group">
                          <button className="btn btn-dark btn-lg" onClick={() => setConfirmModal({ type: 'venue', id: v.id, action: 'approve' })}>Approve</button>
                          <button className="btn btn-danger btn-lg" onClick={() => setConfirmModal({ type: 'venue', id: v.id, action: 'reject' })}>Reject</button>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </>
        )}
      </main>

      {/* Owner detail modal */}
      {selectedOwner && (
        <Modal title="Owner Details" onClose={() => setSelectedOwner(null)}>
          <div className="modal-grid">
            {[['Name', selectedOwner.name], ['Email', selectedOwner.email], ['Joined', selectedOwner.joined], ['Total Venues', selectedOwner.venues], ['Phone', selectedOwner.phone || '—']].map(([label, val]) => (
              <div key={label}>
                <div className="modal-field-label">{label}</div>
                <div className="modal-field-value">{val}</div>
              </div>
            ))}
            <div>
              <div className="modal-field-label">Status</div>
              <StatusBadge status={selectedOwner.status} />
            </div>
          </div>
          <div className="modal-actions">
            {selectedOwner.status !== 'suspended'
              ? <button className="btn btn-warn btn-lg" onClick={() => { setConfirmModal({ type: 'owner', id: selectedOwner.id, action: 'suspend' }); setSelectedOwner(null); }}>Suspend</button>
              : <button className="btn btn-success btn-lg" onClick={() => { setConfirmModal({ type: 'owner', id: selectedOwner.id, action: 'activate' }); setSelectedOwner(null); }}>Activate</button>
            }
            <button className="btn btn-danger btn-lg" onClick={() => { setConfirmModal({ type: 'owner', id: selectedOwner.id, action: 'remove' }); setSelectedOwner(null); }}>Remove Owner</button>
          </div>
        </Modal>
      )}

   
      {selectedVenue && (
        <Modal title="Venue Details" onClose={() => setSelectedVenue(null)}>
          <div className="modal-grid">
            {[
              ['Venue Name', selectedVenue.name],
              ['Owner', selectedVenue.owner_name],
              ['City', selectedVenue.city],
              ['Capacity', (selectedVenue.capacity || '—') + ' guests'],
              ['Price', selectedVenue.price ? `Rs ${selectedVenue.price?.toLocaleString()}` : '—'],
            ].map(([label, val]) => (
              <div key={label}>
                <div className="modal-field-label">{label}</div>
                <div className="modal-field-value">{val}</div>
              </div>
            ))}
            <div>
              <div className="modal-field-label">Status</div>
              <StatusBadge status={selectedVenue.status || 'pending'} />
            </div>
          </div>
          {(!selectedVenue.status || selectedVenue.status === 'pending') && (
            <div className="modal-actions">
              <button className="btn btn-dark btn-lg" onClick={() => { setConfirmModal({ type: 'venue', id: selectedVenue.id, action: 'approve' }); setSelectedVenue(null); }}>Approve</button>
              <button className="btn btn-danger btn-lg" onClick={() => { setConfirmModal({ type: 'venue', id: selectedVenue.id, action: 'reject' }); setSelectedVenue(null); }}>Reject</button>
            </div>
          )}
        </Modal>
      )}

      
      {confirmModal && (
        <Modal title="Confirm Action" onClose={() => setConfirmModal(null)}>
          <p className="modal-body">
            Are you sure you want to <strong>{confirmModal.action}</strong> this {confirmModal.type}?
            {confirmModal.action === 'remove' && ' This cannot be undone.'}
          </p>
          <div className="modal-actions-center">
            <button
              className={`btn btn-lg ${['approve', 'activate'].includes(confirmModal.action) ? 'btn-dark' : 'btn-danger'}`}
              style={['approve', 'activate'].includes(confirmModal.action) ? { background: '#1a1a1a', color: 'white', border: 'none' } : {}}
              onClick={() => confirmModal.type === 'owner'
                ? handleOwnerAction(confirmModal.id, confirmModal.action)
                : handleVenueAction(confirmModal.id, confirmModal.action)
              }
            >
              Yes, {confirmModal.action}
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => setConfirmModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}