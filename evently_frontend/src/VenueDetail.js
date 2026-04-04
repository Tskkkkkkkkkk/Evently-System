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
  invitation_text: 'You are invited!', invitation_theme: 'Modern',
  guest_emails: '',
};

const emptySkipForm = {
  event_date:   '',
  host_name:    '',
  host_contact: '',
  host_email:   '',
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

function StarDisplay({ rating, size = 16 }) {
  return (
    <span className={styles.starRow} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={n <= rating ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </span>
  );
}

function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span className={styles.starRow}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className={(hovered || value) >= n ? styles.starFilled : styles.starEmpty}
          style={{ cursor: 'pointer', fontSize: 28 }}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
        >★</span>
      ))}
    </span>
  );
}

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
  const [skipForm,      setSkipForm]      = useState(emptySkipForm);
  const [showNoForm,    setShowNoForm]    = useState(false);

  const [activeSlide,   setActiveSlide]   = useState(0);
  const [lightboxOpen,  setLightboxOpen]  = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
<<<<<<< HEAD

  const [reviews,        setReviews]        = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRating,   setReviewRating]   = useState(0);
  const [reviewComment,  setReviewComment]  = useState('');
  const [reviewError,    setReviewError]    = useState('');
  const [reviewSuccess,  setReviewSuccess]  = useState('');
  const [reviewLoading,  setReviewLoading]  = useState(false);

  const isOrganizer = user && (
    user.user_type === 'event_organizer' || user.user_type === 'organizer'
  );
