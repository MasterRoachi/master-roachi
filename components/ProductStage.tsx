'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { GalleryImage } from '@/lib/gallery';
import styles from './ProductStage.module.css';

// A product's stage, and the strip of pictures under it.
//
// The stage opens on what it always showed: the turnable 3D where there is a
// model, the flat cut-out otherwise. That is `children`, passed in from the
// page so the 3D stays the page's business. Each thumb below swaps a 2D
// picture into the stage; the first thumb brings the 3D back. Clicking the
// picture in the stage opens it full size.
//
// The 3D is unmounted while a picture is shown rather than hidden under it:
// a hidden WebGL canvas keeps rendering, and on a phone that is battery spent
// on nothing. Coming back costs a reload of the model, which is cached.

export default function ProductStage({
  gallery,
  stageClassName,
  leadLabel,
  leadThumb,
  caption,
  children,
}: {
  gallery: GalleryImage[];
  stageClassName: string;
  /** What the first thumb is: "3D" where it turns, "Main" where it does not. */
  leadLabel: string;
  /** A picture for the first thumb, the flat cut-out. */
  leadThumb: string | null;
  /** Said under the 3D ("Drag it to turn it"), and only while it is shown. */
  caption?: ReactNode;
  children: ReactNode;
}) {
  const [shown, setShown] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const picture = shown === null ? null : gallery[shown] ?? null;

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoomed(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed]);

  return (
    <>
      <div className={stageClassName}>
        {picture ? (
          <button
            type="button"
            className={styles.picture}
            data-kind={picture.kind}
            onClick={() => setZoomed(true)}
            aria-label={`${picture.alt || 'Picture'}, shown larger`}
          >
            <img src={picture.src} alt={picture.alt} width={picture.w} height={picture.h} decoding="async" />
          </button>
        ) : (
          children
        )}
      </div>
      {shown === null && caption}

      {gallery.length > 0 && (
        <ul className={styles.strip} aria-label="Pictures">
          <li>
            <button
              type="button"
              className={styles.thumb}
              aria-pressed={shown === null}
              aria-label={leadLabel === '3D' ? 'The one you can turn' : 'The main picture'}
              onClick={() => setShown(null)}
            >
              {leadThumb ? <img src={leadThumb} alt="" loading="lazy" /> : null}
              <span className={styles.badge}>{leadLabel}</span>
            </button>
          </li>
          {gallery.map((image, index) => (
            <li key={image.src}>
              <button
                type="button"
                className={styles.thumb}
                data-kind={image.kind}
                aria-pressed={shown === index}
                aria-label={image.alt || `Picture ${index + 1}`}
                onClick={() => setShown(index)}
              >
                <img src={image.src} alt="" loading="lazy" decoding="async" />
                {image.kind === 'scene' && <span className={styles.badge}>Scene</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {zoomed && picture && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={picture.alt || 'Picture'}
          onClick={() => setZoomed(false)}
        >
          <img src={picture.src} alt={picture.alt} />
          <p>Click anywhere, or Esc, to close</p>
        </div>
      )}
    </>
  );
}
