import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import api, { mediaUrl } from './api';
import styles from './Home.module.css';

const EVENT_TYPES = [
  'Weddings',
  'Corporate',
  'Conferences',
  'Birthday Parties',
  'Concerts',
  'Galas & Fundraisers',
];

export default function HomePage({ user, onLogout }) {
  const [featuredVenues, setFeaturedVenues] = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(true);

  useEffect(() => {
    api.get('/venues/?featured=true')
      .then(res => setFeaturedVenues(res.data.results || res.data || []))
      .catch(() => setFeaturedVenues([]))
      .finally(() => setVenuesLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <Navbar user={user} onLogout={onLogout} transparent />

      <section className={styles.hero}>
        <div className={styles.heroBg} style={{ backgroundImage: 'url(/IMG_7044.jpg)' }} />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>The Premier Venue Discovery Platform</p>
          <h1 className={styles.heroTitle}>Find Your<br />Perfect Venue</h1>
          <p className={styles.heroSubtitle}>Discover and book extraordinary venues for your most special moments</p>
          <div className={styles.searchBar}>
            <input className={styles.searchInput} placeholder="Search venues, locations, or event types..." />
            <a href="/venues" className={styles.btnPrimary}>Search</a>
          </div>
    
<div className={styles.heroChips}>
  {EVENT_TYPES.slice(0, 4).map((tag) => (
    <a key={tag} href={`/venues?category=${encodeURIComponent(tag)}`} className={styles.heroChip}>{tag}</a>
  ))}
</div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <span className={styles.eyebrow}>Browse by Category</span>
          <h2 className={`${styles.sectionTitle} ${styles.sectionTitleWithMargin}`}>Popular Event Types</h2>
          <div className={styles.categoryGrid}>
            {EVENT_TYPES.map((label) => (
              <a key={label} href={`/venues?category=${encodeURIComponent(label)}`} className={styles.categoryCard}>
                <div className={styles.categoryCardTitle}>{label}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.eyebrow}>Handpicked for you</span>
              <h2 className={styles.sectionTitle}>Featured Venues</h2>
            </div>
            <a href="/venues" className={styles.btnOutline}>View All Venues</a>
          </div>

          {venuesLoading && (
            <div className={styles.venueGrid}>
              {[1, 2, 3].map((i) => <div key={i} className={styles.venueSkeleton} />)}
            </div>
          )}

          {!venuesLoading && featuredVenues.length === 0 && (
            <div className={styles.empty}>No featured venues yet!</div>
          )}

          {!venuesLoading && featuredVenues.length > 0 && (
            <div className={styles.venueGrid}>
             {featuredVenues.slice(0, 3).map((v) => (
                <a key={v.id || v.slug} href={`/venues/${v.slug}`} className={styles.venueCard}>
                  <div className={styles.cardImage} style={{ backgroundImage: v.image_url ? `url(${mediaUrl(v.image_url)})` : 'linear-gradient(135deg, #e5e7eb, #d1d5db)' }} />
                  <div className={styles.cardBody}>
                    {v.event_types?.length > 0 && (
                      <div className={styles.tags}>
                        {v.event_types.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
                      </div>
                    )}
                    <h3 className={styles.cardTitle}>{v.name}</h3>
                    <p className={styles.cardMeta}>{v.city} · {v.capacity} guests</p>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardPrice}>Rs {v.price?.toLocaleString?.() ?? v.price}</span>
                      <span className={styles.bookNow}>Book Now</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className={styles.cta}>
        <p className={styles.ctaEyebrow}>Ready to get started?</p>
        <h2 className={styles.ctaTitle}>Plan Your Perfect Event Today</h2>
        <div className={styles.ctaActions}>
          <a href="/signup" className={styles.btnCtaPrimary}>Get Started</a>
          <a href="/venues" className={styles.btnCtaOutline}>Browse Venues</a>
        </div>
      </section>
    </div>
  );
}