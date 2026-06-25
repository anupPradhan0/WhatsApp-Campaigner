import { useState } from 'react';

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
        className="rounded-full object-cover border-2 border-line-strong shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-[rgba(59,130,246,0.15)] border-2 border-info-dim flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="font-bold text-info" style={{ fontSize: size * 0.38 }}>
        {name?.charAt(0).toUpperCase() ?? '?'}
      </span>
    </div>
  );
};
