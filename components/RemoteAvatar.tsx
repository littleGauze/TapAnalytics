'use client';

import Avatar from '@mui/material/Avatar';

const imgSlot = { referrerPolicy: 'no-referrer' as const };

export function RemoteAvatar({
  src,
  alt,
  fallback,
  size = 44,
  rounded = true,
}: {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: number;
  rounded?: boolean;
}) {
  return (
    <Avatar
      src={src || undefined}
      alt={alt}
      variant={rounded ? 'rounded' : 'circular'}
      slotProps={{ img: imgSlot }}
      imgProps={imgSlot}
      sx={{
        width: size,
        height: size,
        borderRadius: rounded ? 2 : '50%',
        bgcolor: 'primary.main',
        fontWeight: 700,
        fontSize: size > 36 ? 16 : 14,
      }}
    >
      {(fallback || alt || '?').charAt(0)}
    </Avatar>
  );
}
