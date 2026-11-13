'use client';

import { useState } from 'react';
import { slugify, type Shelf } from '@/lib/product-copy';
import styles from './store.module.css';

// The store's shelves and its artwork collections: add, rename, reorder,
// remove. Added 2026-11-12 with Timon's pieces (BRIEF.md: "the categories and
// the artwork collections are themselves editable there").
//
// A RENAME CHANGES THE NAME AND NEVER THE ID. Products point at the id, so a
// shelf renamed from "Wall art" to "Prints" keeps everything on it, and the
// store's links (/store/artwork/<id>/) keep working. The id is made once, from
// the first name, when the shelf is added.
//
// Removing one that products still point at is allowed and said: those
// products fall back to the store's guess from their name, and the count is
// shown before the button is pressed rather than after.

interface Props<T extends Shelf> {
  title: string;
  noun: string;
  items: T[];
  /** How many products point at each id. */
  uses: Record<string, number>;
  /** Pieces carry an artist; shelves do not. */
  withArtist?: boolean;
  onChange: (items: T[]) => void;
}

export default function ShelvesPanel<T extends Shelf & { artist?: string }>({
  title,
  noun,
  items,
  uses,
  withArtist,
  onChange,
}: Props<T>) {
  const [adding, setAdding] = useState('');
  const newId = slugify(adding);
  const taken = items.some((item) => item.id === newId);

  function update(index: number, patch: Partial<T>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function move(index: number, by: -1 | 1) {
    const next = [...items];
    const to = index + by;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    onChange(next);
  }

  function add() {
    if (!newId || taken) return;
    onChange([...items, { id: newId, name: adding.trim() } as T]);
    setAdding('');
  }

  return (
    <section className={styles.shelves} aria-label={title}>
      <h3 className={styles.shelvesHead}>{title}</h3>
      <ol className={styles.shelfList}>
        {items.map((item, index) => {
          const count = uses[item.id] ?? 0;
          return (
            <li key={item.id} className={styles.shelfRow}>
              <input
                type="text"
                className={styles.line}
                aria-label={`${noun} name`}
                value={item.name}
                onChange={(event) => update(index, { name: event.target.value } as Partial<T>)}
              />
              {withArtist && (
                <input
                  type="text"
                  className={`${styles.line} ${styles.shelfArtist}`}
                  aria-label={`Artist of ${item.name}`}
                  placeholder="Artist"
                  value={item.artist ?? ''}
                  onChange={(event) =>
                    update(index, { artist: event.target.value || undefined } as Partial<T>)
                  }
                />
              )}
              <span className={styles.shelfMeta}>
                {item.id} · {count} product{count === 1 ? '' : 's'}
              </span>
              <span className={styles.move}>
                <button type="button" aria-label={`Move ${item.name} up`} disabled={index === 0} onClick={() => move(index, -1)}>
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Move ${item.name} down`}
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  title={count ? `${count} product${count === 1 ? '' : 's'} will lose this ${noun}` : `Remove`}
                  onClick={() => onChange(items.filter((_, i) => i !== index))}
                >
                  ×
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      <div className={styles.shelfAdd}>
        <input
          type="text"
          className={styles.line}
          aria-label={`New ${noun}`}
          placeholder={`New ${noun}`}
          value={adding}
          onChange={(event) => setAdding(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') add();
          }}
        />
        <button type="button" className={styles.pill} disabled={!newId || taken} onClick={add}>
          Add
        </button>
        {adding && taken && <span className={styles.warn}>{newId} exists</span>}
      </div>
    </section>
  );
}
