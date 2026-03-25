import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from './api';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DEFAULT_CENTER = [27.7172, 85.324];

export default function VenueMap({ venue }) {
  const [geocodedPosition, setGeocodedPosition] = useState(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const hasStoredCoords =
    venue?.latitude != null &&
    venue?.longitude != null &&
    !Number.isNaN(Number(venue.latitude)) &&
    !Number.isNaN(Number(venue.longitude));

  const positionFromStored = hasStoredCoords
    ? [Number(venue.latitude), Number(venue.longitude)]
    : null;

  useEffect(() => {
    if (positionFromStored) {
      setGeocodedPosition(null);
      setGeocodeError(false);
      return;
    }
    const address = (venue?.address || '').trim();
    const city = (venue?.city || '').trim();
    const query = [address, city].filter(Boolean).join(', ') + (city || address ? ', Nepal' : '');
    if (!query || query === ', Nepal') {
      setGeocodedPosition(null);
      setGeocodeError(false);
      return;
    }
    let cancelled = false;
    setGeocodeLoading(true);
    setGeocodeError(false);
    api
      .get('/geocode/', { params: { q: query } })
      .then((res) => {
        if (cancelled || !mountedRef.current) return;
        const { lat, lon } = res.data || {};
        if (lat != null && lon != null) {
          setGeocodedPosition([Number(lat), Number(lon)]);
          setGeocodeError(false);
        } else {
          setGeocodedPosition(null);
          setGeocodeError(true);
        }
      })
      .catch(() => {
        if (!cancelled && mountedRef.current) {
          setGeocodedPosition(null);
          setGeocodeError(true);
        }
      })
      .finally(() => {
        if (!cancelled && mountedRef.current) setGeocodeLoading(false);
      });
    return () => { cancelled = true; };
  }, [venue?.address, venue?.city]);

  const position = positionFromStored || geocodedPosition || DEFAULT_CENTER;
  const hasExactLocation = !!positionFromStored;
  const fromGeocode = !!geocodedPosition;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>
        Location
      </div>
      {geocodeLoading && (
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Loading map location…</p>
      )}
      {geocodeError && !positionFromStored && (venue?.city || venue?.address) && (
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
          Could not find coordinates for this address. Map shows default area.
        </p>
      )}
      <div style={{
        height: 280,
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        background: '#f3f4f6',
      }}>
        <MapContainer
          key={`${position[0]}-${position[1]}`}
          center={position}
          zoom={hasExactLocation ? 16 : 14}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          zoomAnimation={false}
          markerZoomAnimation={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>
              <strong>{venue?.name || 'Venue'}</strong>
              {venue?.address && <><br />{venue.address}</>}
              {venue?.city && <><br />{venue.city}</>}
              {!hasExactLocation && fromGeocode && (
                <><br /><em style={{ fontSize: 11, color: '#6b7280' }}>Location from address/city.</em></>
              )}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      {(venue?.address || venue?.city) && (
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
          {[venue.address, venue.city].filter(Boolean).join(', ')}
        </p>
      )}
    </div>
  );
}