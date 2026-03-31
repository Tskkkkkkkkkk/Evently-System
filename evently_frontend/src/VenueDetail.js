import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from './Navbar';
import api, { mediaUrl } from './api';
import VenueMap from './VenueMap';
import styles from './VenueDetail.module.css';

const fmt = (v) => (typeof v === 'number' ? v.toLocaleString() : v ?? '—');

const THEME_OPTIONS = ['Floral', 'Modern', 'Classic', '2000s'];

const emptyEventForm = {
  event_name: '', event_type: '', event_theme: '', event_description: '',
  event_date: '', event_time: '', dress_code: '',
  host_name: '', host_contact: '', host_email: '',
  expected_guests: '', additional_requirements: '',
  invitation_text: 'You are invited!',
  guest_emails: '',
};


const redirectToEsewa = (paymentData) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = paymentData.esewa_url;

  const fields = [
    'amount', 'tax_amount', 'total_amount', 'transaction_uuid',
    'product_code', 'product_service_charge', 'product_delivery_charge',
    'success_url', 'failure_url', 'signed_field_names', 'signature',
  ];

  fields.forEach((key) => {
    const input = document.createElement('input');
    input.type  = 'hidden';
    input.name  = key;
    input.value = paymentData[key];
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};

export default function VenueDetailPage({ slug: slugProp, user, onLogout }) {
  const { slug: slugParam } = useParams();
  const slug = slugParam || slugProp;

  const [venue,         setVenue]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [showMap,       setShowMap]       = useState(false);
  const [error,         setError]         = useState('');
  const [payment,       setPayment]       = useState('eSewa');
  const [bookStep,      setBookStep]      = useState(null);
  const [eventForm,     setEventForm]     = useState(emptyEventForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError,   setSubmitError]   = useState('');
  const [selectedDate,  setSelectedDate]  = useState('');

<<<<<<< HEAD
  const [activeSlide,   setActiveSlide]   = useState(0);
  const [lightboxOpen,  setLightboxOpen]  = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
=======
  const [activeSlide,  setActiveSlide]  = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex,setLightboxIndex]= useState(0);
>>>>>>> 8f2dc803695dddd40ed5e58e1687c609c714502a

  useEffect(() => {
    if (!slug) { setLoading(false); setError('Venue not found.'); return; }
    setLoading(true);
    setError('');
    setShowMap(false);
    api.get(`/venues/${slug}/`)
      .then(res => setVenue(res.data))
      .catch(() => setError('Unable to load venue details.'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!venue) return;
    const t = setTimeout(() => setShowMap(true), 150);
    return () => clearTimeout(t);
  }, [venue]);

  const getImages = (v) => {
    if (!v) return [];
    if (v.images?.length) return v.images;
    if (v.image_url) return [v.image_url];
    return [];
  };

  const images = getImages(venue);

  const prevSlide = useCallback(() =>
    setActiveSlide(i => (i - 1 + images.length) % images.length), [images.length]);
  const nextSlide = useCallback(() =>
    setActiveSlide(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  setLightboxIndex(i => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setLightboxIndex(i => (i + 1) % images.length);
      if (e.key === 'Escape')     setLightboxOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, images.length]);

  const openBookModal  = () => setBookStep('host-prompt');
  const closeBookModal = () => {
    setBookStep(null);
    setEventForm(emptyEventForm);
    setSubmitError('');
    setSelectedDate('');
  };

  const handleBookNow = () => {
    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/venues/${slug}`)}&reason=organizer_only`;
      return;
    }
    const userType = user.user_type || user.userType;
    if (userType !== 'event_organizer' && userType !== 'organizer') {
      window.location.href = `/signup?redirect=${encodeURIComponent(`/venues/${slug}`)}&reason=organizer_only`;
      return;
    }
    openBookModal();
  };

  const today = new Date().toISOString().slice(0, 10);
  const goToDashboard = () => {
    window.location.href = '/organizer/dashboard';
  };

<<<<<<< HEAD
  const submitSkipBooking = async () => {
    if (!selectedDate) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const bookingRes = await api.post(`/venues/${slug}/events/`, {
        event_name: 'Booking', event_type: '', event_theme: '',
        event_description: '', event_date: selectedDate, event_time: '',
        dress_code: '', host_name: '', host_contact: '', host_email: '',
        expected_guests: 0, additional_requirements: '',
        guest_emails: [], invitation_text: '', invitation_theme: 'Modern',
      });

      if (!bookingRes.data.transaction_uuid) {
        setSubmitError('Booking failed — no transaction ID returned.');
        setSubmitLoading(false);
        return;
      }

      const payRes = await api.post('/initiate-esewa-payment/', {
        venue_slug:       slug,
        amount:           venue.total ?? venue.price,
        transaction_uuid: bookingRes.data.transaction_uuid,
      });

      if (payment === 'eSewa') {
        redirectToEsewa(payRes.data);
      } else {
        
        goToDashboard();
      }
    } catch (e) {
      setSubmitError(e.response?.data?.detail || 'That date is already taken. Please pick another.');
      setSubmitLoading(false);
    }
  };
=======

  // replace your submitSkipBooking and submitEvent functions

const submitSkipBooking = async () => {
  if (!selectedDate) return;
  setSubmitLoading(true);
  setSubmitError('');
  try {
    // step 1 — create pending booking, get transaction_uuid back
    const bookingRes = await api.post(`/venues/${slug}/events/`, {
      event_name: 'Booking', event_type: '', event_theme: '',
      event_description: '', event_date: selectedDate, event_time: '',
      dress_code: '', host_name: '', host_contact: '', host_email: '',
      expected_guests: 0, additional_requirements: '',
      guest_emails: [], invitation_text: '',
    });

    // step 2 — initiate payment with the same transaction_uuid
    const payRes = await api.post('/initiate-esewa-payment/', {
      venue_slug:       slug,
      amount:           venue.total ?? venue.price,
      transaction_uuid: bookingRes.data.transaction_uuid,  // ← link them
    });

    redirectToEsewa(payRes.data);   // leaves the page
  } catch (e) {
    setSubmitError(e.response?.data?.detail || 'That date is already taken. Please pick another.');
    setSubmitLoading(false);
  }
};

>>>>>>> 8f2dc803695dddd40ed5e58e1687c609c714502a

  const submitEvent = async () => {
    setSubmitLoading(true);
    setSubmitError('');
    const emails = (eventForm.guest_emails || '')
      .split(/[\n,]+/).map(e => e.trim()).filter(Boolean);
    try {
      const bookingRes = await api.post(`/venues/${slug}/events/`, {
        ...eventForm,
        expected_guests: parseInt(eventForm.expected_guests, 10) || 0,
        guest_emails:    emails,
      });

      if (!bookingRes.data.transaction_uuid) {
        setSubmitError('Booking failed — no transaction ID returned.');
        setSubmitLoading(false);
        return;
      }

      const payRes = await api.post('/initiate-esewa-payment/', {
        venue_slug:       slug,
        amount:           venue.total ?? venue.price,
        transaction_uuid: bookingRes.data.transaction_uuid,
      });

      if (payment === 'eSewa') {
        redirectToEsewa(payRes.data);
      } else {
        // non-eSewa: go straight to organizer dashboard
        goToDashboard();
      }
    } catch (e) {
      setSubmitError(e.response?.data?.detail || 'Could not save event. Try again.');
      setSubmitLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar user={user} onLogout={onLogout} transparent={false} />

      <main className={styles.main}>
        <a href="/venues" className={styles.backLink}>Back to Venues</a>

        {loading && <p className={styles.loading}>Loading venue...</p>}
        {error && !loading && <p className={styles.error}>{error}</p>}

        {!loading && venue && (
          <>
            <section className={styles.sectionGrid}>

              <div className={styles.imageWrap}>
                {images.length > 0 ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden', background: '#f0ede8' }}>
                    <div
                      style={{
                        width: '100%', height: '100%', minHeight: 320,
                        backgroundImage: `url(${mediaUrl(images[activeSlide])})`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        cursor: images.length > 1 ? 'pointer' : 'default',
                      }}
                      onClick={() => { setLightboxIndex(activeSlide); setLightboxOpen(true); }}
                    />
                    {images.length > 1 && (
                      <>
                        <button onClick={e => { e.stopPropagation(); prevSlide(); }} style={{
                          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.45)', color: 'white', border: 'none',
                          borderRadius: '50%', width: 36, height: 36, fontSize: 18,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>‹</button>
                        <button onClick={e => { e.stopPropagation(); nextSlide(); }} style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.45)', color: 'white', border: 'none',
                          borderRadius: '50%', width: 36, height: 36, fontSize: 18,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>›</button>
                        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                          {images.map((_, i) => (
                            <button key={i} onClick={e => { e.stopPropagation(); setActiveSlide(i); }} style={{
                              width: i === activeSlide ? 20 : 8, height: 8,
                              borderRadius: 4, border: 'none', cursor: 'pointer',
                              background: i === activeSlide ? 'white' : 'rgba(255,255,255,0.5)',
                              transition: 'all 0.2s', padding: 0,
                            }} />
                          ))}
                        </div>
                        <div style={{
                          position: 'absolute', top: 12, right: 12,
                          background: 'rgba(0,0,0,0.5)', color: 'white',
                          fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                          padding: '4px 10px', borderRadius: 20,
                        }}>
                          {activeSlide + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className={styles.image} style={{ background: 'linear-gradient(135deg, #d1d5db 0%, #e5e7eb 40%, #d1d5db 100%)' }} />
                )}
              </div>

              <div className={styles.bookingCard}>
                <h2 className={styles.bookingTitle}>Booking Summary</h2>
                {venue.price != null && (
                  <div className={styles.bookingRow}><span>Venue Price</span><span>Rs {fmt(venue.price)}</span></div>
                )}
                {venue.service_fee != null && (
                  <div className={styles.bookingRow}><span>Service Fee</span><span>Rs {fmt(venue.service_fee)}</span></div>
                )}
                {venue.total != null && (
                  <div className={styles.bookingTotal}>
                    <span>Total</span><span className={styles.bookingTotalAmount}>Rs {fmt(venue.total)}</span>
                  </div>
                )}
                <div className={styles.bookingActions}>
                  <button type="button" className={styles.btnPrimary} onClick={handleBookNow}>
                    Book Now
                  </button>
                </div>
                <div className={styles.paymentSection}>
                  <p className={styles.paymentTitle}>Payment Methods</p>
                  {['eSewa'].map(method => (
                    <label key={method} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="payment"
                        value={method}
                        checked={payment === method}
                        onChange={() => setPayment(method)}
                      />
                      {method}
                    </label>
                  ))}
                </div>
                <div className={styles.trustBadge}>Instant booking confirmation</div>
              </div>
            </section>

            {images.length > 1 && (
              <section style={{ maxWidth: 900, margin: '0 auto 24px', padding: '0 0' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#888', marginBottom: 10 }}>
                  All Photos ({images.length})
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {images.map((url, i) => (
                    <div key={i} onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }} style={{
                      width: 80, height: 80, borderRadius: 10, overflow: 'hidden',
                      cursor: 'pointer', flexShrink: 0,
                      border: i === activeSlide ? '2px solid #1a1a1a' : '2px solid transparent',
                      transition: 'border 0.15s',
                    }}>
                      <img
                        src={mediaUrl(url)}
                        alt={`venue-${i}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onClick={() => setActiveSlide(i)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className={styles.detailsCard}>
              <div className={styles.headerRow}>
                <div>
                  <h1 className={styles.venueName}>{venue.name}</h1>
                  <p className={styles.venueCity}>{venue.city}</p>
                </div>
              </div>

              <div className={styles.stats}>
                <div>
                  <div className={styles.statLabel}>Capacity</div>
                  <div className={styles.statValue}>{venue.capacity} guests</div>
                </div>
                <div>
                  <div className={styles.statLabel}>Starting Price</div>
                  <div className={styles.statValue}>Rs {fmt(venue.price)}</div>
                </div>
              </div>

              {venue.event_types?.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionLabel}>Perfect For</div>
                  <div className={styles.tagsWrap}>
                    {venue.event_types.map(t => (
                      <a key={t} href={`/venues?category=${encodeURIComponent(t)}`} className={styles.tag}>{t}</a>
                    ))}
                  </div>
                </div>
              )}

              {venue.description && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionLabel}>About</div>
                  <p className={styles.aboutText}>{venue.description}</p>
                </div>
              )}

              {venue.amenities?.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionLabel}>Amenities</div>
                  <div className={styles.tagsWrap}>
                    {venue.amenities.map(a => <span key={a} className={styles.amenity}>{a}</span>)}
                  </div>
                </div>
              )}

              {showMap && <VenueMap venue={venue} />}
            </section>
          </>
        )}

<<<<<<< HEAD
 
=======
    
>>>>>>> 8f2dc803695dddd40ed5e58e1687c609c714502a
        {lightboxOpen && images.length > 0 && (
          <div onClick={() => setLightboxOpen(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <button onClick={() => setLightboxOpen(false)} style={{
              position: 'absolute', top: 20, right: 24, background: 'none', border: 'none',
              color: 'white', fontSize: 32, cursor: 'pointer',
            }}>×</button>
            {images.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + images.length) % images.length); }} style={{
                  position: 'absolute', left: 20, background: 'rgba(255,255,255,0.15)',
                  border: 'none', color: 'white', borderRadius: '50%',
                  width: 48, height: 48, fontSize: 24, cursor: 'pointer',
                }}>‹</button>
                <button onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % images.length); }} style={{
                  position: 'absolute', right: 20, background: 'rgba(255,255,255,0.15)',
                  border: 'none', color: 'white', borderRadius: '50%',
                  width: 48, height: 48, fontSize: 24, cursor: 'pointer',
                }}>›</button>
              </>
            )}
            <img
              src={mediaUrl(images[lightboxIndex])}
              alt="venue"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }}
            />
            <div style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
              {lightboxIndex + 1} / {images.length}
            </div>
          </div>
        )}

       
        {bookStep && venue && (
          <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && closeBookModal()}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

           
              {bookStep === 'host-prompt' && (
                <>
                  <h2 className={styles.modalTitle}>Booking Confirmation</h2>
                  <div className={styles.bookingDetailsBox}>
                    <p className={styles.bookingDetailsTitle}>Booking Details</p>
                    <p className={styles.modalText}>Venue: {venue.name}</p>
                    <p className={styles.modalText}>Total: Rs {fmt(venue.price)}</p>
                    <p className={styles.modalText}>Payment: {payment}</p>
                  </div>
                  <div className={styles.hostPromptBox}>
                    <p className={styles.hostPromptTitle}>Want to host an Event?</p>
                  </div>
                  <div className={styles.modalActionsCenter}>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} onClick={() => setBookStep('create-event')}>Yes</button>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnGhost}`}   onClick={() => setBookStep('skip-pick-date')}>Skip</button>
                  </div>
                </>
              )}

              {bookStep === 'skip-pick-date' && (
                <>
                  <h2 className={styles.modalTitle}>Reserve a date</h2>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Date</label>
                    <input
                      type="date"
                      className={styles.modalInput}
                      min={today}
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                    />
                  </div>
                  {submitError && <p className={styles.modalError}>{submitError}</p>}
                  <div className={styles.modalActions}>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnGhost}`}   onClick={closeBookModal}    disabled={submitLoading}>Cancel</button>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} onClick={submitSkipBooking} disabled={!selectedDate || submitLoading}>
                      {submitLoading ? 'Redirecting to eSewa…' : `Reserve & Pay with ${payment}`}
                    </button>
                  </div>
                </>
              )}

        
              {bookStep === 'create-event' && (
                <>
                  <h2 className={styles.modalTitle}>Host your Event</h2>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Event Name</label>
                    <input className={styles.modalInput} placeholder="Enter event name" value={eventForm.event_name} onChange={e => setEventForm({ ...eventForm, event_name: e.target.value })} />
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Event Type</label>
                    <input className={styles.modalInput} placeholder="e.g. Wedding, Birthday" value={eventForm.event_type} onChange={e => setEventForm({ ...eventForm, event_type: e.target.value })} />
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Event Theme</label>
                    <div className={styles.themeChipsWrap}>
                      {THEME_OPTIONS.map(t => (
                        <span
                          key={t}
                          className={eventForm.event_theme === t ? `${styles.themeChip} ${styles.themeChipSelected}` : styles.themeChip}
                          onClick={() => setEventForm({ ...eventForm, event_theme: t })}
                        >{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Event Description</label>
                    <textarea className={styles.modalInput} rows={3} placeholder="Describe your event" value={eventForm.event_description} onChange={e => setEventForm({ ...eventForm, event_description: e.target.value })} />
                  </div>
                  <div className={styles.modalActions}>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnGhost}`}   onClick={closeBookModal}>Cancel</button>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} onClick={() => setBookStep('event-schedule')}>Continue</button>
                  </div>
                </>
              )}

     
              {bookStep === 'event-schedule' && (
                <>
                  <h2 className={styles.modalTitle}>Event Schedule</h2>
                  <div className={styles.scheduleGrid}>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel}>Event Date</label>
                      <input type="date" className={styles.modalInput} min={today} value={eventForm.event_date} onChange={e => setEventForm({ ...eventForm, event_date: e.target.value })} />
                    </div>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel}>Event Time</label>
                      <input type="time" className={styles.modalInput} value={eventForm.event_time} onChange={e => setEventForm({ ...eventForm, event_time: e.target.value })} />
                    </div>
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Dress Code</label>
                    <input className={styles.modalInput} placeholder="e.g. Formal, Casual" value={eventForm.dress_code} onChange={e => setEventForm({ ...eventForm, dress_code: e.target.value })} />
                  </div>
                  <p className={styles.hostSectionTitle}>Host Contact Info</p>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Host Name</label>
                    <input className={styles.modalInput} placeholder="Enter host name" value={eventForm.host_name} onChange={e => setEventForm({ ...eventForm, host_name: e.target.value })} />
                  </div>
                  <div className={styles.scheduleGrid}>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel}>Contact Number</label>
                      <input className={styles.modalInput} placeholder="Phone number" value={eventForm.host_contact} onChange={e => setEventForm({ ...eventForm, host_contact: e.target.value })} />
                    </div>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel}>Email</label>
                      <input type="email" className={styles.modalInput} placeholder="Email" value={eventForm.host_email} onChange={e => setEventForm({ ...eventForm, host_email: e.target.value })} />
                    </div>
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Expected Guests</label>
                    <input className={styles.modalInput} type="number" placeholder="Number of guests" value={eventForm.expected_guests} onChange={e => setEventForm({ ...eventForm, expected_guests: e.target.value })} />
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Additional Requirements</label>
                    <textarea className={styles.modalInput} rows={2} value={eventForm.additional_requirements} onChange={e => setEventForm({ ...eventForm, additional_requirements: e.target.value })} />
                  </div>
                  <div className={styles.modalActions}>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnGhost}`}   onClick={() => setBookStep('create-event')}>Back</button>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} onClick={() => setBookStep('invitation-card')}>Continue</button>
                  </div>
                </>
              )}

           
              {bookStep === 'invitation-card' && (
                <>
                  <h2 className={styles.modalTitle}>Your Invitation Card</h2>
                  <div className={styles.invitationPreview}>
                    <p className={styles.invitationPreviewText}>{eventForm.invitation_text || 'Virtual Invitation Card'}</p>
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Edit text</label>
                    <input className={styles.modalInput} placeholder="Invitation message" value={eventForm.invitation_text} onChange={e => setEventForm({ ...eventForm, invitation_text: e.target.value })} />
                  </div>
                  <div className={styles.modalActions}>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnGhost}`}   onClick={() => setBookStep('event-schedule')}>Back</button>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} onClick={() => setBookStep('invite-guests')}>Continue</button>
                  </div>
                </>
              )}

              {bookStep === 'invite-guests' && (
                <>
                  <h2 className={styles.modalTitle}>Invite Guests</h2>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Guest emails (comma or newline separated)</label>
                    <textarea className={styles.modalInput} rows={4} value={eventForm.guest_emails} onChange={e => setEventForm({ ...eventForm, guest_emails: e.target.value })} />
                  </div>

                  <div className={styles.paymentSummaryBox}>
                    <p className={styles.modalText}>Payment method: <strong>{payment}</strong></p>
                    <p className={styles.modalText}>Amount: <strong>Rs {fmt(venue.total ?? venue.price)}</strong></p>
                    {payment === 'eSewa' && (
                      <p className={styles.modalTextSmall}>You will be redirected to eSewa to complete your payment.</p>
                    )}
                  </div>

                  {submitError && <p className={styles.modalError}>{submitError}</p>}
                  <div className={styles.modalActions}>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnGhost}`}   onClick={() => setBookStep('invitation-card')} disabled={submitLoading}>Back</button>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} disabled={submitLoading} onClick={submitEvent}>
                      {submitLoading ? 'Redirecting to eSewa…' : 'Confirm & Pay with eSewa'}
                    </button>
                  </div>
                </>
              )}

<<<<<<< HEAD
=======
            
              {bookStep === 'done' && (
                <>
                  <h2 className={styles.modalTitle}>All set!</h2>
                  <p className={styles.doneText}>
                    Your event has been created and the venue owner has been notified.
                    {invitationResult?.invitations_sent > 0 && (
                      <> Invitation emails sent to {invitationResult.invitations_sent} guest{invitationResult.invitations_sent !== 1 ? 's' : ''}.</>
                    )}
                    {invitationResult?.invitation_error && <> Invitation emails could not be sent.</>}
                  </p>
                  <button type="button" className={`${styles.modalBtn} ${styles.modalBtnPrimary} ${styles.btnFull}`} onClick={closeBookModal}>Done</button>
                </>
              )}

>>>>>>> 8f2dc803695dddd40ed5e58e1687c609c714502a
            </div>
          </div>
        )}
      </main>
    </div>
  );
}