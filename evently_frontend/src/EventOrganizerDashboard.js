import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import api from './api';
import './EventOrganizerDashboard.css';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: figure out how many days away an event date is from today
// Returns a number (negative = already passed, 0 = today, positive = future)
// ─────────────────────────────────────────────────────────────────────────────
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today     = new Date();
  today.setHours(0, 0, 0, 0); // strip time so we compare dates only
  const eventDate = new Date(dateStr);
  eventDate.setHours(0, 0, 0, 0);
  const diffMs   = eventDate - today;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

// ─────────────────────────────────────────────────────────────────────────────
// NotificationBell — the bell icon in the top-right of the dashboard header.
// Shows a red badge when there are upcoming events within 7 days.
// Clicking it opens a dropdown listing those events.
// ─────────────────────────────────────────────────────────────────────────────
function NotificationBell({ events }) {
  const [open, setOpen] = useState(false);

  // Filter to only events happening within the next 7 days (and not already past)
  const upcoming = events.filter(ev => {
    const d = daysUntil(ev.event_date);
    return d !== null && d >= 0 && d <= 7;
  });

  // Sort soonest first
  upcoming.sort((a, b) => daysUntil(a.event_date) - daysUntil(b.event_date));

  const count = upcoming.length;

  return (
    // Wrapper keeps the dropdown positioned relative to the bell button
    <div style={{ position: 'relative', display: 'inline-block' }}>

      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: open ? '#f3f4f6' : 'white',
          border: '1.5px solid #e5e7eb',
          borderRadius: 10,
          width: 40,
          height: 40,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'background 0.15s',
        }}
        aria-label="Notifications"
      >
        {/* Bell SVG icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>

        {/* Red badge — only shows when there are upcoming events */}
        {count > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: '#dc2626',
            color: 'white',
            borderRadius: '50%',
            width: 18,
            height: 18,
            fontSize: 11,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white',
          }}>
            {count}
          </span>
        )}
      </button>

      {/* Dropdown panel — only visible when bell is clicked */}
      {open && (
        <>
          {/* Invisible backdrop — clicking outside closes the dropdown */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9 }}
            onClick={() => setOpen(false)}
          />

          {/* The actual dropdown card */}
          <div style={{
            position: 'absolute',
            top: 48,
            right: 0,
            width: 320,
            background: 'white',
            border: '1.5px solid #e5e7eb',
            borderRadius: 14,
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
            zIndex: 10,
            overflow: 'hidden',
          }}>

            {/* Dropdown header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #f3f4f6',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: '#1a1a1a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>Upcoming this week</span>
              {count > 0 && (
                <span style={{
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 20,
                  fontWeight: 600,
                }}>
                  {count} event{count !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* List of upcoming events, or empty state */}
            {count === 0 ? (
              <div style={{
                padding: '20px 18px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: '#888',
                textAlign: 'center',
              }}>
                No events in the next 7 days
              </div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {upcoming.map((ev, i) => {
                  const days = daysUntil(ev.event_date);

                  // Pick a label based on how soon the event is
                  const urgencyLabel = days === 0
                    ? 'Today!'
                    : days === 1
                    ? 'Tomorrow'
                    : `In ${days} days`;

                  // Red for today/tomorrow, amber for 2-4 days, green for 5-7
                  const urgencyColor = days <= 1 ? '#dc2626' : days <= 4 ? '#d97706' : '#16a34a';
                  const urgencyBg    = days <= 1 ? '#fef2f2' : days <= 4 ? '#fffbeb' : '#f0fdf4';

                  return (
                    <div key={ev.id} style={{
                      padding: '12px 18px',
                      borderBottom: i < upcoming.length - 1 ? '1px solid #f9fafb' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Event name */}
                        <div style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#1a1a1a',
                          marginBottom: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {ev.event_name || 'Unnamed Event'}
                        </div>
                        {/* Venue and date */}
                        <div style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 11,
                          color: '#888',
                        }}>
                          {ev.venue_name} · {ev.event_date}
                          {ev.event_time ? ` at ${ev.event_time}` : ''}
                        </div>
                      </div>

                      {/* Urgency pill */}
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 11,
                        fontWeight: 600,
                        color: urgencyColor,
                        background: urgencyBg,
                        padding: '3px 8px',
                        borderRadius: 20,
                        flexShrink: 0,
                      }}>
                        {urgencyLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer note */}
            <div style={{
              padding: '10px 18px',
              borderTop: '1px solid #f3f4f6',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: '#aaa',
              textAlign: 'center',
            }}>
              Reminder emails are sent 7 days before each event
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UpcomingEventsBanner — a yellow banner that appears at the top of the page
// when the organizer has events happening within the next 7 days.
// This is a passive reminder even before they click the bell.
// ─────────────────────────────────────────────────────────────────────────────
function UpcomingEventsBanner({ events }) {
  // Same filter as the bell — events in the next 7 days
  const upcoming = events.filter(ev => {
    const d = daysUntil(ev.event_date);
    return d !== null && d >= 0 && d <= 7;
  });

  // Don't render anything if no upcoming events
  if (upcoming.length === 0) return null;

  // Find the soonest event to highlight in the banner
  const soonest = upcoming.reduce((a, b) =>
    daysUntil(a.event_date) < daysUntil(b.event_date) ? a : b
  );
  const days = daysUntil(soonest.event_date);

  return (
    <div style={{
      background: '#fffbeb',
      border: '1px solid #fde68a',
      borderRadius: 12,
      padding: '12px 18px',
      marginBottom: 24,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Warning triangle icon */}
      

      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 600, color: '#92400e', fontSize: 13 }}>
          {days === 0
            ? `Your event "${soonest.event_name}" is today!`
            : days === 1
            ? `Your event "${soonest.event_name}" is tomorrow.`
            : `Your event "${soonest.event_name}" is in ${days} days.`}
        </span>
        {/* If there are more upcoming events beyond the soonest, mention the count */}
        {upcoming.length > 1 && (
          <span style={{ fontSize: 12, color: '#a16207', marginLeft: 6 }}>
            +{upcoming.length - 1} more event{upcoming.length - 1 !== 1 ? 's' : ''} this week.
          </span>
        )}
      </div>

      {/* Small note about the reminder email */}
      <span style={{ fontSize: 11, color: '#a16207', flexShrink: 0 }}>
        Reminder email sent
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EventRSVPStats — expandable RSVP tracker for a single event.
// Clicking "View RSVP responses" fetches and shows guest response data.
// ─────────────────────────────────────────────────────────────────────────────
function EventRSVPStats({ eventId }) {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  // Only fetch RSVP data when the section is expanded and we have an eventId
  useEffect(() => {
    if (!open || !eventId) return;
    setLoading(true);
    api.get(`/organizer/events/${eventId}/rsvp/`)
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [open, eventId]);

  // Color/label mappings for each RSVP status
  const statusColor = { accepted: '#16a34a', declined: '#dc2626', pending: '#d97706' };
  const statusBg    = { accepted: '#f0fdf4', declined: '#fef2f2', pending: '#fffbeb' };
  const statusLabel = { accepted: 'Attending', declined: 'Not attending', pending: 'Pending' };

  return (
    <div style={{ marginTop: 14 }} onClick={e => e.stopPropagation()}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none',
          border: '1.5px solid #e5e7eb',
          borderRadius: 8,
          padding: '6px 14px',
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: '#444',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
<<<<<<< HEAD
        {open ? 'Hide' : 'View'} RSVP responses
=======
         {open ? 'Hide' : 'View'} RSVP responses
>>>>>>> f127d7fe71f4bae8d4cc62914fc39ab9bade4baa
      </button>

      {/* Expanded RSVP panel */}
      {open && (
        <div style={{
          marginTop: 10,
          border: '1.5px solid #e5e7eb',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'white',
        }}>
          {/* Loading state */}
          {loading && (
            <p style={{ padding: '16px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#888', margin: 0 }}>
              Loading…
            </p>
          )}

          {/* Stats loaded successfully */}
          {!loading && stats && (
            <>
<<<<<<< HEAD
              {/* Summary row: 4 count boxes */}
=======
             
>>>>>>> f127d7fe71f4bae8d4cc62914fc39ab9bade4baa
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6' }}>
                {[
                  { label: 'Attending',     value: stats.accepted, color: '#16a34a', bg: '#f0fdf4' },
                  { label: 'Not attending', value: stats.declined, color: '#dc2626', bg: '#fef2f2' },
                  { label: 'Pending',       value: stats.pending,  color: '#d97706', bg: '#fffbeb' },
                  { label: 'Total invited', value: stats.total,    color: '#374151', bg: '#f9fafb' },
                ].map(item => (
                  <div key={item.label} style={{
                    flex: 1,
                    padding: '12px 14px',
                    background: item.bg,
                    borderRight: '1px solid #f3f4f6',
                  }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700, color: item.color }}>
                      {item.value}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#888', marginTop: 2 }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

<<<<<<< HEAD
              {/* Progress bar — green/red/yellow proportional to responses */}
=======
             
>>>>>>> f127d7fe71f4bae8d4cc62914fc39ab9bade4baa
              {stats.total > 0 && (
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ height: 7, borderRadius: 4, background: '#f3f4f6', overflow: 'hidden', display: 'flex' }}>
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

<<<<<<< HEAD
              {/* Per-guest list */}
=======
             
>>>>>>> f127d7fe71f4bae8d4cc62914fc39ab9bade4baa
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {stats.guests.length === 0 ? (
                  <p style={{ padding: '14px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#888', margin: 0 }}>
                    No guests invited yet.
                  </p>
                ) : stats.guests.map((g, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 16px',
                    borderBottom: i < stats.guests.length - 1 ? '1px solid #f9fafb' : 'none',
                  }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#374151' }}>
                      {g.email}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Show the date they responded if available */}
                      {g.responded_at && (
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#aaa' }}>
                          {new Date(g.responded_at).toLocaleDateString()}
                        </span>
                      )}
                      {/* Status badge */}
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 12,
                        color: statusColor[g.status],
                        background: statusBg[g.status],
                        padding: '3px 10px',
                        borderRadius: 20,
                      }}>
                        {statusLabel[g.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Error state */}
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

// ─────────────────────────────────────────────────────────────────────────────
// Main dashboard component
// ─────────────────────────────────────────────────────────────────────────────
export default function EventOrganizerDashboard({ user, onLogout }) {
  const [events, setEvents]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch all confirmed events for this organizer on mount
  const loadEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/organizer/events/');
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setEvents([]);
      // 403 means they're not an event organizer — show a friendly message
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

        {/* Page header row — title on the left, notification bell on the right */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            Event Organizer Dashboard
          </h1>

          {/* Bell only renders once events have loaded (needs the list to compute upcoming) */}
          {!loading && <NotificationBell events={events} />}
        </div>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#888', marginBottom: 32 }}>
          Events you've created at venues
        </p>

        {/* Yellow banner — shows automatically if any event is within 7 days */}
        {!loading && <UpcomingEventsBanner events={events} />}

        {/* Error message */}
        {error && (
          <div style={{
            marginBottom: 20,
            padding: '12px 16px',
            borderRadius: 12,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#888' }}>Loading your events…</p>
        )}

        {/* Event cards */}
        {!loading && events.length > 0 && (
          <section>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              My Events
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
<<<<<<< HEAD
              {events.map((ev) => {
                // Calculate days until this event so we can show a countdown pill
                const days = daysUntil(ev.event_date);
                const isUpcoming = days !== null && days >= 0 && days <= 7;

                return (
                  <div
                    key={ev.id}
                    style={{
                      background: 'white',
                      borderRadius: 16,
                      padding: 20,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      // Subtle amber left border for events happening within 7 days
                     
                    }}
                  >
                    {/* Clickable header row — opens the detail modal */}
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
                      onClick={() => setSelectedEvent(ev)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setSelectedEvent(ev)}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700 }}>
                            {ev.event_name || 'Unnamed Event'}
                          </span>

                          {/* Countdown pill — only visible for events within 7 days */}
                          {isUpcoming && (
                            <span style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: 11,
                              fontWeight: 600,
                              color: days <= 1 ? '#dc2626' : '#d97706',
                              background: days <= 1 ? '#fef2f2' : '#fffbeb',
                              padding: '2px 8px',
                              borderRadius: 20,
                              flexShrink: 0,
                            }}>
                              {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}
                            </span>
                          )}
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

                    {/* RSVP tracker — only shown if guests were invited */}
                    {ev.guest_emails?.length > 0 && (
                      <EventRSVPStats eventId={ev.id} />
                    )}
                  </div>
                );
              })}
=======
              {events.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    background: 'white', borderRadius: 16, padding: 20,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  }}
                >
           
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

                 
                  {ev.guest_emails?.length > 0 && (
                    <EventRSVPStats eventId={ev.id} />
                  )}
                </div>
              ))}
>>>>>>> f127d7fe71f4bae8d4cc62914fc39ab9bade4baa
            </div>
          </section>
        )}

        {/* Empty state */}
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
        {/* ── Event detail modal ─────────────────────────────────────────── */}
=======
      
>>>>>>> f127d7fe71f4bae8d4cc62914fc39ab9bade4baa
        {selectedEvent && (
          <div className="confirm-overlay" onClick={() => setSelectedEvent(null)}>
            <div className="confirm-box" style={{ textAlign: 'left', padding: 28 }} onClick={e => e.stopPropagation()}>

              {/* Modal header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>
                  Event Host Details
                </h3>
                <button type="button" className="btn-ghost" style={{ padding: '6px 12px' }} onClick={() => setSelectedEvent(null)}>
                  Close
                </button>
              </div>

              {/* Detail grid — 2-column layout for most fields */}
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
                      <a href={`/venues/${selectedEvent.venue_slug}`} style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>
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

<<<<<<< HEAD
              {/* RSVP tracker inside modal too */}
=======
             
>>>>>>> f127d7fe71f4bae8d4cc62914fc39ab9bade4baa
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