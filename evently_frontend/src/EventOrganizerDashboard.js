import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import api from './api';
import './EventOrganizerDashboard.css';

export default function EventOrganizerDashboard({ user, onLogout }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

        {loading && <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#888' }}>Loading your events…</p>}

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
                    cursor: 'pointer', transition: 'box-shadow 0.2s',
                  }}
                  onClick={() => setSelectedEvent(ev)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedEvent(ev)}
                  role="button"
                  tabIndex={0}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{ev.event_name || 'Unnamed Event'}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#666', marginBottom: 4 }}>{ev.venue_name} · {ev.event_date || '—'} {ev.event_time ? `at ${ev.event_time}` : ''}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#888' }}>Host: {ev.host_name || '—'}{ev.expected_guests ? ` · ${ev.expected_guests} guests` : ''}</div>
                      {ev.event_type && <span className="tag" style={{ marginTop: 8, display: 'inline-block' }}>{ev.event_type}</span>}
                    </div>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>View details </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && events.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#666', marginBottom: 20 }}>You haven't created any events yet.</p>

            <a href="/venues" className="btn-ghost" style={{ display: 'inline-block', textDecoration: 'none' }}>Browse Venues</a>
          </div>
        )}

     
        {selectedEvent && (
          <div className="confirm-overlay" onClick={() => setSelectedEvent(null)}>
            <div className="confirm-box" style={{ textAlign: 'left', padding: 28 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>Event Host Details</h3>
                <button type="button" className="btn-ghost" style={{ padding: '6px 12px' }} onClick={() => setSelectedEvent(null)}>Close</button>
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
                      <a href={`/venues/${selectedEvent.venue_slug}`} style={{ marginLeft: 8, fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>View venue →</a>
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
