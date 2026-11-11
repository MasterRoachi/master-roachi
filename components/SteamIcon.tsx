'use client';

/**
 * A Steam library icon that falls back to the game's header art.
 *
 * The icon's URL carries a hash that Steam changes when a game updates its
 * icon, and the snapshot keeps the old one until the next refresh: Dota 2's
 * went stale and drew as a broken image on /gaming/ (the audit's tenth
 * finding, 11 Nov). The header art lives at a fixed address, so it is the
 * fallback, cropped square by the same CSS.
 */
export default function SteamIcon({ src, fallback, size }: { src: string; fallback: string; size: number }) {
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={(event) => {
        const img = event.currentTarget;
        if (img.src !== fallback) img.src = fallback;
      }}
    />
  );
}
