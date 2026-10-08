'use client';

import { useCallback, useEffect, useState } from 'react';
import { outlineSize, parseOutline } from '@/lib/outline';
import styles from './curriculums.module.css';

// Three levels, with the counts that say how far through each one is.
//
// The import previews before it writes. The parser cannot tell a flat
// numbered list of lessons from a list of numbered sections — that ambiguity
// is in the text, not in the code — so the fix is to show what it made of the
// paste and let him look before two hundred rows exist. The same parser runs
// here and on the server, so the preview is what will actually be created.

interface Lesson {
  id: number;
  name: string;
  done_on: string | null;
}

interface Module {
  id: number;
  name: string;
  lessons: Lesson[];
}

interface Curriculum {
  id: number;
  name: string;
  source: string | null;
  status: 'active' | 'paused' | 'done';
  modules: Module[];
}

function counts(curriculum: Curriculum) {
  const lessons = curriculum.modules.flatMap((module) => module.lessons);
  return { done: lessons.filter((l) => l.done_on).length, total: lessons.length };
}

export default function Curriculums() {
  const [data, setData] = useState<Curriculum[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [importing, setImporting] = useState<number | null>(null);
  const [outline, setOutline] = useState('');
  const [open, setOpen] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    try {
      const response = await fetch('/work/api/curriculums', { cache: 'no-store' });
      if (!response.ok) throw new Error(`could not read them (${response.status})`);
      const payload = (await response.json()) as {
        configured: boolean;
        curriculums: Curriculum[];
      };
      setConfigured(payload.configured);
      setData(payload.curriculums ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read them.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(body: Record<string, unknown>) {
    const response = await fetch('/work/api/curriculums', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const { error: why } = (await response.json().catch(() => ({}))) as { error?: string };
      setError(why ?? `Failed (${response.status}).`);
      return false;
    }
    setError(null);
    await load();
    return true;
  }

  if (error && !data) return <p className={styles.status}>{error}</p>;
  if (!data) return <p className={styles.status}>Reading…</p>;
  if (!configured) {
    return (
      <p className={styles.status}>
        Not set up — the <code>DB</code> binding is missing.
      </p>
    );
  }

  const preview = outline.trim() ? parseOutline(outline) : [];
  const previewSize = outlineSize(preview);

  return (
    <>
      {error && <p className={styles.warn}>{error}</p>}

      <form
        className={styles.add}
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          void act({ action: 'add-curriculum', name, source }).then((ok) => {
            if (ok) {
              setName('');
              setSource('');
            }
          });
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Curriculum" aria-label="Curriculum name" />
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source (optional)" aria-label="Source" />
        <button type="submit" disabled={!name.trim()}>
          Add
        </button>
      </form>

      {data.length === 0 && <p className={styles.status}>Nothing being studied yet.</p>}

      {data.map((curriculum) => {
        const { done, total } = counts(curriculum);
        const expanded = open.has(curriculum.id);

        return (
          <section key={curriculum.id} className={styles.curriculum} data-status={curriculum.status}>
            <header>
              <button
                type="button"
                className={styles.disclose}
                aria-expanded={expanded}
                onClick={() => {
                  const next = new Set(open);
                  if (expanded) next.delete(curriculum.id);
                  else next.add(curriculum.id);
                  setOpen(next);
                }}
              >
                {expanded ? '−' : '+'}
              </button>

              <h2>{curriculum.name}</h2>

              {/* The number first, because "41 of 112" is the question being
                  asked and a bar alone cannot be read precisely. */}
              <span className={styles.progress}>
                {total === 0 ? 'empty' : `${done} of ${total}`}
                {total > 0 && (
                  <span className={styles.bar}>
                    <span style={{ width: `${Math.round((done / total) * 100)}%` }} />
                  </span>
                )}
              </span>

              <select
                value={curriculum.status}
                aria-label={`Status of ${curriculum.name}`}
                onChange={(e) => void act({ action: 'set-status', id: curriculum.id, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="done">Done</option>
              </select>

              <button
                type="button"
                className={styles.remove}
                title="Remove, with every module and lesson in it"
                onClick={() => {
                  if (confirm(`Remove "${curriculum.name}" and all ${total} lessons?`)) {
                    void act({ action: 'remove', kind: 'curriculum', id: curriculum.id });
                  }
                }}
              >
                ×
              </button>
            </header>

            {curriculum.source && <p className={styles.source}>{curriculum.source}</p>}

            {expanded && (
              <>
                {curriculum.modules.map((module) => {
                  const moduleDone = module.lessons.filter((l) => l.done_on).length;
                  return (
                    <div key={module.id} className={styles.module}>
                      <h3>
                        {module.name}
                        <span className={styles.moduleCount}>
                          {moduleDone}/{module.lessons.length}
                        </span>
                        <button
                          type="button"
                          className={styles.remove}
                          title="Remove this module and its lessons"
                          onClick={() => {
                            if (confirm(`Remove "${module.name}"?`)) {
                              void act({ action: 'remove', kind: 'module', id: module.id });
                            }
                          }}
                        >
                          ×
                        </button>
                      </h3>

                      <ul className={styles.lessons}>
                        {module.lessons.map((lesson) => (
                          <li key={lesson.id}>
                            <label>
                              <input
                                type="checkbox"
                                checked={lesson.done_on !== null}
                                onChange={() => void act({ action: 'toggle-lesson', id: lesson.id })}
                              />
                              <span className={lesson.done_on ? styles.doneLesson : undefined}>
                                {lesson.name}
                              </span>
                            </label>
                            {lesson.done_on && <span className={styles.when}>{lesson.done_on}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}

                {importing === curriculum.id ? (
                  <div className={styles.importer}>
                    <textarea
                      value={outline}
                      onChange={(e) => setOutline(e.target.value)}
                      placeholder={'Paste an outline.\n\nSection\n  - lesson\n  - lesson'}
                      aria-label="Outline"
                    />
                    <p className={styles.status}>
                      {preview.length === 0
                        ? 'Nothing recognised yet.'
                        : `${previewSize.modules} module${previewSize.modules === 1 ? '' : 's'}, ${previewSize.lessons} lesson${previewSize.lessons === 1 ? '' : 's'}:`}
                    </p>
                    {preview.length > 0 && (
                      <ul className={styles.preview}>
                        {preview.map((module, i) => (
                          <li key={`${i}-${module.name}`}>
                            <strong>{module.name}</strong>
                            {module.lessons.length > 0 && <> — {module.lessons.join(', ')}</>}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className={styles.importActions}>
                      <button
                        type="button"
                        disabled={preview.length === 0}
                        onClick={() =>
                          void act({ action: 'import', curriculum_id: curriculum.id, outline }).then(
                            (ok) => {
                              if (ok) {
                                setOutline('');
                                setImporting(null);
                              }
                            },
                          )
                        }
                      >
                        Create these
                      </button>
                      <button type="button" onClick={() => setImporting(null)}>
                        Cancel
                      </button>
                    </p>
                  </div>
                ) : (
                  <p className={styles.importActions}>
                    <button type="button" onClick={() => setImporting(curriculum.id)}>
                      Paste an outline
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const moduleName = prompt('Module name');
                        if (moduleName?.trim()) {
                          void act({ action: 'add-module', curriculum_id: curriculum.id, name: moduleName });
                        }
                      }}
                    >
                      Add a module
                    </button>
                  </p>
                )}
              </>
            )}
          </section>
        );
      })}
    </>
  );
}
