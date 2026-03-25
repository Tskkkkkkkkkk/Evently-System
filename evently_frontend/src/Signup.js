import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from './api';
import styles from './Signup.module.css';

function Signup({ onSignupSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    user_type: '',
    password: '',
    password_confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const getDashboardPath = (userType) => {
    switch (userType) {
      case 'event_organizer':
      case 'organizer':    return '/organizer';
      case 'venue_owner':  return '/owner';
      default:             return '/';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.user_type) {
      setError('Please select a user type.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/accounts/register/', formData);

      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      if (onSignupSuccess) {
        onSignupSuccess(response.data.user);
      }

     
      navigate(getDashboardPath(response.data.user.user_type));
      
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData) {
        const firstKey = Object.keys(errorData)[0];
        const msg = Array.isArray(errorData[firstKey]) ? errorData[firstKey][0] : errorData[firstKey];
        setError(msg || 'Registration failed.');
      } else {
        setError('Registration failed. Please try again.');
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
            <p className={styles.subtitle}>Create your account to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.formGroup}>
              <label htmlFor="full_name">Full Name</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="user_type">I am a...</label>
              <select
                id="user_type"
                name="user_type"
                value={formData.user_type}
                onChange={handleChange}
                required
              >
                <option value="">Select user type</option>
                <option value="event_organizer">Event Organiser</option>
                <option value="venue_owner">Venue Owner</option>
            
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
                placeholder="At least 8 characters"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password_confirm">Confirm Password</label>
              <input
                type="password"
                id="password_confirm"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
              />
            </div>

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className={styles.footer}>
            <p>
              Already have an account?{' '}
              <a href="/login" className={styles.link}>Login</a>
            </p>
            <p style={{ marginTop: '10px' }}>
              <a href="/" className={styles.link}>Back to Home</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;