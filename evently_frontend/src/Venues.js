import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import api, { mediaUrl } from './api';
import styles from './Venues.module.css';

const CAPACITY_OPTIONS = ['Any Size', 'Up to 100', '100 - 300', '300 - 500', '500+'];
const PRICE_OPTIONS    = ['Any Price', 'Below 50,000', '50,000 - 80,000', '80,000+'];

const mapCapacity = (v) => ({ 'Up to 100': '0-100', '100 - 300': '100-300', '300 - 500': '300-500', '500+': '500plus' }[v] || 'any');
const mapPrice    = (v) => ({ 'Below 50,000': '0-50000', '50,000 - 80,000': '50000-80000', '80,000+': '80000plus' }[v] || 'any');

const getParam = (key) => new URLSearchParams(window.location.search).get(key) || '';

const today = new Date().toISOString().slice(0, 10);

export default function VenuesPage({ user, onLogout }) {
  const [search,   setSearch]   = useState(getParam('q'));
  const [location, setLocation] = useState(getParam('location') || '');
  const [capacity, setCapacity] = useState('Any Size');
  const [price,    setPrice]    = useState('Any Price');
  const [category, setCategory] = useState(getParam('category') || getParam('type'));
  const [date,     setDate]     = useState('');   // ← new

  const [venues,  setVenues]  = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search?.trim())    params.q             = search.trim();
      if (location?.trim())  params.location      = location.trim();
      if (category?.trim())  params.event_type    = category.trim();

      const cap = mapCapacity(capacity);
      if (cap !== 'any') params.capacity_range = cap;

      const pr = mapPrice(price);
      if (pr !== 'any') params.price_range = pr;

<<<<<<< HEAD
     
=======
>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55
      if (date) params.date = date;

      const res = await api.get('/venues/', { params });
      setVenues(Array.isArray(res.data) ? res.data : (res.data.results || res.data || []));
    } catch {
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD

=======
>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55
  useEffect(() => { fetchVenues(); }, [location, capacity, price, category, date]);

  return (
    <div className={styles.page}>
      <Navbar user={user} onLogout={onLogout} transparent={false} />

      <main className={styles.main}>
       
        {category && (
          <div className={styles.categoryPillWrap}>
            <span className={styles.categoryPill}>
              {category}
              <button type="button" onClick={() => setCategory('')} title="Clear filter">×</button>
            </span>
          </div>
        )}

<<<<<<< HEAD
       
=======
        
>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55
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

<<<<<<< HEAD

        <div className={styles.filters}>
      
=======
       
        <div className={styles.filters}>
          {/* Location */}
>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55
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

<<<<<<< HEAD
          
=======

>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55
          <div>
            <div className={styles.filterLabel}>Capacity</div>
            <select className={styles.filterSelect} value={capacity} onChange={(e) => setCapacity(e.target.value)}>
              {CAPACITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>

<<<<<<< HEAD
=======
  
>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55
          <div>
            <div className={styles.filterLabel}>Price Range</div>
            <select className={styles.filterSelect} value={price} onChange={(e) => setPrice(e.target.value)}>
              {PRICE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>

<<<<<<< HEAD
 
=======
   
>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55
          <div>
            <div className={styles.filterLabel}>Available Date</div>
            <div className={styles.dateFilterWrap}>
              <input
                type="date"
                className={`${styles.filterSelect} ${styles.dateInput}`}
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {date && (
                <button
                  type="button"
                  className={styles.clearDateBtn}
                  onClick={() => setDate('')}
                  title="Clear date filter"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

<<<<<<< HEAD
       
        <div className={styles.resultsRow}>
          <p className={styles.resultsCount}>
            {loading
              ? 'Loading venues…'
              : `${venues.length} venue${venues.length !== 1 ? 's' : ''} found${category ? ` for "${category}"` : ''}`
            }
          </p>
          {date && !loading && (
            <span className={styles.dateBadge}>
              Available on {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              <button type="button" onClick={() => setDate('')}>×</button>
            </span>
          )}
        </div>
=======
>>>>>>> cbdbd8421f46e114072e2080f6e00228f8cfed55

        <div className={styles.resultsRow}>
          <p className={styles.resultsCount}>
            {loading
              ? 'Loading venues…'
              : `${venues.length} venue${venues.length !== 1 ? 's' : ''} found${category ? ` for "${category}"` : ''}`
            }
          </p>
          {date && !loading && (
            <span className={styles.dateBadge}>
              Available on {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              <button type="button" onClick={() => setDate('')}>×</button>
            </span>
          )}
        </div>

  
        <div className={styles.grid}>
          {!loading && venues.map((v) => (
            <a key={v.id || v.slug} href={`/venues/${v.slug}`} className={styles.venueCard}>
              <div
                className={styles.cardImage}
                style={{
                  backgroundImage: v.image_url
                    ? `url(${mediaUrl(v.image_url)})`
                    : 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
                }}
              />
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
            {date
              ? `No venues available on ${new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}. Try a different date.`
              : `No venues found${category ? ` for "${category}"` : ''}. Try adjusting your filters.`
            }
          </div>
        )}
      </main>
    </div>
  );
}