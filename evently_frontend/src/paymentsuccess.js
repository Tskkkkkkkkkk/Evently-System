// PaymentSuccess.jsximport { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from './Navbar';

export default function PaymentSuccess({ user, onLogout }) {
  const [searchParams] = useSearchParams();
  const [verified, setVerified] = useState(null);
ms
  const transactionCode = searchParams.get('transaction_code');
  const status = searchParams.get('status');
  const amount = searchParams.get('total_amount');

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 24, marginBottom: 8 }}>
          Payment successful
        </h1>
        <p style={{ color: '#666', fontFamily: "'DM Sans', sans-serif" }}>
          Transaction: {transactionCode}<br />
          Amount: Rs {amount}
        </p>
        <a href="/venues" style={{
          display: 'inline-block', marginTop: 24,
          background: '#1a1a1a', color: 'white',
          padding: '12px 28px', borderRadius: 10,
          fontFamily: "'DM Sans', sans-serif", textDecoration: 'none',
        }}>
          Back to venues
        </a>
      </div>
    </div>
  );
}