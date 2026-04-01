import { useState, useEffect, useCallback } from 'react';
import Navbar from './Navbar';
import api, { mediaUrl } from './api';
import './VenueOwnerDashboard.css';

const EVENT_TYPE_OPTIONS = [
  'Weddings', 'Corporate', 'Conferences', 'Birthday Parties', 'Concerts', 'Galas & Fundraisers',
];

const MAX_IMAGES = 10;

const emptyNew = {
  name: '', city: 'Kathmandu', capacity: '', price: '',
  amenitiesText: '', image_url: '', event_types: [],
};

const emptyEdit = { name: '', city: '', capacity: '', price: '', event_types: [], amenitiesText: '' };

const toggle = (arr, item) =>
  arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];


function isEventPast(event) {
  if (!event.event_date) return false;
  const eventDt = new Date(`${event.event_date}T${event.event_time || '23:59'}:00`);
  return eventDt < new Date();
}

function EventStatusBadge({ event }) {
  const past = isEventPast(event);
  return (
    <span style={{
      fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
      padding: '3px 10px', borderRadius: 20,
      background: past ? '#fef9c3' : '#f0fdf4',
      color:      past ? '#854d0e' : '#166534',
    }}>
      {past ? 'Completed' : 'Upcoming'}
    </span>
  );
}



