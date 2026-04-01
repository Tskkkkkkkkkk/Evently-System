import { useSearchParams } from 'react-router-dom';
import Navbar from './Navbar';

export default function PaymentFailure({ user, onLogout }) {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✗</div>
        <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 24, marginBottom: 8 }}>
          Payment Failed
        </h1>
        <p style={{ color: '#666', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7 }}>
          {reason
            ? reason
            : 'Your payment could not be completed. No charges were made.'}
        </p>
        <p style={{ color: '#888', fontFamily: "'DM Sans', sans-serif", fontSize: 14, marginTop: 8 }}>
          Please try again or contact support if the problem persists.
        </p>
        <a
          href="/venues"
          style={{
            display: 'inline-block', marginTop: 24,
            background: '#1a1a1a', color: 'white',
            padding: '12px 28px', borderRadius: 10,
            fontFamily: "'DM Sans', sans-serif", textDecoration: 'none',
          }}
        >
          Back to Venues
        </a>
      </div>
    </div>
  );
}