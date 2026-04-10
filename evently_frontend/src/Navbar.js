import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';
 const links = [
    { label: 'Home',   href: '/' },
    { label: 'Venues', href: '/venues' },
  ];
  
function getNavLinks(user) {
 
  if (user?.user_type === 'event_organizer' || user?.user_type === 'organizer') {
    links.push({ label: 'My Events', href: '/organizer' });
  }
  if (user?.user_type === 'venue_owner') {
    links.push({ label: 'Dashboard', href: '/owner' });
  }
 if (user?.user_type === 'Admin' || user?.user_type === 'admin') {
  links.push({ label: 'Admin', href: '/admin' });
}

  return links;
}

export default function Navbar({ user, onLogout, transparent = false }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [transparent]);

  const isLight = !transparent || scrolled;
  const current = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <nav
      className={`${styles.nav} ${transparent ? styles.navFixed : ''} ${isLight ? styles.navLight : ''}`}
    >
      <a href="/" className={styles.logo} style={{ color: isLight ? '#1a1a1a' : 'white' }}>
        Evently
      </a>

      <div className={styles.links}>
        {user && getNavLinks(user).map(({ label, href }) => {
          const active = current === href || (href !== '/' && current.startsWith(href));
          return (
            <a
              key={label}
              href={href}
              className={styles.link}
              style={{
                color: isLight ? (active ? '#1a1a1a' : '#666') : (active ? 'white' : 'rgba(255,255,255,0.8)'),
                fontWeight: active ? 600 : 400,
              }}
            >
              {label}
            </a>
          );
        })}
      </div>

      <div className={styles.actions}>
        {user ? (
          <button
            type="button"
            onClick={onLogout}
            className={styles.btnSolid}
            style={{
              background: isLight ? '#1a1a1a' : 'rgba(255,255,255,0.2)',
              borderColor: isLight ? '#1a1a1a' : 'rgba(255,255,255,0.5)',
              color: 'white',
            }}
          >
            Logout
          </button>
        ) : (
          <>
            <a
              href="/login"
              className={styles.btnGhost}
              style={{
                borderColor: isLight ? '#1a1a1a' : 'rgba(255,255,255,0.7)',
                color: isLight ? '#1a1a1a' : 'white',
              }}
            >
              Login
            </a>
            <a
              href="/signup"
              className={styles.btnSolid}
              style={{
                background: isLight ? '#1a1a1a' : 'rgba(255,255,255,0.2)',
                borderColor: isLight ? '#1a1a1a' : 'rgba(255,255,255,0.5)',
                color: 'white',
              }}
            >
              Sign Up
            </a>
          </>
        )}
      </div>
    </nav>
  );
}