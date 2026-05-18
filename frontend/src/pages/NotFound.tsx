import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { D } from '../theme/tokens';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: 'calc(100dvh - 200px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        maxWidth: 420,
        width: '100%',
        background: D.surface,
        border: `1px solid ${D.border}`,
        borderRadius: 14,
        padding: 32,
        textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: D.greenDim,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
        }}>
          <Compass size={26} style={{ color: D.greenLight }} />
        </div>
        <p style={{ fontSize: 48, fontWeight: 800, color: D.text, lineHeight: 1, marginBottom: 8 }}>404</p>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: D.text, marginBottom: 8 }}>
          Page not found
        </h1>
        <p style={{ fontSize: 13, color: D.textMuted, lineHeight: 1.6, marginBottom: 24 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/home')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: D.green,
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
