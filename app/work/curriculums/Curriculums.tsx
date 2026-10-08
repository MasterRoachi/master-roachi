'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  isComplete,
  moduleOnRoute,
  nextLesson,
  overallNext,
  overallProgress,
  progressOf,
  recentlyDone,
  type Curriculum,
  type Module,
} from '@/lib/curriculum';
import { outlineSize, parseOutline } from '@/lib/outline';
import styles from './curriculums.module.css';

// A curriculum is a path, so it is drawn as one: a line down the left with a
// node per module, filled as the module finishes, and the lessons hanging off
// it. How far along the line you are is the thing being asked.
//
// Above that, the headline is NOT the percentage. Opening a course tracker the
// question is never "how many have I done", it is "where was I" — so the next
// unfinished lesson is the largest thing on each card, with the tick next to
// it. Everything else is context for that one line.

const RING = 2 * Math.PI * 20;

function Ring({ percent }: { percent: number }) {
  return (
    <svg className={styles.ring} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="20" className={styles.ringTrack} />
      <circle
        cx="24"
        cy="24"
        r="20"
        className={styles.ringFill}
        // Drawn from the top rather than from three o'clock, which is where a
        // circle starts and nobody reads a dial from.
        strokeDasharray={`${(percent / 100) * RING} ${RING}`}
        transform="rotate(-90 24 24)"
      />
      <text x="24" y="24" className={styles.ringText}>
        {percent}
      </text>
    </svg>
  );
}

