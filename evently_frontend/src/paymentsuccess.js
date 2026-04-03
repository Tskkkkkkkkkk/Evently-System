import { useSearchParams } from 'react-router-dom';
import Navbar from './Navbar';
import styles from './PaymentSuccess.module.css';

export default function PaymentSuccess({ user, onLogout }) {
  const [searchParams] = useSearchParams();
  const transactionCode = searchParams.get('transaction_code');
  const amount          = searchParams.get('amount');

  return (
    <div className={styles.page}>
      <Navbar user={user} onLogout={onLogout} transparent={false} />
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.iconWrap}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M6 16L13 23L26 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className={styles.title}>Booking Confirmed</h1>
          <p className={styles.sub}>Your venue is reserved and invitations have been sent to your guests.</p>

          {(transactionCode || amount) && (
            <div className={styles.details}>
              {amount          && <div className={styles.detailRow}><span>Amount paid</span><span>Rs {Number(amount).toLocaleString()}</span></div>}
              {transactionCode && <div className={styles.detailRow}><span>Transaction</span><span className={styles.mono}>{transactionCode}</span></div>}
            </div>
          )}

          <div className={styles.actions}>
            <a href="/organizer" className={styles.btnPrimary}>View My Events</a>
            <a href="/venues"           className={styles.btnOutline}>Browse Venues</a>
          </div>
        </div>
      </main>
    </div>
  );
}