function NotificationBell({ events }) {
  const [open, setOpen] = useState(false);

  const notifications = events
    .filter(ev => {
      if (!ev.event_date) return false;
      const eventDt  = new Date(`${ev.event_date}T${ev.event_time || '23:59'}:00`);
      const now      = new Date();
      const hoursAgo = (now - eventDt) / 36e5;
<<<<<<< HEAD
    
=======
   
>>>>>>> 9903e087d6dd92003ebb8ca6518d036a8f551848
      const upcoming = eventDt > now && eventDt - now < 24 * 36e5;
      const justDone = hoursAgo >= 0 && hoursAgo < 48;
      return upcoming || justDone;
    })
    .map(ev => {
      const eventDt  = new Date(`${ev.event_date}T${ev.event_time || '23:59'}:00`);
      const past     = eventDt < new Date();
      return {
        id:      ev.id,
        title:   ev.event_name || 'Event',
        venue:   ev.venue_name,
        message: past
          ? `"${ev.event_name || 'Event'}" at ${ev.venue_name} has ended.`
          : `"${ev.event_name || 'Event'}" at ${ev.venue_name} is happening soon!`,
        past,
      };
    });

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: '1.5px solid #e5e7eb',
          borderRadius: 10, padding: '7px 12px', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 6, position: 'relative',
        }}
      >
        🔔
        {notifications.length > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -6,
            background: '#ef4444', color: 'white',
            borderRadius: '50%', width: 18, height: 18,
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 44, zIndex: 100,
          background: 'white', borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
          border: '1px solid #f3f4f6',
          minWidth: 300, maxWidth: 360,
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #f3f4f6',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#1a1a1a',
          }}>
            Notifications
          </div>

          {notifications.length === 0 ? (
            <div style={{
              padding: '20px 16px', fontFamily: "'DM Sans', sans-serif",
              fontSize: 13, color: '#888', textAlign: 'center',
            }}>
              No new notifications
            </div>
          ) : (
            notifications.map((n, i) => (
              <div key={n.id} style={{
                padding: '12px 16px',
                borderBottom: i < notifications.length - 1 ? '1px solid #f9fafb' : 'none',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
             
                <div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    color: '#1a1a1a', lineHeight: 1.4,
                  }}>
                    {n.message}
                  </div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                    color: '#aaa', marginTop: 3,
                  }}>
                    {n.past ? 'Completed' : 'Coming up'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

<<<<<<< HEAD
  
=======
   
>>>>>>> 9903e087d6dd92003ebb8ca6518d036a8f551848
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}


<<<<<<< HEAD
=======

>>>>>>> 9903e087d6dd92003ebb8ca6518d036a8f551848
function DeleteEventModal({ event, onConfirm, onCancel, loading }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
          Delete Event?
        </h3>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#666', marginBottom: 8 }}>
          Are you sure you want to remove <strong>{event.event_name || 'this event'}</strong>?
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#aaa', marginBottom: 28 }}>
          This will also remove all RSVP records for this event.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            className="btn-delete"
            style={{ padding: '10px 28px', fontSize: 14 }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting…' : 'Yes, Delete'}
          </button>
          <button className="btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
}


export default function VenueOwnerDashboard({ user, onLogout }) {
  const [venues,            setVenues]            = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState('');
  const [editingSlug,       setEditingSlug]       = useState('');
  const [editForm,          setEditForm]          = useState(emptyEdit);
  const [newForm,           setNewForm]           = useState(emptyNew);
  const [creating,          setCreating]          = useState(false);
  const [uploading,         setUploading]         = useState(false);
  const [deletingSlug,      setDeletingSlug]      = useState('');
  const [events,            setEvents]            = useState([]);
  const [selectedEvent,     setSelectedEvent]     = useState(null);
  const [deletingEvent,     setDeletingEvent]     = useState(null);
  const [deletingEventLoad, setDeletingEventLoad] = useState(false);
  const [pendingImageFiles, setPendingImageFiles] = useState([]);
  const [pendingPreviews,   setPendingPreviews]   = useState([]);
  const [eventFilter,       setEventFilter]       = useState('all'); // all | upcoming | completed

  const loadVenues = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/owner/venues/');
      setVenues(res.data.results || res.data || []);
    } catch (e) {
      setError(e.response?.status === 403
        ? 'You must sign up as a Venue Owner to access this dashboard.'
        : 'Unable to load your venues.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const res = await api.get('/owner/events/');
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch { setEvents([]); }
  }, []);

  useEffect(() => { loadVenues(); loadEvents(); }, [loadVenues, loadEvents]);

<<<<<<< HEAD
 
=======
  
>>>>>>> 9903e087d6dd92003ebb8ca6518d036a8f551848
  const filteredEvents = events.filter(ev => {
    if (eventFilter === 'upcoming')  return !isEventPast(ev);
    if (eventFilter === 'completed') return isEventPast(ev);
    return true;
  });

  const upcomingCount  = events.filter(ev => !isEventPast(ev)).length;
  const completedCount = events.filter(ev =>  isEventPast(ev)).length;

  const deleteEvent = async () => {
    if (!deletingEvent) return;
    setDeletingEventLoad(true);
    try {
      await api.delete(`/owner/events/${deletingEvent.id}/`);
      setEvents(prev => prev.filter(e => e.id !== deletingEvent.id));
      setDeletingEvent(null);
      if (selectedEvent?.id === deletingEvent.id) setSelectedEvent(null);
    } catch (e) {
      setError('Could not delete event: ' + (e.response?.data?.detail || e.message));
      setDeletingEvent(null);
    } finally {
      setDeletingEventLoad(false);
    }
  };

 
  const startEdit = (v) => {
    setEditingSlug(v.slug);
    setEditForm({
      name:          v.name || '',
      city:          v.city || 'Kathmandu',
      capacity:      v.capacity || '',
      price:         v.price || '',
      event_types:   v.event_types || [],
      amenitiesText: Array.isArray(v.amenities) ? v.amenities.join(', ') : (v.amenities || ''),
    });
  };

  const saveEdit = async () => {
    setError('');
    const payload = {
      ...editForm,
      amenities: (editForm.amenitiesText || '').split(',').map(a => a.trim()).filter(Boolean),
    };
    delete payload.amenitiesText;
    try {
      await api.put(`/owner/venues/${editingSlug}/`, payload);
      setEditingSlug('');
      loadVenues();
    } catch (e) {
      setError('Unable to save changes: ' + (e.response?.data?.detail || e.message));
    }
  };

  const deleteVenue = async (slug) => {
    setError('');
    try {
      await api.delete(`/owner/venues/${slug}/`);
      setDeletingSlug('');
      setVenues(prev => prev.filter(v => v.slug !== slug));
    } catch (e) {
      setError('Unable to delete venue: ' + (e.response?.data?.detail || e.message));
    }
  };

  const uploadOneImage = async (file, slug) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('slug', slug);
    const res = await api.post('/owner/venues/upload-image/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.image_url || null;
  };

  const handleMultiImageUpload = async (files, slug) => {
    if (!files || !files.length || !slug) return;
    const venue    = venues.find(v => v.slug === slug);
    const allowed  = MAX_IMAGES - (venue?.images || []).length;
    if (allowed <= 0) { setError(`Maximum ${MAX_IMAGES} images already uploaded.`); return; }
    const toUpload = Array.from(files).slice(0, allowed);
    if (toUpload.length < files.length)
      setError(`Only ${allowed} more image(s) allowed. Uploading first ${toUpload.length}.`);
    setUploading(true);
    try {
      for (const file of toUpload) await uploadOneImage(file, slug);
      loadVenues();
    } catch (e) {
      setError('Upload failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (slug, imageUrl) => {
    setError('');
    try {
      const venue      = venues.find(v => v.slug === slug);
      if (!venue) return;
      const newImages  = (venue.images || []).filter(u => u !== imageUrl);
      const newPrimary = venue.image_url === imageUrl ? (newImages[0] || '') : venue.image_url;
      await api.patch(`/owner/venues/${slug}/`, { images: newImages, image_url: newPrimary });
      loadVenues();
    } catch (e) {
      setError('Could not remove image: ' + (e.response?.data?.detail || e.message));
    }
  };

  const createVenue = async () => {
    if (!newForm.name) { setError('Venue name is required.'); return; }
    setError('');
    try {
      const res  = await api.post('/owner/venues/', {
        name:        newForm.name,
        city:        newForm.city,
        capacity:    newForm.capacity,
        price:       newForm.price,
        amenities:   newForm.amenitiesText.split(',').map(a => a.trim()).filter(Boolean),
        event_types: newForm.event_types,
      });
      const slug = res.data.slug;
      if (pendingImageFiles.length > 0 && slug) {
        setUploading(true);
        try {
          for (const file of pendingImageFiles) await uploadOneImage(file, slug);
        } catch (imgErr) {
          setError('Venue created but some images failed: ' + (imgErr.response?.data?.detail || imgErr.message));
        } finally {
          setUploading(false);
        }
      }
      setCreating(false);
      setNewForm(emptyNew);
      setPendingImageFiles([]);
      setPendingPreviews([]);
      loadVenues();
    } catch (e) {
      setError('Unable to add venue: ' + (e.response?.data?.detail || e.message));
    }
  };

  const handleNewImageSelect = (e) => {
    const files     = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - pendingImageFiles.length;
    const toAdd     = files.slice(0, remaining);
    setPendingImageFiles(prev => [...prev, ...toAdd]);
    setPendingPreviews(prev  => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
  };

  const removePendingImage = (index) => {
    setPendingImageFiles(prev => prev.filter((_, i) => i !== index));
    setPendingPreviews(prev   => prev.filter((_, i) => i !== index));
  };


  const TypeChip = ({ label, selected, onToggle }) => (
    <button type="button" onClick={onToggle} style={{
      padding: '6px 14px', borderRadius: 50, cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
      border:     `2px solid ${selected ? '#1a1a1a' : '#e5e7eb'}`,
      background: selected ? '#1a1a1a' : 'white',
      color:      selected ? 'white' : '#555', transition: 'all 0.15s',
    }}>{label}</button>
  );

  const ImageStrip = ({ venue, editable }) => {
    const images = venue.images?.length ? venue.images : (venue.image_url ? [venue.image_url] : []);
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {images.map((url, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <img src={mediaUrl(url)} alt={`img-${i}`} style={{
              width: 56, height: 56, borderRadius: 8,
              objectFit: 'cover', border: '1px solid #e5e7eb',
            }} />
            {editable && (
              <button type="button" onClick={() => removeImage(venue.slug, url)} style={{
                position: 'absolute', top: -6, right: -6,
                width: 18, height: 18, borderRadius: '50%',
                background: '#ef4444', color: 'white',
                border: 'none', fontSize: 11, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>×</button>
            )}
          </div>
        ))}
        {editable && images.length < MAX_IMAGES && (
          <label style={{
            width: 56, height: 56, borderRadius: 8, border: '2px dashed #d1d5db',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#9ca3af', fontSize: 22, flexShrink: 0,
          }}>
            +
            <input type="file" accept="image/*" multiple style={{ display: 'none' }}
              disabled={uploading}
              onChange={e => handleMultiImageUpload(e.target.files, venue.slug)} />
          </label>
        )}
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#9ca3af' }}>
          {images.length}/{MAX_IMAGES}
        </span>
      </div>
    );
  };

 
  return (
    <div style={{ fontFamily: "'Georgia', serif", background: '#faf9f7', minHeight: '100vh', color: '#1a1a1a' }}>
      <Navbar user={user} onLogout={onLogout} transparent={false} />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 100px' }}>
<<<<<<< HEAD
=======

   
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            Venue Owner Dashboard
          </h1>
          <NotificationBell events={events} />
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#888', marginBottom: 32 }}>
          Manage your listed venues
        </p>
>>>>>>> 9903e087d6dd92003ebb8ca6518d036a8f551848

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            Venue Owner Dashboard
          </h1>
          <NotificationBell events={events} />
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#888', marginBottom: 32 }}>
          Manage your listed venues
        </p>

       
        {events.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, margin: 0 }}>
                Events
              </h2>
<<<<<<< HEAD
              
=======
         
>>>>>>> 9903e087d6dd92003ebb8ca6518d036a8f551848
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { key: 'all',       label: `All (${events.length})` },
                  { key: 'upcoming',  label: `Upcoming (${upcomingCount})` },
                  { key: 'completed', label: `Completed (${completedCount})` },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setEventFilter(tab.key)} style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '5px 12px',
                    borderRadius: 20, border: '1.5px solid',
                    borderColor:  eventFilter === tab.key ? '#1a1a1a' : '#e5e7eb',
                    background:   eventFilter === tab.key ? '#1a1a1a' : 'white',
                    color:        eventFilter === tab.key ? 'white'   : '#555',
                    cursor: 'pointer',
                  }}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredEvents.length === 0 && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#aaa', padding: '20px 0' }}>
                  No {eventFilter !== 'all' ? eventFilter : ''} events.
                </p>
              )}
              {filteredEvents.map(ev => (
                <div
                  key={ev.id}
                  style={{
                    background: isEventPast(ev) ? '#fafaf8' : 'white',
                    borderRadius: 16, padding: 20,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    border: isEventPast(ev) ? '1px solid #f3f4f6' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div
                      style={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => setSelectedEvent(ev)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setSelectedEvent(ev)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700 }}>
                          {ev.event_name || 'Unnamed Event'}
                        </div>
                        <EventStatusBadge event={ev} />
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#666', marginBottom: 2 }}>
                        {ev.venue_name} · {ev.event_date || '—'}{ev.event_time ? ` at ${ev.event_time}` : ''}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#888' }}>
                        Host: {ev.host_name || '—'} · {ev.host_email || ev.host_contact || '—'}
                      </div>
                      {ev.expected_guests > 0 && (
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#aaa', marginTop: 2 }}>
                          {ev.expected_guests} expected guest{ev.expected_guests !== 1 ? 's' : ''}
                          {ev.rsvp_accepted > 0 && ` · ${ev.rsvp_accepted} confirmed`}
                        </div>
                      )}
                    </div>

                 
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 16, alignItems: 'center' }}>
                      <button
                        onClick={() => setSelectedEvent(ev)}
                        style={{
                          background: 'none', border: '1.5px solid #e5e7eb',
                          borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#444',
                        }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => setDeletingEvent(ev)}
                        style={{
                          background: 'none', border: '1.5px solid #fecaca',
                          borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#dc2626',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

<<<<<<< HEAD
                
=======
>>>>>>> 9903e087d6dd92003ebb8ca6518d036a8f551848
                  {isEventPast(ev) && (
                    <div style={{
                      marginTop: 12, padding: '10px 14px',
                      background: '#fffbeb', borderRadius: 10,
                      border: '1px solid #fef3c7',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#92400e',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                     
                      <span>
                        This event has been completed.
                        {(ev.rsvp_accepted || 0) > 0 && ` ${ev.rsvp_accepted} guest${ev.rsvp_accepted !== 1 ? 's' : ''} attended.`}
                        {(ev.rsvp_declined || 0) > 0 && ` ${ev.rsvp_declined} declined.`}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        
        {selectedEvent && (
          <div className="confirm-overlay" onClick={() => setSelectedEvent(null)}>
            <div className="confirm-box" style={{ maxWidth: 520, width: '90%', textAlign: 'left', padding: 28 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, margin: 0 }}>
                    {selectedEvent.event_name || 'Event details'}
                  </h3>
                  <EventStatusBadge event={selectedEvent} />
                </div>
                <button type="button" className="btn-ghost" style={{ padding: '6px 12px' }} onClick={() => setSelectedEvent(null)}>
                  Close
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                {[
                  ['Venue',   selectedEvent.venue_name],
                  ['Date',    selectedEvent.event_date],
                  ['Time',    selectedEvent.event_time],
                  ['Type',    selectedEvent.event_type],
                  ['Theme',   selectedEvent.event_theme],
                  ['Dress code', selectedEvent.dress_code],
                  ['Guests',  selectedEvent.expected_guests],
                  ['Host',    selectedEvent.host_name],
                  ['Contact', selectedEvent.host_contact],
                  ['Email',   selectedEvent.host_email],
                ].map(([label, val]) => (
                  <div key={label} className="event-detail-row">
                    <div className="event-detail-label">{label}</div>
                    <div className="event-detail-value">{val || '—'}</div>
                  </div>
                ))}
                <div className="event-detail-row" style={{ gridColumn: '1 / -1' }}>
                  <div className="event-detail-label">Description</div>
                  <div className="event-detail-value">{selectedEvent.event_description || '—'}</div>
                </div>
                {selectedEvent.guest_emails?.length > 0 && (
                  <div className="event-detail-row" style={{ gridColumn: '1 / -1' }}>
                    <div className="event-detail-label">Invited guests</div>
                    <div className="event-detail-value">{selectedEvent.guest_emails.join(', ')}</div>
                  </div>
                )}
              </div>

              
              {(selectedEvent.rsvp_accepted > 0 || selectedEvent.rsvp_declined > 0 || selectedEvent.rsvp_pending > 0) && (
                <div style={{ marginTop: 20, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 10 }}>
                    RSVP Summary
                  </div>
                  <div style={{ display: 'flex', gap: 0 }}>
                    {[
                      { label: 'Attending',     value: selectedEvent.rsvp_accepted || 0, color: '#16a34a', bg: '#f0fdf4' },
                      { label: 'Not attending', value: selectedEvent.rsvp_declined || 0, color: '#dc2626', bg: '#fef2f2' },
                      { label: 'Pending',       value: selectedEvent.rsvp_pending  || 0, color: '#d97706', bg: '#fffbeb' },
                    ].map(item => (
                      <div key={item.label} style={{
                        flex: 1, padding: '10px 14px', background: item.bg,
                        borderRight: '1px solid #f3f4f6', borderRadius: 0,
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
                </div>
              )}

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setSelectedEvent(null); setDeletingEvent(selectedEvent); }}
                  style={{
                    background: 'none', border: '1.5px solid #fecaca',
                    borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#dc2626',
                  }}
                >
                  Delete this event
                </button>
              </div>
            </div>
          </div>
        )}


        {deletingEvent && (
          <DeleteEventModal
            event={deletingEvent}
            onConfirm={deleteEvent}
            onCancel={() => setDeletingEvent(null)}
            loading={deletingEventLoad}
          />
        )}

        {error && (
          <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
            {error}
          </div>
        )}

        {loading && <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#888' }}>Loading venues…</p>}

<<<<<<< HEAD
       
=======
        {/* ── venue cards ── */}
>>>>>>> 9903e087d6dd92003ebb8ca6518d036a8f551848
        {!loading && venues.map(v => (
          <div key={v.slug} style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>
              {editingSlug === v.slug ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <input className="field" style={{ gridColumn: '1 / -1' }} value={editForm.name}          onChange={e => setEditForm({ ...editForm, name: e.target.value })}          placeholder="Venue name" />
                    <input className="field" style={{ gridColumn: '1 / -1' }} value={editForm.city}          onChange={e => setEditForm({ ...editForm, city: e.target.value })}          placeholder="City" />
                    <input className="field"                                   value={editForm.capacity}      onChange={e => setEditForm({ ...editForm, capacity: e.target.value })}      placeholder="Capacity" />
                    <input className="field"                                   value={editForm.price}         onChange={e => setEditForm({ ...editForm, price: e.target.value })}         placeholder="Price (Rs)" />
                    <input className="field" style={{ gridColumn: '1 / -1' }} value={editForm.amenitiesText} onChange={e => setEditForm({ ...editForm, amenitiesText: e.target.value })} placeholder="Amenities e.g. Parking, WiFi" />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#555', marginBottom: 6 }}>Event Types</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {EVENT_TYPE_OPTIONS.map(t => (
                        <TypeChip key={t} label={t} selected={editForm.event_types.includes(t)}
                          onToggle={() => setEditForm({ ...editForm, event_types: toggle(editForm.event_types, t) })} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{v.name}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#888', marginBottom: 4 }}>
                    {v.city} · {v.capacity} guests · Rs {v.price?.toLocaleString?.() ?? v.price}
                  </div>
                  {v.event_types?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {v.event_types.map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                  )}
                  {v.amenities?.length > 0 && (
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      Amenities: {v.amenities.join(', ')}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                {editingSlug === v.slug ? (
                  <>
                    <button className="btn-dark"  onClick={saveEdit}>Save</button>
                    <button className="btn-ghost" onClick={() => setEditingSlug('')}>Cancel</button>
                  </>
                ) : (
                  <>
                    <a href={`/venues/${v.slug}`} className="btn-ghost">View</a>
                    <button className="btn-edit"   onClick={() => startEdit(v)}>Edit</button>
                    <button className="btn-delete" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => setDeletingSlug(v.slug)}>Delete</button>
                  </>
                )}
              </div>
            </div>

            <div style={{ marginTop: 12, borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                Images {uploading && editingSlug === v.slug ? '— uploading…' : ''}
              </div>
              <ImageStrip venue={v} editable={editingSlug === v.slug} />
            </div>
          </div>
        ))}

        {!loading && venues.length === 0 && !creating && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa', fontFamily: "'DM Sans', sans-serif", fontSize: 15 }}>
            You haven't added any venues yet.
          </div>
        )}

<<<<<<< HEAD
        
=======
       
>>>>>>> 9903e087d6dd92003ebb8ca6518d036a8f551848
        {creating && (
          <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginTop: 20 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Add New Venue</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <input className="field" style={{ gridColumn: '1 / -1' }} placeholder="Venue name *"           value={newForm.name}          onChange={e => setNewForm({ ...newForm, name: e.target.value })} />
              <input className="field"                                   placeholder="City"                   value={newForm.city}          onChange={e => setNewForm({ ...newForm, city: e.target.value })} />
              <input className="field"                                   placeholder="Capacity (guests)"      value={newForm.capacity}      onChange={e => setNewForm({ ...newForm, capacity: e.target.value })} />
              <input className="field"                                   placeholder="Price (Rs)"             value={newForm.price}         onChange={e => setNewForm({ ...newForm, price: e.target.value })} />
              <input className="field" style={{ gridColumn: '1 / -1' }} placeholder="Amenities e.g. Parking, WiFi" value={newForm.amenitiesText} onChange={e => setNewForm({ ...newForm, amenitiesText: e.target.value })} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#555', marginBottom: 8 }}>Event Types</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EVENT_TYPE_OPTIONS.map(t => (
                  <TypeChip key={t} label={t} selected={newForm.event_types.includes(t)}
                    onToggle={() => setNewForm({ ...newForm, event_types: toggle(newForm.event_types, t) })} />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#555', marginBottom: 8 }}>
                Venue Images <span style={{ color: '#9ca3af' }}>({pendingImageFiles.length}/{MAX_IMAGES})</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {pendingPreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={src} alt={`preview-${i}`} style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', border: '1px solid #e5e7eb' }} />
                    <button type="button" onClick={() => removePendingImage(i)} style={{
                      position: 'absolute', top: -6, right: -6, width: 18, height: 18,
                      borderRadius: '50%', background: '#ef4444', color: 'white',
                      border: 'none', fontSize: 11, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>×</button>
                  </div>
                ))}
                {pendingImageFiles.length < MAX_IMAGES && (
                  <label style={{
                    width: 64, height: 64, borderRadius: 10, border: '2px dashed #d1d5db',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#9ca3af', fontSize: 26, flexShrink: 0,
                  }}>
                    +
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleNewImageSelect} />
                  </label>
                )}
              </div>
              {pendingImageFiles.length > 0 && (
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#16a34a', marginTop: 6 }}>
                  {pendingImageFiles.length} image{pendingImageFiles.length !== 1 ? 's' : ''} ready
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-dark" onClick={createVenue} disabled={uploading}>
                {uploading ? 'Uploading images…' : 'Save Venue'}
              </button>
              <button className="btn-ghost" onClick={() => { setCreating(false); setNewForm(emptyNew); setPendingImageFiles([]); setPendingPreviews([]); }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>

      {!creating && (
        <button className="btn-dark" onClick={() => setCreating(true)} style={{
          position: 'fixed', right: 40, bottom: 40, padding: '14px 24px',
          borderRadius: 50, fontSize: 15, boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> Add Venue
        </button>
      )}

     
      {deletingSlug && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Delete Venue?</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#666', marginBottom: 28 }}>
              The venue and all its data will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn-delete" style={{ padding: '10px 28px', fontSize: 14 }} onClick={() => deleteVenue(deletingSlug)}>Yes, Delete</button>
              <button className="btn-ghost" onClick={() => setDeletingSlug('')}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}