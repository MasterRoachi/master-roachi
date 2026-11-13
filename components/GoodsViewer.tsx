'use client';

import { useEffect, useRef } from 'react';
import { Box3, TextureLoader, Vector3 } from 'three';
import type { FlatGood } from '@/lib/models';
import { buildGood, liesFlat } from './goods';
import { createTurntable } from './turntable';
import styles from './ShirtViewer.module.css';

// A poster, canvas, button or mat that can be turned, built to the product's
// own size with its print file as the picture. The shirt's sibling: the same
// stage (./turntable), the same flat picture underneath until it is ready,
// the same fall-back to that picture where there is no WebGL.

export default function GoodsViewer({ good, alt }: { good: FlatGood; alt?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const stage = createTurntable(host, {
      className: styles.canvas,
      // A mat or a puzzle lies on a desk: tipped back so it reads as one.
      tilt: liesFlat(good.kind) ? 0.75 : 0,
      // Flat things show their back as an edge-on line half the way round,
      // so they swing less far than a shirt does.
      limit: Math.PI * 0.75,
      drift: 0.42,
    });
    if (!stage) return;
    let disposed = false;

    new TextureLoader().load(
      good.texture,
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.anisotropy = stage.renderer.capabilities.getMaxAnisotropy();
        stage.keep(texture);
        const thing = buildGood(good, texture, (d) => stage.keep(d));
        if (!thing) return;
        stage.pivot.add(thing);
        const box = new Box3().setFromObject(thing);
        thing.position.sub(box.getCenter(new Vector3()));
        stage.fit(box.getSize(new Vector3()));
        stage.ready();
      },
      undefined,
      // No texture, no viewer: the flat picture underneath stays.
      () => {},
    );

    return () => {
      disposed = true;
      stage.dispose();
    };
  }, [good]);

  return <div ref={hostRef} className={styles.host} role="img" aria-label={alt || 'The product, which can be turned'} />;
}
