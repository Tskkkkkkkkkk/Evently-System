import { useState, useEffect } from 'react';
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
  const [pendingImageFiles, setPendingImageFiles] = useState([]);
  const [pendingPreviews,   setPendingPreviews]   = useState([]);

  const loadVenues = async () => {
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
  };

  const loadEvents = async () => {
    try {
      const res = await api.get('/owner/events/');
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch { setEvents([]); }
  };

  useEffect(() => { loadVenues(); loadEvents(); }, []);

  const startEdit = (v) => {
    setEditingSlug(v.slug);
    setEditForm({
      name: v.name || '',
      city: v.city || 'Kathmandu',
      capacity: v.capacity || '',
      price: v.price || '',
      event_types: v.event_types || [],
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
    const venue = venues.find(v => v.slug === slug);
    const currentCount = (venue?.images || []).length;
    const allowed = MAX_IMAGES - currentCount;
    if (allowed <= 0) {
      setError(`Maximum ${MAX_IMAGES} images already uploaded.`);
      return;
    }
    const toUpload = Array.from(files).slice(0, allowed);
    if (toUpload.length < files.length) {
      setError(`Only ${allowed} more image(s) allowed. Uploading first ${toUpload.length}.`);
    }
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
      const venue = venues.find(v => v.slug === slug);
      if (!venue) return;
      const newImages = (venue.images || []).filter(u => u !== imageUrl);
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
      const res = await api.post('/owner/venues/', {
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
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - pendingImageFiles.length;
    const toAdd = files.slice(0, remaining);
    setPendingImageFiles(prev => [...prev, ...toAdd]);
    setPendingPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
  };

  const removePendingImage = (index) => {
    setPendingImageFiles(prev => prev.filter((_, i) => i !== index));
    setPendingPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const TypeChip = ({ label, selected, onToggle }) => (
    <button type="button" onClick={onToggle} style={{
      padding: '6px 14px', borderRadius: 50, cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
      border: `2px solid ${selected ? '#1a1a1a' : '#e5e7eb'}`,
      background: selected ? '#1a1a1a' : 'white',
      color: selected ? 'white' : '#555', transition: 'all 0.15s',
    }}>{label}</button>
  );

  const ImageStrip = ({ venue, editable }) => {
    const images = venue.images?.length ? venue.images : (venue.image_url ? [venue.image_url] : []);
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {images.map((url, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <img src={mediaUrl(url)} alt={`img-${i}`}
              style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e7eb' }} />
            {editable && (
              <button type="button" onClick={() => removeImage(venue.slug, url)} style={{
                position: 'absolute', top: -6, right: -6, width: 18, height: 18,
                borderRadius: '50%', background: '#ef4444', color: 'white',
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
              disabled={uploading} onChange={e => handleMultiImageUpload(e.target.files, venue.slug)} />
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
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
          Venue Owner Dashboard
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#888', marginBottom: 32 }}>Manage your listed venues</p>

        {events.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Incoming Events</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {events.map(ev => (
                <div key={ev.id} style={{
                  background: 'white', borderRadius: 16, padding: 20,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer',
                }} onClick={() => setSelectedEvent(ev)} role="button" tabIndex={0}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{ev.event_name || 'Unnamed Event'}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#666' }}>
                        {ev.venue_name} · {ev.event_date || '—'} {ev.event_time ? `at ${ev.event_time}` : ''}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#888' }}>
                        Host: {ev.host_name || '—'} · {ev.host_email || ev.host_contact || '—'}
                      </div>
                    </div>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#5B3A8C', fontWeight: 500 }}>View details</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {selectedEvent && (
          <div className="confirm-overlay" onClick={() => setSelectedEvent(null)}>
            <div className="confirm-box" style={{ maxWidth: 520, width: '90%', textAlign: 'left', padding: 28 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>{selectedEvent.event_name || 'Event details'}</h3>
                <button type="button" className="btn-ghost" style={{ padding: '6px 12px' }} onClick={() => setSelectedEvent(null)}>Close</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                {[['Venue', selectedEvent.venue_name], ['Date', selectedEvent.event_date], ['Time', selectedEvent.event_time],
                  ['Type', selectedEvent.event_type], ['Theme', selectedEvent.event_theme], ['Dress code', selectedEvent.dress_code],
                  ['Guests', selectedEvent.expected_guests], ['Host', selectedEvent.host_name],
                  ['Contact', selectedEvent.host_contact], ['Email', selectedEvent.host_email]
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
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
            {error}
          </div>
        )}

        {loading && <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#888' }}>Loading venues…</p>}

        {!loading && venues.map(v => (
          <div key={v.slug} style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>
              {editingSlug === v.slug ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <input className="field" style={{ gridColumn: '1 / -1' }} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Venue name" />
                    <input className="field" style={{ gridColumn: '1 / -1' }} value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} placeholder="City" />
                    <input className="field" value={editForm.capacity} onChange={e => setEditForm({ ...editForm, capacity: e.target.value })} placeholder="Capacity" />
                    <input className="field" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} placeholder="Price (Rs)" />
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
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6b7280', marginTop: 4 }}>Amenities: {v.amenities.join(', ')}</div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                {editingSlug === v.slug ? (
                  <>
                    <button className="btn-dark" onClick={saveEdit}>Save</button>
                    <button className="btn-ghost" onClick={() => setEditingSlug('')}>Cancel</button>
                  </>
                ) : (
                  <>
                    <a href={`/venues/${v.slug}`} className="btn-ghost">View</a>
                    <button className="btn-edit" onClick={() => startEdit(v)}>Edit</button>
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

        {creating && (
          <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginTop: 20 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Add New Venue</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <input className="field" style={{ gridColumn: '1 / -1' }} placeholder="Venue name *" value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} />
              <input className="field" placeholder="City" value={newForm.city} onChange={e => setNewForm({ ...newForm, city: e.target.value })} />
              <input className="field" placeholder="Capacity (guests)" value={newForm.capacity} onChange={e => setNewForm({ ...newForm, capacity: e.target.value })} />
              <input className="field" placeholder="Price (Rs)" value={newForm.price} onChange={e => setNewForm({ ...newForm, price: e.target.value })} />
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
              <button className="btn-ghost" onClick={() => { setCreating(false); setNewForm(emptyNew); setPendingImageFiles([]); setPendingPreviews([]); }}>Cancel</button>
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
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#666', marginBottom: 28 }}>The venue and all its data will be permanently removed.</p>
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