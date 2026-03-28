import Navbar from './Navbar';

export default function PaymentFailure({ user, onLogout }) {
  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✕</div>
        <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 24, marginBottom: 8 }}>
          Payment failed
        </h1>
        <p style={{ color: '#666', fontFamily: "'DM Sans', sans-serif" }}>
          Something went wrong with your eSewa payment.
        </p>
        <a href="/venues" style={{
          display: 'inline-block', marginTop: 24,
          background: '#1a1a1a', color: 'white',
          padding: '12px 28px', borderRadius: 10,
          fontFamily: "'DM Sans', sans-serif", textDecoration: 'none',
        }}>
          Try again
        </a>
      </div>
    </div>
  );
}