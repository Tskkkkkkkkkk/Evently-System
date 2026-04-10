import { useState } from 'react';
import api from './api';
import styles from './Login.module.css';

function Login({ onLoginSuccess }) {
  const [data, setData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
    setError('');
  };

  const getRedirectPath = (userType) => {
    const redirect = new URLSearchParams(window.location.search).get('redirect');
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
      return redirect;
    }
    if (userType === 'venue_owner') return '/owner';
    if (userType === 'event_organizer' || userType === 'organizer') return '/organizer';
    if (userType === 'admin' || userType === 'Admin') return '/admin';
    return '/';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.email || !data.password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/accounts/login/', data);

      // Persist tokens first
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      const userData = response.data.user;
      const userType = userData?.user_type || '';
      const path = getRedirectPath(userType);

<<<<<<< HEAD
     
      if (onLoginSuccess) {
        onLoginSuccess(userData);
       
=======
      // Notify parent, then redirect after it has had a chance to update
      if (onLoginSuccess) {
        onLoginSuccess(userData);
        // Give the parent one tick to re-render before navigating.
        // If the parent's re-render already redirects (e.g. via a protected
        // route check), this setTimeout is harmless.
>>>>>>> e6d55850870d78c9665dbded260ac7f635f38d90
        setTimeout(() => {
          window.location.href = path;
        }, 100);
      } else {
        window.location.href = path;
      }

    } catch (err) {
      const errorData = err.response?.data;
      if (errorData) {
        const firstKey = Object.keys(errorData)[0];
        const msg = Array.isArray(errorData[firstKey])
          ? errorData[firstKey][0]
          : errorData[firstKey];
        setError(msg || 'Login failed.');
      } else {
        setError('Login failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.overlay} />
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.brandTitle}>Evently</h1>
            <p className={styles.subtitle}>Welcome back! Please login to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={data.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={data.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className={styles.toggleText}
                  onClick={() => setShowPassword(p => !p)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className={styles.footer}>
            <p>
              Don't have an account?{' '}
              <a href="/signup" className={styles.link}>Sign Up</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;