=======
>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55

  useEffect(() => {
    if (!slug) { setLoading(false); setError('Venue not found.'); return; }
    setLoading(true); setError(''); setShowMap(false);
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

  useEffect(() => {
    if (!slug) return;
    setReviewsLoading(true);
    api.get(`/venues/${slug}/reviews/`)
      .then(res => setReviews(res.data))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [slug]);

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

  const openBookModal = () => {
    setShowNoForm(false); setSkipForm(emptySkipForm); setBookStep('host-prompt');
  };
  const closeBookModal = () => {
    setBookStep(null); setEventForm(emptyEventForm); setSkipForm(emptySkipForm);
    setSubmitError(''); setShowNoForm(false);
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
<<<<<<< HEAD
  const goToDashboard = () => { window.location.href = '/organizer/dashboard'; };

=======

  const goToDashboard = () => {
    window.location.href = '/organizer/dashboard';
  };

>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55
  const submitSkipBooking = async () => {
    if (!skipForm.event_date) { setSubmitError('Please select a date.'); return; }
    setSubmitLoading(true); setSubmitError('');
    try {
      const bookingRes = await api.post(`/venues/${slug}/events/`, {
        event_name: 'Booking', event_type: '', event_theme: '',
        event_description: '', event_date: skipForm.event_date, event_time: '',
        dress_code: '', host_name: skipForm.host_name,
        host_contact: skipForm.host_contact, host_email: skipForm.host_email,
        expected_guests: 0, additional_requirements: '',
        guest_emails: [], invitation_text: '', invitation_theme: 'Modern',
      });
      if (!bookingRes.data.transaction_uuid) {
        setSubmitError('Booking failed — no transaction ID returned.');
        setSubmitLoading(false); return;
      }
      const payRes = await api.post('/initiate-esewa-payment/', {
        venue_slug: slug, amount: venue.total ?? venue.price,
        transaction_uuid: bookingRes.data.transaction_uuid,
      });
<<<<<<< HEAD
      if (payment === 'eSewa') redirectToEsewa(payRes.data);
      else goToDashboard();
=======

      if (payment === 'eSewa') {
        redirectToEsewa(payRes.data);
      } else {
     
        goToDashboard();
      }
>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55
    } catch (e) {
      setSubmitError(e.response?.data?.detail || 'That date is already taken. Please pick another.');
      setSubmitLoading(false);
    }
  };

  const submitEvent = async () => {
    setSubmitLoading(true); setSubmitError('');
    const emails = (eventForm.guest_emails || '')
      .split(/[\n,]+/).map(e => e.trim()).filter(Boolean);
    try {
      const bookingRes = await api.post(`/venues/${slug}/events/`, {
        ...eventForm,
        expected_guests: parseInt(eventForm.expected_guests, 10) || 0,
        guest_emails: emails,
      });
      if (!bookingRes.data.transaction_uuid) {
        setSubmitError('Booking failed — no transaction ID returned.');
        setSubmitLoading(false); return;
      }
      const payRes = await api.post('/initiate-esewa-payment/', {
        venue_slug: slug, amount: venue.total ?? venue.price,
        transaction_uuid: bookingRes.data.transaction_uuid,
      });
      if (payment === 'eSewa') redirectToEsewa(payRes.data);
      else goToDashboard();
    } catch (e) {
      setSubmitError(e.response?.data?.detail || 'Could not save event. Try again.');
      setSubmitLoading(false);
    }
  };

  const submitReview = async () => {
    setReviewError(''); setReviewSuccess('');
    if (!reviewRating) { setReviewError('Please select a star rating.'); return; }
    if (!reviewComment.trim()) { setReviewError('Please write a comment.'); return; }
    setReviewLoading(true);
    try {
      const res = await api.post(`/venues/${slug}/reviews/`, {
        rating: reviewRating, comment: reviewComment.trim(),
      });
      setReviews(prev => [res.data, ...prev.filter(r => r.user_id !== res.data.user_id)]);
      setReviewRating(0); setReviewComment('');
      setReviewSuccess('Your review has been saved!');
    } catch (e) {
      setReviewError(e.response?.data?.detail || 'Could not save review. Try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      await api.delete(`/venues/${slug}/reviews/${reviewId}/`);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch { /* silent */ }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

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
                  <div className={styles.imageCarousel}>
                    <div
                      className={`${styles.imageCarouselSlide} ${images.length === 1 ? styles.imageCarouselSlideStatic : ''}`}
                      style={{ backgroundImage: `url(${mediaUrl(images[activeSlide])})` }}
                      onClick={() => { setLightboxIndex(activeSlide); setLightboxOpen(true); }}
                    />
                    {images.length > 1 && (
                      <>
                        <button className={`${styles.imageCarouselBtn} ${styles.imageCarouselBtnPrev}`}
                          onClick={e => { e.stopPropagation(); prevSlide(); }}>‹</button>
                        <button className={`${styles.imageCarouselBtn} ${styles.imageCarouselBtnNext}`}
                          onClick={e => { e.stopPropagation(); nextSlide(); }}>›</button>
                        <div className={styles.imageCarouselDots}>
                          {images.map((_, i) => (
                            <button key={i}
                              className={`${styles.imageCarouselDot} ${i === activeSlide ? styles.imageCarouselDotActive : styles.imageCarouselDotInactive}`}
                              onClick={e => { e.stopPropagation(); setActiveSlide(i); }} />
                          ))}
                        </div>
                        <div className={styles.imageCarouselCounter}>{activeSlide + 1} / {images.length}</div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className={styles.imagePlaceholder} />
                )}
              </div>

              {/* Booking card */}
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
                {avgRating && (
                  <div className={styles.bookingRating}>
                    <StarDisplay rating={Math.round(Number(avgRating))} />
                    <span className={styles.bookingRatingText}>
                      {avgRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}
                <div className={styles.bookingActions}>
                  <button type="button" className={styles.btnPrimary} onClick={handleBookNow}>Book Now</button>
                </div>
                <div className={styles.paymentSection}>
                  <p className={styles.paymentTitle}>Payment Methods</p>
                  {['eSewa'].map(method => (
                    <label key={method} className={styles.radioLabel}>
                      <input type="radio" name="payment" value={method}
                        checked={payment === method} onChange={() => setPayment(method)} />
                      {method}
                    </label>
                  ))}
                </div>
                <div className={styles.trustBadge}>Instant booking confirmation</div>
              </div>
            </section>

            
            {images.length > 1 && (
              <section className={styles.thumbnailStrip}>
                <div className={styles.thumbnailStripLabel}>All Photos ({images.length})</div>
                <div className={styles.thumbnailList}>
                  {images.map((url, i) => (
                    <div key={i}
                      className={`${styles.thumbnailItem} ${i === activeSlide ? styles.thumbnailItemActive : ''}`}
                      onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}>
                      <img src={mediaUrl(url)} alt={`venue-${i}`} className={styles.thumbnailImg}
                        onClick={() => setActiveSlide(i)} />
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
                {avgRating && (
                  <div>
                    <div className={styles.statLabel}>Rating</div>
                    <div className={styles.statValue}>{avgRating} / 5</div>
                  </div>
                )}
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

          
            <section className={styles.reviewsSection}>
              <h2 className={styles.reviewsSectionTitle}>
                Reviews
                {avgRating && (
                  <span className={styles.reviewsAvg}>
                    <StarDisplay rating={Math.round(Number(avgRating))} size={18} />
                    <span className={styles.reviewsAvgNum}>{avgRating} out of 5</span>
                  </span>
                )}
              </h2>

              {isOrganizer && (
                <div className={styles.reviewForm}>
                  <h3 className={styles.reviewFormTitle}>Leave a Review</h3>
                  <div className={styles.reviewFormRating}>
                    <span className={styles.reviewFormRatingLabel}>Your rating</span>
                    <StarInput value={reviewRating} onChange={setReviewRating} />
                  </div>
                  <textarea
                    className={styles.reviewTextarea}
                    rows={4}
                    placeholder="Share your experience with this venue…"
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                  />
                  {reviewError   && <p className={styles.reviewError}>{reviewError}</p>}
                  {reviewSuccess && <p className={styles.reviewSuccess}>{reviewSuccess}</p>}
                  <button type="button" className={styles.reviewSubmitBtn}
                    onClick={submitReview} disabled={reviewLoading}>
                    {reviewLoading ? 'Saving…' : 'Submit Review'}
                  </button>
                </div>
              )}

              {!user && (
                <p className={styles.reviewNudge}>
                  <a href={`/login?redirect=${encodeURIComponent(`/venues/${slug}`)}`}>Log in as an event organizer</a> to leave a review.
                </p>
              )}

              {reviewsLoading && <p className={styles.loading}>Loading reviews…</p>}
              {!reviewsLoading && reviews.length === 0 && (
                <p className={styles.reviewEmpty}>No reviews yet. Be the first to share your experience!</p>
              )}

              <div className={styles.reviewList}>
                {reviews.map(r => (
                  <div key={r.id} className={styles.reviewCard}>
                    <div className={styles.reviewCardHeader}>
                      <div className={styles.reviewCardLeft}>
                        <div className={styles.reviewerAvatar}>
                          {(r.reviewer_name || 'A')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.reviewerName}>{r.reviewer_name || 'Anonymous'}</div>
                          <StarDisplay rating={r.rating} size={14} />
                        </div>
                      </div>
                      <div className={styles.reviewCardRight}>
                        <span className={styles.reviewDate}>
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                        </span>
                        {user && (String(user.id) === String(r.user_id) || user.is_staff) && (
                          <button className={styles.reviewDeleteBtn} onClick={() => deleteReview(r.id)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <p className={styles.reviewComment}>{r.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

    
        {lightboxOpen && images.length > 0 && (
          <div className={styles.lightboxOverlay} onClick={() => setLightboxOpen(false)}>
            <button className={styles.lightboxClose} onClick={() => setLightboxOpen(false)}>×</button>
            {images.length > 1 && (
              <>
                <button className={styles.lightboxBtnPrev}
                  onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + images.length) % images.length); }}>‹</button>
                <button className={styles.lightboxBtnNext}
                  onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % images.length); }}>›</button>
              </>
            )}
            <img src={mediaUrl(images[lightboxIndex])} alt="venue"
              className={styles.lightboxImg} onClick={e => e.stopPropagation()} />
            <div className={styles.lightboxCounter}>{lightboxIndex + 1} / {images.length}</div>
          </div>
        )}

       
        {bookStep && venue && (
          <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && closeBookModal()}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

<<<<<<< HEAD
          
=======
        
>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55
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

                  {!showNoForm ? (
                    <div className={styles.modalActionsCenter}>
                      <button type="button" className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                        onClick={() => setBookStep('create-event')}>Yes</button>
                      <button type="button" className={`${styles.modalBtn} ${styles.modalBtnGhost}`}
                        onClick={() => setShowNoForm(true)}>Skip </button>
                    </div>
                  ) : (
                    <div className={styles.skipFormWrap}>
                      <p className={styles.skipFormNote}>
                        Please share your contact details so the venue owner can reach you.
                      </p>
                      <div className={styles.modalField}>
                        <label className={styles.modalLabel}>
                          Preferred Date <span className={styles.requiredMark}>*</span>
                        </label>
                        <input type="date" className={styles.modalInput} min={today}
                          value={skipForm.event_date}
                          onChange={e => setSkipForm({ ...skipForm, event_date: e.target.value })} />
                      </div>
                      <div className={styles.modalField}>
                        <label className={styles.modalLabel}>Your Name</label>
                        <input className={styles.modalInput} placeholder="Full name"
                          value={skipForm.host_name}
                          onChange={e => setSkipForm({ ...skipForm, host_name: e.target.value })} />
                      </div>
                      <div className={styles.scheduleGrid}>
                        <div className={styles.modalField}>
                          <label className={styles.modalLabel}>Contact Number</label>
                          <input className={styles.modalInput} placeholder="Phone number"
                            value={skipForm.host_contact}
                            onChange={e => setSkipForm({ ...skipForm, host_contact: e.target.value })} />
                        </div>
                        <div className={styles.modalField}>
                          <label className={styles.modalLabel}>Email</label>
                          <input type="email" className={styles.modalInput} placeholder="your@email.com"
                            value={skipForm.host_email}
                            onChange={e => setSkipForm({ ...skipForm, host_email: e.target.value })} />
                        </div>
                      </div>
                      {submitError && <p className={styles.modalError}>{submitError}</p>}
                      <div className={styles.modalActions}>
                        <button type="button" className={`${styles.modalBtn} ${styles.modalBtnGhost}`}
                          onClick={closeBookModal} disabled={submitLoading}>Cancel</button>
                        <button type="button" className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                          onClick={submitSkipBooking} disabled={!skipForm.event_date || submitLoading}>
                          {submitLoading ? 'Redirecting to eSewa…' : `Reserve & Pay with ${payment}`}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

<<<<<<< HEAD
       
=======
              {/* Step 2a: skip — just pick a date */}
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

            
>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55
              {bookStep === 'create-event' && (
                <>
                  <h2 className={styles.modalTitle}>Host your Event</h2>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Event Name</label>
                    <input className={styles.modalInput} placeholder="Enter event name"
                      value={eventForm.event_name} onChange={e => setEventForm({ ...eventForm, event_name: e.target.value })} />
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Event Type</label>
                    <input className={styles.modalInput} placeholder="e.g. Wedding, Birthday"
                      value={eventForm.event_type} onChange={e => setEventForm({ ...eventForm, event_type: e.target.value })} />
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Event Theme</label>
                    <div className={styles.themeChipsWrap}>
                      {THEME_OPTIONS.map(t => (
                        <span key={t}
                          className={`${styles.themeChip} ${eventForm.event_theme === t ? styles.themeChipSelected : ''}`}
                          onClick={() => setEventForm({ ...eventForm, event_theme: t })}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Event Description</label>
                    <textarea className={styles.modalInput} rows={3} placeholder="Describe your event"
                      value={eventForm.event_description} onChange={e => setEventForm({ ...eventForm, event_description: e.target.value })} />
                  </div>
                  <div className={styles.modalActions}>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnGhost}`} onClick={closeBookModal}>Cancel</button>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} onClick={() => setBookStep('event-schedule')}>Continue</button>
                  </div>
                </>
              )}

<<<<<<< HEAD
=======
    
>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55
              {bookStep === 'event-schedule' && (
                <>
                  <h2 className={styles.modalTitle}>Event Schedule</h2>
                  <div className={styles.scheduleGrid}>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel}>Event Date</label>
                      <input type="date" className={styles.modalInput} min={today}
                        value={eventForm.event_date} onChange={e => setEventForm({ ...eventForm, event_date: e.target.value })} />
                    </div>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel}>Event Time</label>
                      <input type="time" className={styles.modalInput}
                        value={eventForm.event_time} onChange={e => setEventForm({ ...eventForm, event_time: e.target.value })} />
                    </div>
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Dress Code</label>
                    <input className={styles.modalInput} placeholder="e.g. Formal, Casual"
                      value={eventForm.dress_code} onChange={e => setEventForm({ ...eventForm, dress_code: e.target.value })} />
                  </div>
                  <p className={styles.hostSectionTitle}>Host Contact Info</p>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Host Name</label>
                    <input className={styles.modalInput} placeholder="Enter host name"
                      value={eventForm.host_name} onChange={e => setEventForm({ ...eventForm, host_name: e.target.value })} />
                  </div>
                  <div className={styles.scheduleGrid}>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel}>Contact Number</label>
                      <input className={styles.modalInput} placeholder="Phone number"
                        value={eventForm.host_contact} onChange={e => setEventForm({ ...eventForm, host_contact: e.target.value })} />
                    </div>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel}>Email</label>
                      <input type="email" className={styles.modalInput} placeholder="Email"
                        value={eventForm.host_email} onChange={e => setEventForm({ ...eventForm, host_email: e.target.value })} />
                    </div>
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Expected Guests</label>
                    <input className={styles.modalInput} type="number" placeholder="Number of guests"
                      value={eventForm.expected_guests} onChange={e => setEventForm({ ...eventForm, expected_guests: e.target.value })} />
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Additional Requirements</label>
                    <textarea className={styles.modalInput} rows={2}
                      value={eventForm.additional_requirements} onChange={e => setEventForm({ ...eventForm, additional_requirements: e.target.value })} />
                  </div>
                  <div className={styles.modalActions}>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnGhost}`} onClick={() => setBookStep('create-event')}>Back</button>
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
                    <input className={styles.modalInput} placeholder="Invitation message"
                      value={eventForm.invitation_text} onChange={e => setEventForm({ ...eventForm, invitation_text: e.target.value })} />
                  </div>
                  <div className={styles.modalActions}>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnGhost}`} onClick={() => setBookStep('event-schedule')}>Back</button>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} onClick={() => setBookStep('invite-guests')}>Continue</button>
                  </div>
                </>
              )}

<<<<<<< HEAD

=======
          
>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55
              {bookStep === 'invite-guests' && (
                <>
                  <h2 className={styles.modalTitle}>Invite Guests</h2>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Guest emails (comma or newline separated)</label>
                    <textarea className={styles.modalInput} rows={4}
                      value={eventForm.guest_emails} onChange={e => setEventForm({ ...eventForm, guest_emails: e.target.value })} />
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
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnGhost}`}
                      onClick={() => setBookStep('invitation-card')} disabled={submitLoading}>Back</button>
                    <button type="button" className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                      disabled={submitLoading} onClick={submitEvent}>
                      {submitLoading ? 'Redirecting to eSewa…' : 'Confirm & Pay with eSewa'}
                    </button>
                  </div>
                </>
              )}
<<<<<<< HEAD
=======

>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55
            </div>
          </div>
        )}
      </main>
    </div>
  );
}