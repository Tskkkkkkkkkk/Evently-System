import { useState, useEffect } from 'react';
import api from './api';
import Navbar from './Navbar';
import './AdminDashboard.css';


const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ── Status Badge ─────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cls = status || 'pending';
  return <span className={`badge badge-${cls}`}>{cls}</span>;
};

/* ── Modal ────────────────────────────────────────────────────────────── */
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


/* ── Per-Venue Activity Modal ─────────────────────────────────────────── */
const VenueActivityModal = ({ venue, onClose }) => {
  const events = venue.events_this_month || [];
  return (
    <Modal title={`${venue.name} — This Month`} onClose={onClose}>
      <div className="venue-activity-meta">
        <span>{venue.city}</span>
        <span>·</span>
        <span>{events.length} event{events.length !== 1 ? 's' : ''} this month</span>
      </div>

      {events.length === 0 ? (
        <div className="venue-activity-empty">No events booked at this venue this month.</div>
      ) : (
        <div className="venue-activity-list">
          {events.map((ev, i) => (
            <div key={i} className="venue-activity-item">
              <div className="va-row">
                <span className="va-event-name">{ev.event_name || '—'}</span>
                <span className={`va-status va-status-${ev.status || 'confirmed'}`}>
                  {ev.status || 'confirmed'}
                </span>
              </div>
              <div className="va-row va-meta">
                <span> {ev.event_date || '—'} {ev.event_time ? `at ${ev.event_time}` : ''}</span>
                <span> {ev.host_name || '—'}</span>
              </div>
              {ev.event_type && (
                <div className="va-tag">{ev.event_type}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-outline btn-lg" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
};


/* ── Monthly Events — platform totals + per-venue breakdown ───────────── */
const MonthlyEvents = ({ venues, stats }) => {
  const now       = new Date();
  const monthName = MONTH_NAMES[now.getMonth()];
  const year      = now.getFullYear();

  const [expandedVenues, setExpandedVenues] = useState(false);
  const [selectedVenueActivity, setSelectedVenueActivity] = useState(null);

  const newVenuesThisMonth  = stats?.new_venues_this_month      ?? 0;
  const approvedThisMonth   = stats?.approved_venues_this_month ?? 0;
  const newOwnersThisMonth  = stats?.new_owners_this_month      ?? 0;
  const bookingsThisMonth   = stats?.bookings_this_month        ?? 0;
  const pendingReviews      = venues.filter(v => !v.status || v.status === 'pending').length;

  // Venues that have at least one event this month
  const venueActivity = stats?.venue_activity_this_month ?? [];
  const activeVenues  = venueActivity.filter(v => (v.events_this_month?.length ?? 0) > 0);

  const isDataAvailable =
    stats?.new_venues_this_month      !== undefined ||
    stats?.approved_venues_this_month !== undefined ||
    stats?.new_owners_this_month      !== undefined ||
    stats?.bookings_this_month        !== undefined;

  const summaryEvents = [
    ...(newVenuesThisMonth > 0 ? [{
      label: `${newVenuesThisMonth} new venue listing${newVenuesThisMonth !== 1 ? 's' : ''} submitted`,
      sub:   'Awaiting review or recently approved',
     
    }] : []),
    ...(approvedThisMonth > 0 ? [{
      label: `${approvedThisMonth} venue${approvedThisMonth !== 1 ? 's' : ''} approved this month`,
      sub:   'Now live on the platform',
   
    }] : []),
    ...(newOwnersThisMonth > 0 ? [{
      label: `${newOwnersThisMonth} new owner${newOwnersThisMonth !== 1 ? 's' : ''} registered`,
      sub:   'New accounts this month',
      
    }] : []),
    ...(bookingsThisMonth > 0 ? [{
      label: `${bookingsThisMonth} booking${bookingsThisMonth !== 1 ? 's' : ''} confirmed`,
      sub:   'Reservations placed this month',

    }] : []),
    ...(pendingReviews > 0 ? [{
      label: `${pendingReviews} venue${pendingReviews !== 1 ? 's' : ''} pending approval`,
      sub:   'Action required',
      
    }] : []),
  ];

  return (
    <>
      <div className="events-section">
        <div className="events-header">
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            {monthName} {year} — Activity
          </h2>
          <span className="events-badge">This month</span>
        </div>

        {!isDataAvailable ? (
          <div className="events-placeholder">
            No activity data yet. Make sure the backend returns{' '}
            <code>new_venues_this_month</code>, <code>approved_venues_this_month</code>,{' '}
            <code>new_owners_this_month</code>, <code>bookings_this_month</code>, and{' '}
            <code>venue_activity_this_month</code> from <code>/admin-api/stats/</code>.
          </div>
        ) : summaryEvents.length === 0 && activeVenues.length === 0 ? (
          <div className="events-empty">No activity recorded for {monthName} {year} yet.</div>
        ) : (
          <>
            {/* Platform-wide summary pills */}
            {summaryEvents.length > 0 && (
              <div className="events-list" style={{ marginBottom: activeVenues.length > 0 ? 20 : 0 }}>
                {summaryEvents.map((ev, i) => (
                  <div key={i} className={`event-item event-${ev.color}`}>
                    <span className="event-icon">{ev.icon}</span>
                    <div>
                      <div className="event-label">{ev.label}</div>
                      <div className="event-sub">{ev.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Per-venue breakdown */}
            {activeVenues.length > 0 && (
              <div className="venue-activity-section">
                <button
                  className="venue-activity-toggle"
                  onClick={() => setExpandedVenues(p => !p)}
                >
                  <span> Activity by venue ({activeVenues.length} active)</span>
                  <span className="toggle-arrow">{expandedVenues ? '▲' : '▼'}</span>
                </button>

                {expandedVenues && (
                  <div className="venue-activity-grid">
                    {activeVenues.map((v, i) => {
                      const count = v.events_this_month?.length ?? 0;
                      return (
                        <div key={i} className="venue-activity-card">
                          <div className="vac-top">
                            <span className="vac-name">{v.name}</span>
                            <span className="vac-count">{count} event{count !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="vac-meta">{v.city}{v.owner_name ? ` · ${v.owner_name}` : ''}</div>
                          <button
                            className="btn btn-outline vac-btn"
                            onClick={() => setSelectedVenueActivity(v)}
                          >
                            View events
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {selectedVenueActivity && (
        <VenueActivityModal
          venue={selectedVenueActivity}
          onClose={() => setSelectedVenueActivity(null)}
        />
      )}
    </>
  );
};


/* ── Stats Charts — pure CSS bar + conic-gradient donut (no Chart.js) ── */
const StatsCharts = ({ venues, stats }) => {
  const approved = venues.filter(v => v.status === 'approved').length;
  const pending  = venues.filter(v => !v.status || v.status === 'pending').length;
  const rejected = venues.filter(v => v.status === 'rejected').length;
  const total    = approved + pending + rejected;

  const now = new Date();
  const labels = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return MONTH_NAMES[d.getMonth()];
  });

  const monthly = stats?.monthly_bookings ?? Array(6).fill(0);
  const maxVal  = Math.max(...monthly, 1);

  const donutSegments = [
    { label: 'Approved', value: approved, color: '#16a34a' },
    { label: 'Pending',  value: pending,  color: '#d97706' },
    { label: 'Rejected', value: rejected, color: '#dc2626' },
  ];
  let cum = 0;
  const conicParts = donutSegments.map(({ value, color }) => {
    const pct  = total > 0 ? (value / total) * 100 : 0;
    const part = `${color} ${cum}% ${cum + pct}%`;
    cum += pct;
    return part;
  });
  const conicGradient = total > 0
    ? `conic-gradient(${conicParts.join(', ')})`
    : 'conic-gradient(#e5e7eb 0% 100%)';

  return (
    <div className="charts-grid">
      {/* Bar chart */}
      <div className="chart-card">
        <div className="chart-card-header">
          <span className="chart-card-title">Booking trend</span>
          <span className="chart-card-sub">Last 6 months</span>
        </div>
        <div className="bar-chart">
          {monthly.map((val, i) => (
            <div key={i} className="bar-col">
              <span className="bar-value">{val > 0 ? val : ''}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ height: `${(val / maxVal) * 100}%` }} />
              </div>
              <span className="bar-label">{labels[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Donut chart */}
      <div className="chart-card">
        <div className="chart-card-header">
          <span className="chart-card-title">Venue status</span>
          <span className="chart-card-sub">{total} total</span>
        </div>
        <div className="donut-wrap">
          <div className="donut-ring-wrap">
            <div className="donut-ring" style={{ background: conicGradient }} />
            <div className="donut-hole">
              <span className="donut-center-value">{total}</span>
              <span className="donut-center-label">venues</span>
            </div>
          </div>
          <div className="donut-legend">
            {donutSegments.map(item => (
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


/* ── Admin Dashboard ──────────────────────────────────────────────────── */
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
    { label: 'Venue Owners',      value: stats?.total_owners   ?? owners.length,       sub: 'Registered',      subColor: '#16a34a' },
    { label: 'Total Venues',      value: stats?.total_venues   ?? venues.length,        sub: 'Active listings', subColor: '#16a34a' },
    { label: 'Pending Approvals', value: stats?.pending_venues ?? pendingVenues.length, sub: 'Awaiting review', subColor: '#d97706' },
    { label: 'Total Bookings',    value: stats?.total_bookings ?? 0,                    sub: 'All time',        subColor: '#16a34a' },
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
            {/* Stat cards */}
            <div className="stats-grid">
              {STATS.map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-sub" style={{ color: s.subColor }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
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

            {/* ── Overview */}
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

            {/* ── Owners */}
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

            {/* ── Venues */}
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

            {/* ── Pending */}
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

      {/* Venue detail modal */}
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

      {/* Confirm modal */}
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