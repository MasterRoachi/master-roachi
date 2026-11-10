'use client';

import type { FieldSpec } from '@/lib/editor-fields';
import FrontmatterFields from '../FrontmatterFields';
import styles from '../collection.module.css';

// The Pictures tab. His pick, 2026-11-10 (redesign page, Projects and Writing:
// A): the cover, the hero, the images in the body, and an upload, in one place.
//
// The image fields are the same controls they were under Details (pick,
// upload, preview). Below them is every image this entry has uploaded, each
// marked if the body already uses it. Putting one INTO the body stays in the
// Words tab, beside the cursor or the section it goes in: that is where the
// position is known.

export default function PicturesTab({
  fields,
  lines,
  onChange,
  images,
  mine,
  artPrefix,
  body,
  onUpload,
  uploading,
}: {
  fields: readonly FieldSpec[];
  lines: string[];
  onChange: (next: string[]) => void;
  /** Every image the collection may point at. */
  images: readonly string[];
  /** This entry's own images. */
  mine: readonly string[];
  artPrefix: string;
  body: string;
  onUpload?: (file: File, assignTo: string | null) => void;
  uploading: boolean;
}) {
  return (
    <>
      {fields.length > 0 && (
        <FrontmatterFields
          fields={fields}
          lines={lines}
          onChange={onChange}
          images={images}
          onUpload={onUpload}
          uploading={uploading}
        />
      )}

      <section className={styles.gallery} aria-label="This entry’s images">
        <div className={styles.bodyHead}>
          <span className={styles.bodyLabel}>Images for the body</span>
          {onUpload && (
            <label className={styles.uploadButton}>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) onUpload(file, null);
                }}
              />
              <span>{uploading ? 'Converting…' : 'Upload an image'}</span>
            </label>
          )}
        </div>
        {mine.length > 0 ? (
          <ul className={styles.galleryList}>
            {mine.map((path) => (
              <li key={path}>
                <img src={path} alt="" loading="lazy" />
                <span className={styles.galleryName}>{path.replace(artPrefix, '')}</span>
                {body.includes(path) && <span className={styles.galleryUsed}>in the body</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.hint}>
            None yet. Uploaded images are converted to WebP and named after this entry; put one in
            the body from the Words tab.
          </p>
        )}
      </section>
    </>
  );
}
