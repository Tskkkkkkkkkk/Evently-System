import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import api from './api';
import './EventOrganizerDashboard.css';

function EventRSVPStats({ eventId }) {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    if (!open || !eventId) return;
    setLoading(true);
    api.get(`/organizer/events/${eventId}/rsvp/`)
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [open, eventId]);

  const statusColor = { accepted: '#16a34a', declined: '#dc2626', pending: '#d97706' };
  const statusBg    = { accepted: '#f0fdf4', declined: '#fef2f2', pending: '#fffbeb' };
  const statusLabel = { accepted: 'Attending', declined: 'Not attending', pending: 'Pending' };

  return (
    <div style={{ marginTop: 14 }} onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: '1.5px solid #e5e7eb',
          borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#444',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
<<<<<<< HEAD
         {open ? 'Hide' : 'View'} RSVP responses
=======
        📋 {open ? 'Hide' : 'View'} RSVP responses
>>>>>>> 8f2dc803695dddd40ed5e58e1687c609c714502a
      </button>

      {open && (
        <div style={{
          marginTop: 10, border: '1.5px solid #e5e7eb',
          borderRadius: 12, overflow: 'hidden', background: 'white',
        }}>
          {loading && (
            <p style={{ padding: '16px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#888', margin: 0 }}>
              Loading…
            </p>
          )}

          {!loading && stats && (
            <>
              {/* Summary tiles */}
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6' }}>
                {[
                  { label: 'Attending',     value: stats.accepted, color: '#16a34a', bg: '#f0fdf4' },
                  { label: 'Not attending', value: stats.declined, color: '#dc2626', bg: '#fef2f2' },
                  { label: 'Pending',       value: stats.pending,  color: '#d97706', bg: '#fffbeb' },
                  { label: 'Total invited', value: stats.total,    color: '#374151', bg: '#f9fafb' },
                ].map(item => (
                  <div key={item.label} style={{
                    flex: 1, padding: '12px 14px',
                    background: item.bg, borderRight: '1px solid #f3f4f6',
                  }}>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 20, fontWeight: 700, color: item.color,
                    }}>
                      {item.value}
                    </div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11, color: '#888', marginTop: 2,
                    }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              {stats.total > 0 && (
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{
                    height: 7, borderRadius: 4, background: '#f3f4f6',
                    overflow: 'hidden', display: 'flex',
                  }}>
                    <div style={{ width: `${(stats.accepted / stats.total) * 100}%`, background: '#16a34a', transition: 'width 0.4s' }} />
                    <div style={{ width: `${(stats.declined / stats.total) * 100}%`, background: '#dc2626', transition: 'width 0.4s' }} />
                    <div style={{ width: `${(stats.pending  / stats.total) * 100}%`, background: '#fbbf24', transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 5, fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#888' }}>
                    <span style={{ color: '#16a34a' }}>Attending</span>
                    <span style={{ color: '#dc2626' }}>Not attending</span>
                    <span style={{ color: '#fbbf24' }}>Pending</span>
                  </div>
                </div>
              )}

              {/* Guest list */}
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {stats.guests.length === 0 ? (
                  <p style={{ padding: '14px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#888', margin: 0 }}>
                    No guests invited yet.
                  </p>
                ) : stats.guests.map((g, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 16px',
                    borderBottom: i < stats.guests.length - 1 ? '1px solid #f9fafb' : 'none',
                  }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#374151' }}>
                      {g.email}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {g.responded_at && (
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#aaa' }}>
                          {new Date(g.responded_at).toLocaleDateString()}
                        </span>
                      )}
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                        color: statusColor[g.status],
                        background: statusBg[g.status],
                        padding: '3px 10px', borderRadius: 20,
                      }}>
                        {statusLabel[g.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !stats && (
            <p style={{ padding: '14px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#888', margin: 0 }}>
              Could not load RSVP data.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function EventOrganizerDashboard({ user, onLogout }) {
  const [events, setEvents]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const loadEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/organizer/events/');
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setEvents([]);
      setError(e.response?.status === 403
        ? 'You must sign up as an Event Organizer to access this dashboard.'
        : 'Unable to load your events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: '#faf9f7', minHeight: '100vh', color: '#1a1a1a' }}>
      <Navbar user={user} onLogout={onLogout} transparent={false} />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 100px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
          Event Organizer Dashboard
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#888', marginBottom: 32 }}>
          Events you've created at venues
        </p>

        {error && (
          <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
            {error}
          </div>
        )}

        {loading && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#888' }}>Loading your events…</p>
        )}

        {!loading && events.length > 0 && (
          <section>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Events</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {events.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    background: 'white', borderRadius: 16, padding: 20,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  }}
                >
<<<<<<< HEAD
           
=======
                  {/* ── Event header row ── */}
>>>>>>> 8f2dc803695dddd40ed5e58e1687c609c714502a
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
                    onClick={() => setSelectedEvent(ev)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelectedEvent(ev)}
                  >
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
                        {ev.event_name || 'Unnamed Event'}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#666', marginBottom: 4 }}>
                        {ev.venue_name} · {ev.event_date || '—'}{ev.event_time ? ` at ${ev.event_time}` : ''}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#888' }}>
                        Host: {ev.host_name || '—'}{ev.expected_guests ? ` · ${ev.expected_guests} expected guests` : ''}
                      </div>
                      {ev.event_type && (
                        <span className="tag" style={{ marginTop: 8, display: 'inline-block' }}>
                          {ev.event_type}
                        </span>
                      )}
                    </div>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#1a1a1a', fontWeight: 500, flexShrink: 0, marginLeft: 16 }}>
                      View details →
                    </span>
                  </div>

<<<<<<< HEAD
                  {/*  RSVP section  */}
=======
                  {/* ── RSVP section (only if guests were invited) ── */}
>>>>>>> 8f2dc803695dddd40ed5e58e1687c609c714502a
                  {ev.guest_emails?.length > 0 && (
                    <EventRSVPStats eventId={ev.id} />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && events.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#666', marginBottom: 20 }}>
              You haven't created any events yet.
            </p>
            <a href="/venues" className="btn-ghost" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Browse Venues
            </a>
          </div>
        )}

<<<<<<< HEAD
        {/*Event detail modal  */}
=======
        {/* ── Event detail modal ── */}
>>>>>>> 8f2dc803695dddd40ed5e58e1687c609c714502a
        {selectedEvent && (
          <div className="confirm-overlay" onClick={() => setSelectedEvent(null)}>
            <div className="confirm-box" style={{ textAlign: 'left', padding: 28 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>
                  Event Host Details
                </h3>
                <button type="button" className="btn-ghost" style={{ padding: '6px 12px' }} onClick={() => setSelectedEvent(null)}>
                  Close
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                <div className="event-detail-row" style={{ gridColumn: '1 / -1' }}>
                  <div className="event-detail-label">Event Name</div>
                  <div className="event-detail-value">{selectedEvent.event_name || '—'}</div>
                </div>
                <div className="event-detail-row" style={{ gridColumn: '1 / -1' }}>
                  <div className="event-detail-label">Venue</div>
                  <div className="event-detail-value">
                    {selectedEvent.venue_name || '—'}
                    {selectedEvent.venue_slug && (
                      <a href={`/venues/${selectedEvent.venue_slug}`} style={{ marginLeft: 8, fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>
                        View venue →
                      </a>
                    )}
                  </div>
                </div>
                <div className="event-detail-row">
                  <div className="event-detail-label">Event Date</div>
                  <div className="event-detail-value">{selectedEvent.event_date || '—'}</div>
                </div>
                <div className="event-detail-row">
                  <div className="event-detail-label">Event Time</div>
                  <div className="event-detail-value">{selectedEvent.event_time || '—'}</div>
                </div>
                <div className="event-detail-row">
                  <div className="event-detail-label">Event Type</div>
                  <div className="event-detail-value">{selectedEvent.event_type || '—'}</div>
                </div>
                <div className="event-detail-row">
                  <div className="event-detail-label">Expected Guests</div>
                  <div className="event-detail-value">{selectedEvent.expected_guests ?? '—'}</div>
                </div>
                <div className="event-detail-row" style={{ gridColumn: '1 / -1' }}>
                  <div className="event-detail-label">Description</div>
                  <div className="event-detail-value">{selectedEvent.event_description || '—'}</div>
                </div>
                <div className="event-detail-row">
                  <div className="event-detail-label">Host Name</div>
                  <div className="event-detail-value">{selectedEvent.host_name || '—'}</div>
                </div>
                <div className="event-detail-row">
                  <div className="event-detail-label">Contact Number</div>
                  <div className="event-detail-value">{selectedEvent.host_contact || '—'}</div>
                </div>
                <div className="event-detail-row">
                  <div className="event-detail-label">Email</div>
                  <div className="event-detail-value">{selectedEvent.host_email || '—'}</div>
                </div>
                <div className="event-detail-row" style={{ gridColumn: '1 / -1' }}>
                  <div className="event-detail-label">Additional Requirements</div>
                  <div className="event-detail-value">{selectedEvent.additional_requirements || '—'}</div>
                </div>
                {selectedEvent.guest_emails?.length > 0 && (
                  <div className="event-detail-row" style={{ gridColumn: '1 / -1' }}>
                    <div className="event-detail-label">Invited Guests</div>
                    <div className="event-detail-value">{selectedEvent.guest_emails.join(', ')}</div>
                  </div>
                )}
              </div>

              {/* RSVP inside modal too */}
              {selectedEvent.guest_emails?.length > 0 && (
                <div style={{ marginTop: 24, borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 8 }}>
                    RSVP Tracker
                  </div>
                  <EventRSVPStats eventId={selectedEvent.id} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}