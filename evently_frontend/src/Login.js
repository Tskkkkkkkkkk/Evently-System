import { useState } from 'react';
import api from './api';
import styles from './Login.module.css';

function Login({ onLoginSuccess }) {
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!data.email || !data.password) {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/accounts/login/", data);
      localStorage.setItem("token", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      const userData = response.data.user;
      const userType = userData?.user_type || '';  

      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }

      const redirect = new URLSearchParams(window.location.search).get('redirect');
      if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
        window.location.href = redirect;
        return;
      }

      if (userType === 'venue_owner') {
        window.location.href = '/owner';
      } else if (userType === 'event_organizer' || userType === 'organizer') {
        window.location.href = '/organizer';
      } else if (userType === 'Admin' || userType === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }

    } catch (err) {
      const errorData = err.response?.data;
      if (errorData) {
        const firstKey = Object.keys(errorData)[0];
        const msg = Array.isArray(errorData[firstKey])
          ? errorData[firstKey][0]
          : errorData[firstKey];
        setError(msg || "Login failed.");
      } else {
        setError("Login failed. Please try again.");
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
              <input
                type="password"
                id="password"
                name="password"
                value={data.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className={styles.footer}>
            <p>
              Don&apos;t have an account?{' '}
              <a href="/signup" className={styles.link}>Sign Up</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;