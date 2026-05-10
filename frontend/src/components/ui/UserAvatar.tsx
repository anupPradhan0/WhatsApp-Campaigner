import { useState } from 'react';
import { D } from '../../theme/tokens';

interface AvatarProps {
  name: string;
  image?: string;
  size?: number;
}

export const Avatar = ({ name, image, size = 36 }: AvatarProps) => {
  const [err, setErr] = useState(false);

  if (image && !err) {
    return (
      <img
        src={image}
        alt={name}
        onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${D.border2}`, flexShrink: 0 }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'rgba(59,130,246,0.15)', border: `2px solid ${D.blueDim}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.38, fontWeight: 700, color: D.blue }}>
        {name?.charAt(0).toUpperCase() ?? '?'}
      </span>
    </div>
  );
};
