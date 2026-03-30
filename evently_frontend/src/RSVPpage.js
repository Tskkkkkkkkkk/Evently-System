// RSVPPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from './api';

export default function RSVPPage() {
  const { token }            = useParams();
  const [searchParams]       = useSearchParams();
  const response             = searchParams.get('response');  // accepted | declined
  const [result, setResult]  = useState(null);
  const [error, setError]    = useState('');
  const [loading, setLoading]= useState(true);

  useEffect(() => {
    api.get(`/rsvp/${token}/`, { params: { response } })
      .then(res => setResult(res.data))
      .catch(err => setError(err.response?.data?.detail || 'This link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token, response]);

  const isAccepted = result?.status === 'accepted';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#faf9f7', padding: 24,
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '48px 40px',
        maxWidth: 440, width: '100%', textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
      }}>
        {loading && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#888' }}>Processing your RSVP…</p>
        )}

        {!loading && error && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>Link expired</h2>
            <p style={{ color: '#666', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>{error}</p>
          </>
        )}

        {!loading && result && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>
              {isAccepted ? '🎉' : '😔'}
            </div>
            <h2 style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 22,
              marginBottom: 8, color: '#1a1a1a',
            }}>
              {isAccepted ? "You're going!" : "Maybe next time"}
            </h2>
            <p style={{
              color: '#666', fontFamily: "'DM Sans', sans-serif",
              fontSize: 15, lineHeight: 1.6,
            }}>
              {isAccepted
                ? `Your spot at ${result.event_name} is confirmed. See you there!`
                : `We've noted you won't be attending ${result.event_name}. Thanks for letting us know.`
              }
            </p>
            <p style={{
              marginTop: 16, fontSize: 13, color: '#aaa',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {result.email}
            </p>

            {/* allow changing response */}
            <div style={{ marginTop: 28, display: 'flex', gap: 10, justifyContent: 'center' }}>
              {isAccepted ? (
                <a href={`/rsvp/${token}?response=declined`} style={{
                  fontSize: 13, color: '#888', fontFamily: "'DM Sans', sans-serif",
                  textDecoration: 'underline', cursor: 'pointer',
                }}>
                  Actually, I can't make it
                </a>
              ) : (
                <a href={`/rsvp/${token}?response=accepted`} style={{
                  fontSize: 13, color: '#888', fontFamily: "'DM Sans', sans-serif",
                  textDecoration: 'underline', cursor: 'pointer',
                }}>
                  I changed my mind — I'll attend
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}