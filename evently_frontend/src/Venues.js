import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import api, { mediaUrl } from './api';
import styles from './Venues.module.css';

const CAPACITY_OPTIONS = ['Any Size', 'Up to 100', '100 - 300', '300 - 500', '500+'];
const PRICE_OPTIONS = ['Any Price', 'Below 50,000', '50,000 - 80,000', '80,000+'];
const AVAILABILITY_OPTIONS = ['All', 'Available'];

const mapCapacity = (v) => ({ 'Up to 100': '0-100', '100 - 300': '100-300', '300 - 500': '300-500', '500+': '500plus' }[v] || 'any');
const mapPrice = (v) => ({ 'Below 50,000': '0-50000', '50,000 - 80,000': '50000-80000', '80,000+': '80000plus' }[v] || 'any');

const getParam = (key) => new URLSearchParams(window.location.search).get(key) || '';

export default function VenuesPage({ user, onLogout }) {
  const [search, setSearch] = useState(getParam('q'));
  const [location, setLocation] = useState(getParam('location') || '');
  const [capacity, setCapacity] = useState('Any Size');
  const [price, setPrice] = useState('Any Price');
  const [availability, setAvailability] = useState('All');
  const [category, setCategory] = useState(getParam('category') || getParam('type'));
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search?.trim()) params.q = search.trim();
      if (location?.trim()) params.location = location.trim();
      const cap = mapCapacity(capacity);
      if (cap && cap !== 'any') params.capacity_range = cap;
      const pr = mapPrice(price);
      if (pr && pr !== 'any') params.price_range = pr;
      if (availability && availability !== 'All') params.availability = availability;
      if (category?.trim()) params.event_type = category.trim();

      const res = await api.get('/venues/', { params });
      setVenues(Array.isArray(res.data) ? res.data : (res.data.results || res.data || []));
    } catch {
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVenues(); }, [location, capacity, price, availability, category]);

  const filters = [
    { label: 'Capacity', value: capacity, setter: setCapacity, options: CAPACITY_OPTIONS },
    { label: 'Price Range', value: price, setter: setPrice, options: PRICE_OPTIONS },
    { label: 'Availability', value: availability, setter: setAvailability, options: AVAILABILITY_OPTIONS },
  ];

  return (
    <div className={styles.page}>
      <Navbar user={user} onLogout={onLogout} transparent={false} />

      <main className={styles.main}>
        <h1 className={styles.title}>Browse Venues</h1>
        <p className={styles.subtitle}>Find the perfect space for your next event</p>

        {category && (
          <div className={styles.categoryPillWrap}>
            <span className={styles.categoryPill}>
              {category}
              <button type="button" onClick={() => setCategory('')} title="Clear filter">×</button>
            </span>
          </div>
        )}

        <div className={styles.searchBar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search venues or event types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchVenues()}
          />
          <button type="button" className={styles.searchBtn} onClick={fetchVenues}>Search</button>
        </div>

        <div className={styles.filters}>
          <div>
            <div className={styles.filterLabel}>Location</div>
            <input
              type="text"
              className={styles.filterSelect}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchVenues()}
              placeholder="City"
            />
          </div>
          {filters.map((f) => (
            <div key={f.label}>
              <div className={styles.filterLabel}>{f.label}</div>
              <select className={styles.filterSelect} value={f.value} onChange={(e) => f.setter(e.target.value)}>
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        <p className={styles.resultsCount}>
          {loading ? 'Loading venues…' : `${venues.length} venue${venues.length !== 1 ? 's' : ''} found${category ? ` for "${category}"` : ''}`}
        </p>

        <div className={styles.grid}>
          {!loading && venues.map((v) => (
            <a key={v.id || v.slug} href={`/venues/${v.slug}`} className={styles.venueCard}>
              <div
                className={styles.cardImage}
                style={{ backgroundImage: v.image_url ? `url(${mediaUrl(v.image_url)})` : 'linear-gradient(135deg, #e5e7eb, #d1d5db)' }}
              >
                
              </div>
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

        {!loading && venues.length === 0 && (
          <div className={styles.empty}>
            No venues found{category ? ` for "${category}"` : ''}. Try adjusting your filters.
          </div>
        )}
      </main>
    </div>
  );
}