export default function Curriculums() {
  const [data, setData] = useState<Curriculum[] | null>(null);
  const [today, setToday] = useState('');
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState<number | null>(null);
  const [outline, setOutline] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [rename, setRename] = useState('');
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [lessonName, setLessonName] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await fetch('/work/api/curriculums', { cache: 'no-store' });
      if (!response.ok) throw new Error(`could not read them (${response.status})`);
      const payload = (await response.json()) as {
        configured: boolean;
        curriculums: Curriculum[];
        today: string;
      };
      setConfigured(payload.configured);
      setData(payload.curriculums ?? []);
      setToday(payload.today ?? '');
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

  /** Inline renaming, which the API has always offered and nothing could reach. */
  function Name({
    kind,
    id,
    children,
    className,
  }: {
    kind: 'curriculum' | 'module' | 'lesson';
    id: number;
    children: string;
    className?: string;
  }) {
    const key = `${kind}:${id}`;
    if (renaming === key) {
      return (
        <input
          autoFocus
          className={styles.renameBox}
          value={rename}
          aria-label={`Rename ${children}`}
          onChange={(event) => setRename(event.target.value)}
          onBlur={() => {
            if (rename.trim() && rename !== children) {
              void act({ action: 'rename', kind, id, name: rename });
            }
            setRenaming(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') {
              setRename(children);
              setRenaming(null);
            }
          }}
        />
      );
    }
    return (
      <span
        className={className}
        title="Double-click to rename"
        onDoubleClick={() => {
          setRename(children);
          setRenaming(key);
        }}
      >
        {children}
      </span>
    );
  }

  function Lessons({ module }: { module: Module }) {
    const moduleProgress = progressOf(module);
    const onRoute = moduleOnRoute(module);
    return (
      <div className={onRoute ? styles.module : styles.moduleOff}>
        <span
          className={
            moduleProgress.total > 0 && moduleProgress.done === moduleProgress.total
              ? styles.nodeDone
              : styles.node
          }
          aria-hidden="true"
        />
        <h3>
          <Name kind="module" id={module.id}>
            {module.name}
          </Name>
          {onRoute ? (
            <span className={styles.moduleCount}>
              {moduleProgress.done}/{moduleProgress.total}
            </span>
          ) : (
            <span className={styles.offBadge}>off route</span>
          )}
          <span className={styles.moveGroup}>
            <button
              type="button"
              className={styles.tiny}
              title="Earlier in this course"
              onClick={() =>
                void act({ action: 'move', kind: 'module', id: module.id, direction: 'up' })
              }
            >
              ↑
            </button>
            <button
              type="button"
              className={styles.tiny}
              title="Later in this course"
              onClick={() =>
                void act({ action: 'move', kind: 'module', id: module.id, direction: 'down' })
              }
            >
              ↓
            </button>
          </span>
          {/* A fork in a course is a section, so the whole module goes on or
              off at once — nobody switches forty lessons one at a time. */}
          <button
            type="button"
            className={styles.tiny}
            title={onRoute ? 'Take this module off the route' : 'Put this module on the route'}
            onClick={() =>
              void act({ action: 'set-route', module_id: module.id, on: !onRoute })
            }
          >
            {onRoute ? '⊘' : '⊕'}
          </button>
          <button
            type="button"
            className={styles.tiny}
            title="Add a lesson to this module"
            onClick={() => {
              setAddingTo(addingTo === module.id ? null : module.id);
              setLessonName('');
            }}
          >
            +
          </button>
          <button
            type="button"
            className={styles.tiny}
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
          {module.lessons.map((lesson) => {
            const lessonOn = lesson.on_route !== 0;
            return (
              <li key={lesson.id} className={lessonOn ? undefined : styles.lessonOff}>
                <label>
                  <input
                    type="checkbox"
                    checked={lesson.done_on !== null}
                    onChange={() => void act({ action: 'toggle-lesson', id: lesson.id })}
                  />
                  <Name
                    kind="lesson"
                    id={lesson.id}
                    className={lesson.done_on ? styles.doneLesson : undefined}
                  >
                    {lesson.name}
                  </Name>
                </label>
                {lesson.done_on && <span className={styles.when}>{lesson.done_on}</span>}
                {/* Skipped work stays visible. Hiding it would make the route
                    unreviewable — the point is to see what is being left out
                    and be able to change your mind. */}
                <button
                  type="button"
                  className={styles.tiny}
                  title={lessonOn ? 'Take off the route' : 'Put on the route'}
                  onClick={() => void act({ action: 'set-route', id: lesson.id, on: !lessonOn })}
                >
                  {lessonOn ? '⊘' : '⊕'}
                </button>
                <button
                  type="button"
                  className={styles.tiny}
                  title="Remove this lesson"
                  onClick={() => void act({ action: 'remove', kind: 'lesson', id: lesson.id })}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>

        {/* add-lesson: offered by the API from the start, and until now
            unreachable — the only way a lesson got in was the bulk import. */}
        {addingTo === module.id && (
          <form
            className={styles.inlineAdd}
            onSubmit={(event) => {
              event.preventDefault();
              if (!lessonName.trim()) return;
              void act({ action: 'add-lesson', module_id: module.id, name: lessonName }).then(
                (ok) => {
                  if (ok) setLessonName('');
                },
              );
            }}
          >
            <input
              autoFocus
              value={lessonName}
              placeholder="Lesson name"
              aria-label="Lesson name"
              onChange={(event) => setLessonName(event.target.value)}
            />
            <button type="submit" disabled={!lessonName.trim()}>
              Add
            </button>
            <button type="button" onClick={() => setAddingTo(null)}>
              Done
            </button>
          </form>
        )}
      </div>
    );
  }

  const active = data.filter((c) => c.status === 'active');
  const shelved = data.filter((c) => c.status !== 'active');

  function Card({ curriculum }: { curriculum: Curriculum }) {
    const progress = progressOf(curriculum);
    const next = nextLesson(curriculum);
    const complete = isComplete(curriculum);
    const recent = recentlyDone(curriculum, today);
    const expanded = open.has(curriculum.id);

    return (
      <section className={styles.card} data-status={curriculum.status}>
        <header>
          <Ring percent={progress.percent} />

          <div className={styles.headText}>
            <h2>
              <Name kind="curriculum" id={curriculum.id}>
                {curriculum.name}
              </Name>
            </h2>
            <p className={styles.meta}>
              {progress.done} of {progress.total} on route
              {progress.skipped > 0 && (
                <span className={styles.skipped}>{progress.skipped} skipped</span>
              )}
              {progress.total > 0 && recent > 0 && (
                <span className={styles.recent}>{recent} in a fortnight</span>
              )}
              {progress.total > 0 && recent === 0 && !complete && (
                <span className={styles.stalled}>nothing in a fortnight</span>
              )}
            </p>
            {curriculum.source && <p className={styles.source}>{curriculum.source}</p>}
          </div>

          <div className={styles.headControls}>
            {/* The order of the curriculums IS the route through all of them,
                so these arrows decide what comes next overall. */}
            <span className={styles.moveGroup}>
              <button
                type="button"
                className={styles.tiny}
                title="Earlier in the overall route"
                onClick={() =>
                void act({ action: 'move', kind: 'curriculum', id: curriculum.id, direction: 'up' })
              }
              >
                ↑
              </button>
              <button
                type="button"
                className={styles.tiny}
                title="Later in the overall route"
                onClick={() =>
                void act({ action: 'move', kind: 'curriculum', id: curriculum.id, direction: 'down' })
              }
              >
                ↓
              </button>
            </span>
            <select
              value={curriculum.status}
              aria-label={`Status of ${curriculum.name}`}
              onChange={(event) =>
                void act({ action: 'set-status', id: curriculum.id, status: event.target.value })
              }
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="done">Done</option>
            </select>
            <button
              type="button"
              className={styles.tiny}
              title="Remove, with every module and lesson in it"
              onClick={() => {
                if (confirm(`Remove "${curriculum.name}" and all ${progress.total} lessons?`)) {
                  void act({ action: 'remove', kind: 'curriculum', id: curriculum.id });
                }
              }}
            >
              ×
            </button>
          </div>
        </header>

        {/* The headline. Not the percentage — the question on opening this is
            "where was I", and this is the answer with the tick beside it. */}
        {next ? (
          <div className={styles.next}>
            <button
              type="button"
              className={styles.nextTick}
              aria-label={`Mark ${next.lesson.name} done`}
              onClick={() => void act({ action: 'toggle-lesson', id: next.lesson.id })}
            />
            <span>
              <span className={styles.nextLabel}>Next</span>
              <strong>{next.lesson.name}</strong>
              <span className={styles.nextIn}>in {next.module.name}</span>
            </span>
          </div>
        ) : (
          <div className={styles.next}>
            <span>
              <strong>
                {progress.total === 0
                  ? 'Nothing in it yet — paste an outline below.'
                  : 'Every lesson done.'}
              </strong>
            </span>
          </div>
        )}

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
          {expanded
            ? 'Hide the path'
            : `Show the path — ${curriculum.modules.length} module${
                curriculum.modules.length === 1 ? '' : 's'
              }`}
        </button>

        {expanded && (
          <div className={styles.path}>
            {curriculum.modules.map((module) => (
              <Lessons key={module.id} module={module} />
            ))}

            {importing === curriculum.id ? (
              <div className={styles.importer}>
                <textarea
                  value={outline}
                  onChange={(event) => setOutline(event.target.value)}
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
                      void act({
                        action: 'import',
                        curriculum_id: curriculum.id,
                        outline,
                      }).then((ok) => {
                        if (ok) {
                          setOutline('');
                          setImporting(null);
                        }
                      })
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
                      void act({
                        action: 'add-module',
                        curriculum_id: curriculum.id,
                        name: moduleName,
                      });
                    }
                  }}
                >
                  Add a module
                </button>
              </p>
            )}
          </div>
        )}
      </section>
    );
  }

  const whole = overallProgress(data);
  const upNext = overallNext(data);

  return (
    <div className={styles.page}>
      {error && <p className={styles.warn}>{error}</p>}

      {/* The route through all the routes: one next thing across everything,
          in the order the curriculums are in. */}
      {data.length > 0 && (
        <div className={styles.overall}>
          <p className={styles.overallHead}>
            <span>Up next</span>
            <span className={styles.overallCount}>
              {whole.done} of {whole.total} across {active.length} active
            </span>
          </p>

          {upNext ? (
            <div className={styles.overallNext}>
              <button
                type="button"
                className={styles.nextTick}
                aria-label={`Mark ${upNext.lesson.name} done`}
                onClick={() => void act({ action: 'toggle-lesson', id: upNext.lesson.id })}
              />
              <span>
                <strong>{upNext.lesson.name}</strong>
                <span className={styles.nextIn}>
                  {upNext.curriculum.name} › {upNext.module.name}
                </span>
              </span>
            </div>
          ) : (
            <div className={styles.overallNext}>
              <span>
                <strong>
                  {active.length === 0
                    ? 'Nothing active.'
                    : 'Every route finished.'}
                </strong>
              </span>
            </div>
          )}
        </div>
      )}

      {active.map((curriculum) => (
        <Card key={curriculum.id} curriculum={curriculum} />
      ))}

      {shelved.length > 0 && (
        <>
          <h2 className={styles.shelvedHead}>Paused and finished</h2>
          {shelved.map((curriculum) => (
            <Card key={curriculum.id} curriculum={curriculum} />
          ))}
        </>
      )}

      {data.length === 0 && (
        <p className={styles.empty}>
          Nothing being studied yet. Add a curriculum below, then open it and paste the course
          outline — a section per line with its lessons indented under it.
        </p>
      )}

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
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source — a URL, a book, a syllabus" aria-label="Source" />
        <button type="submit" disabled={!name.trim()}>
          Add
        </button>
      </form>
    </div>
  );
}
