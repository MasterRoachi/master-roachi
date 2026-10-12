'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  overallNext,
  progressOf,
  type Curriculum,
  type Lesson,
  type Module,
} from '@/lib/curriculum';
import { cardFor, stageCardFor } from '@/lib/curriculum-card';
import styles from './curriculums.module.css';

// A deck of cards, one per curriculum.
//
// It was a column of wide cards each carrying a ring, a count, a fortnight
// figure, a source line and the next lesson. All of that was true and it meant
// the page answered five questions at once, none of them the one being asked.
// His design instead: a deck, a card per curriculum showing only its progress
// and its name, and everything else reached by going INTO it — stages fan out,
// a stage opens to its lessons, a lesson opens its detail beside it.
//
// So the information is the same and the page is a path through it rather than
// a wall of it. Three levels, three depths of card, and at most two cards
// side by side at any time.
//
// A card's colour comes from its name (lib/curriculum-card.ts), derived rather
// than stored, so a new curriculum has an identity without anyone choosing one.

/** Playing-card proportions, give or take. The deck reads as a deck or not. */
const RING = 2 * Math.PI * 20;

function Ring({ percent, accent }: { percent: number; accent: string }) {
  return (
    <svg className={styles.ring} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="20" className={styles.ringTrack} />
      <circle
        cx="24"
        cy="24"
        r="20"
        className={styles.ringFill}
        stroke={accent}
        // From the top, not from three o'clock, which is where a circle starts
        // and nobody reads a dial from.
        strokeDasharray={`${(percent / 100) * RING} ${RING}`}
        transform="rotate(-90 24 24)"
      />
      <text x="24" y="24" className={styles.ringText}>
        {percent}
      </text>
    </svg>
  );
}

/** Status cycles rather than opening a menu: three values, one button. */
const NEXT_STATUS: Record<string, 'active' | 'paused' | 'done'> = {
  active: 'paused',
  paused: 'done',
  done: 'active',
};

const STATUS_MARK: Record<string, string> = {
  active: '▶',
  paused: '॥',
  done: '✓',
};

export default function Curriculums() {
  const [data, setData] = useState<Curriculum[] | null>(null);
  const [today, setToday] = useState('');
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openCurriculum, setOpenCurriculum] = useState<number | null>(null);
  const [openStage, setOpenStage] = useState<number | null>(null);
  /** Which lesson's detail card is open beside the stage. */
  const [detailFor, setDetailFor] = useState<number | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [detailDraft, setDetailDraft] = useState('');
  const [editingDetail, setEditingDetail] = useState(false);
  const [search, setSearch] = useState('');
  /** A tick can be back-dated; the API refuses a day that has not happened. */
  const [tickDay, setTickDay] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [rename, setRename] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const centre = useRef<HTMLDivElement | null>(null);

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
      setTickDay((before) => before || payload.today || '');
      setError(null);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not read them.');
      setData([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(body: Record<string, unknown>) {
    try {
      const response = await fetch('/work/api/curriculums', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        repoOwned?: boolean;
        committed?: string | null;
      };
      if (!response.ok) {
        setError(result.error ?? `that did not work (${response.status})`);
        return null;
      }
      setError(null);
      await load();
      return result;
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'That did not work.');
      return null;
    }
  }

  /* Everything is found from the data rather than held in state beside it, so
   * a reload cannot leave the open card pointing at something that has gone. */
  const curriculums = data ?? [];
  const current = curriculums.find((one) => one.id === openCurriculum) ?? null;
  const stage = current?.modules.find((one) => one.id === openStage) ?? null;
  const lesson = stage?.lessons.find((one) => one.id === detailFor) ?? null;

  /* Paused and done go to the back of the deck, and are visually distinct.
   * Within each group the stored order stands — it is the route through all
   * the routes, and he does not want to reorder it from here. */
  const deck = useMemo(() => {
    const rank = (one: Curriculum) => (one.status === 'active' ? 0 : one.status === 'paused' ? 1 : 2);
    return [...curriculums].sort((a, b) => rank(a) - rank(b));
  }, [curriculums]);

  const upNext = useMemo(() => overallNext(curriculums), [curriculums]);

  /** Every lesson, flattened, for the search. 708 of them and no place to look. */
  const hits = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length < 2) return [];
    const found: { curriculum: Curriculum; module: Module; lesson: Lesson }[] = [];
    for (const one of curriculums) {
      for (const module of one.modules) {
        for (const each of module.lessons) {
          if (each.name.toLowerCase().includes(term)) {
            found.push({ curriculum: one, module, lesson: each });
          }
        }
      }
    }
    return found.slice(0, 40);
  }, [curriculums, search]);

  function openTo(curriculumId: number, moduleId: number, lessonId?: number) {
    setOpenCurriculum(curriculumId);
    setOpenStage(moduleId);
    setDetailFor(lessonId ?? null);
    setSourcesOpen(false);
    setSearch('');
    requestAnimationFrame(() => centre.current?.scrollIntoView({ block: 'center' }));
  }

  function startDetail(target: Lesson) {
    setDetailFor(target.id);
    setSourcesOpen(false);
    setDetailDraft(target.detail ?? '');
    setEditingDetail(false);
  }

  if (data === null) return <p className={styles.status}>Reading them…</p>;

  if (!configured) {
    return (
      <p className={styles.status}>
        Not connected. The D1 database is not bound — see <code>wrangler.jsonc</code>.
      </p>
    );
  }

  return (
    <div className={styles.page}>
      {error && <p className={styles.warn}>{error}</p>}

      {/* The route through all the routes: one next thing across everything,
          in the order the curriculums sit in. The only number on the page
          that is not a percentage in a ring. */}
      {upNext && (
        <button
          type="button"
          className={styles.upNext}
          onClick={() => openTo(upNext.curriculum.id, upNext.module.id, upNext.lesson.id)}
        >
          <span className={styles.upNextLabel}>Up next</span>
          <span className={styles.upNextName}>{upNext.lesson.name}</span>
          <span className={styles.upNextIn}>
            {upNext.curriculum.name} › {upNext.module.name}
          </span>
        </button>
      )}

      <div className={styles.searchRow}>
        <input
          type="search"
          className={styles.search}
          value={search}
          placeholder="Find a lesson"
          aria-label="Find a lesson"
          onChange={(event) => setSearch(event.target.value)}
        />
        {hits.length > 0 && (
          <ul className={styles.hits}>
            {hits.map((hit) => (
              <li key={hit.lesson.id}>
                <button
                  type="button"
                  onClick={() => openTo(hit.curriculum.id, hit.module.id, hit.lesson.id)}
                >
                  <span>{hit.lesson.name}</span>
                  <span className={styles.hitIn}>
                    {hit.curriculum.name} › {hit.module.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --- the deck ------------------------------------------------------ */}
      <div className={styles.deck}>
        {deck.map((one, at) => {
          const look = cardFor(one.name);
          const progress = progressOf(one);
          const isOpen = one.id === openCurriculum;

          return (
            <div
              key={one.id}
              className={`${styles.cardSlot} ${isOpen ? styles.cardSlotOpen : ''}`}
              // Each card sits slightly right and down of the one in front, so
              // the stack reads as a deck. Hovering or focusing lifts a card
              // clear of the ones over it — without that, only the front
              // card's face is reachable.
              style={{ '--at': at } as React.CSSProperties}
            >
              <div
                className={`${styles.card} ${one.status !== 'active' ? styles.shelved : ''}`}
                style={
                  {
                    '--card-bg': look.background,
                    '--card-bg2': look.background2,
                    '--card-accent': look.accent,
                  } as React.CSSProperties
                }
              >
                <button
                  type="button"
                  className={styles.cardFace}
                  aria-expanded={isOpen}
                  onClick={() => {
                    setOpenCurriculum(isOpen ? null : one.id);
                    setOpenStage(null);
                    setDetailFor(null);
                    setSourcesOpen(false);
                  }}
                >
                  <Ring percent={progress.percent} accent={look.accent} />
                  {renaming === `curriculum:${one.id}` ? (
                    <input
                      className={styles.renameOnCard}
                      value={rename}
                      autoFocus
                      aria-label={`Rename ${one.name}`}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => setRename(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && rename.trim()) {
                          void act({ action: 'rename', kind: 'curriculum', id: one.id, name: rename });
                          setRenaming(null);
                        }
                        if (event.key === 'Escape') setRenaming(null);
                      }}
                      onBlur={() => setRenaming(null)}
                    />
                  ) : (
                    <span
                      className={styles.cardName}
                      onDoubleClick={(event) => {
                        event.stopPropagation();
                        setRenaming(`curriculum:${one.id}`);
                        setRename(one.name);
                      }}
                      title="Double-click to rename"
                    >
                      {one.name}
                    </span>
                  )}
                </button>

                {/* One button, three states, cycling. */}
                <button
                  type="button"
                  className={styles.statusDot}
                  aria-label={`${one.name} is ${one.status} — click to change`}
                  title={`${one.status} → ${NEXT_STATUS[one.status]}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    void act({
                      action: 'set-status',
                      id: one.id,
                      status: NEXT_STATUS[one.status] ?? 'active',
                    });
                  }}
                >
                  {STATUS_MARK[one.status] ?? '▶'}
                </button>
              </div>
            </div>
          );
        })}

        {/* A blank card at the back of the deck, so adding looks like the
            thing it adds. */}
        <div className={styles.cardSlot} style={{ '--at': deck.length } as React.CSSProperties}>
          {adding === 'curriculum' ? (
            <form
              className={`${styles.card} ${styles.addCard}`}
              onSubmit={(event) => {
                event.preventDefault();
                if (!draft.trim()) return;
                void act({ action: 'add-curriculum', name: draft }).then(() => {
                  setDraft('');
                  setAdding(null);
                });
              }}
            >
              <input
                value={draft}
                autoFocus
                placeholder="Curriculum"
                aria-label="New curriculum name"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Escape' && setAdding(null)}
              />
              <button type="submit" disabled={!draft.trim()}>
                Add
              </button>
            </form>
          ) : (
            <button
              type="button"
              className={`${styles.card} ${styles.addCard}`}
              onClick={() => {
                setAdding('curriculum');
                setDraft('');
              }}
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* --- the stages, fanned out from the card that was clicked --------- */}
      {current && (
        <div className={styles.fan}>
          {current.modules.map((module, at) => {
            const look = stageCardFor(current.name, at);
            const isOpen = module.id === openStage;
            return (
              <button
                key={module.id}
                type="button"
                className={`${styles.stageCard} ${isOpen ? styles.stageOpen : ''}`}
                style={
                  {
                    '--card-bg': look.background,
                    '--card-bg2': look.background2,
                    '--card-accent': look.accent,
                    '--at': at,
                  } as React.CSSProperties
                }
                onClick={() => {
                  setOpenStage(isOpen ? null : module.id);
                  setDetailFor(null);
                  setSourcesOpen(false);
                  if (!isOpen) {
                    requestAnimationFrame(() =>
                      centre.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
                    );
                  }
                }}
              >
                <span className={styles.stageNumber}>{at + 1}</span>
                <span className={styles.stageName}>{module.name}</span>
              </button>
            );
          })}

          {adding === `module:${current.id}` ? (
            <form
              className={`${styles.stageCard} ${styles.addCard}`}
              onSubmit={(event) => {
                event.preventDefault();
                if (!draft.trim()) return;
                void act({ action: 'add-module', curriculum_id: current.id, name: draft }).then(() => {
                  setDraft('');
                  setAdding(null);
                });
              }}
            >
              <input
                value={draft}
                autoFocus
                placeholder="Stage"
                aria-label="New stage name"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Escape' && setAdding(null)}
              />
              <button type="submit" disabled={!draft.trim()}>
                Add
              </button>
            </form>
          ) : (
            <button
              type="button"
              className={`${styles.stageCard} ${styles.addCard}`}
              onClick={() => {
                setAdding(`module:${current.id}`);
                setDraft('');
              }}
            >
              +
            </button>
          )}
        </div>
      )}

      {/* --- the open stage, centred, with its lessons --------------------- */}
      <div className={styles.centre} ref={centre}>
        {current && stage && (
          <section
            className={styles.open}
            style={
              {
                '--card-accent': cardFor(current.name).accent,
              } as React.CSSProperties
            }
          >
            <header className={styles.openHead}>
              <h2>
                {renaming === `module:${stage.id}` ? (
                  <input
                    className={styles.renameInline}
                    value={rename}
                    autoFocus
                    aria-label={`Rename ${stage.name}`}
                    onChange={(event) => setRename(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && rename.trim()) {
                        void act({ action: 'rename', kind: 'module', id: stage.id, name: rename });
                        setRenaming(null);
                      }
                      if (event.key === 'Escape') setRenaming(null);
                    }}
                    onBlur={() => setRenaming(null)}
                  />
                ) : (
                  <span
                    onDoubleClick={() => {
                      setRenaming(`module:${stage.id}`);
                      setRename(stage.name);
                    }}
                    title="Double-click to rename"
                  >
                    {stage.name}
                  </span>
                )}
              </h2>
              <button
                type="button"
                className={styles.closeOpen}
                onClick={() => {
                  setOpenStage(null);
                  setDetailFor(null);
                  setSourcesOpen(false);
                }}
              >
                Close
              </button>
            </header>

            {/* Ticking can be back-dated, which is what a date column is for.
                The API refuses a day that has not happened. */}
            <p className={styles.dayRow}>
              <label htmlFor="tick-day">Ticking as</label>
              <input
                id="tick-day"
                type="date"
                value={tickDay}
                max={today}
                onChange={(event) => setTickDay(event.target.value || today)}
              />
              {tickDay !== today && (
                <button type="button" onClick={() => setTickDay(today)}>
                  today
                </button>
              )}
            </p>

            <ul className={styles.lessons}>
              {stage.lessons.map((each) => (
                <li
                  key={each.id}
                  className={`${each.done_on ? styles.doneLesson : ''} ${
                    each.on_route ? '' : styles.offRoute
                  }`}
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={each.done_on !== null}
                      onChange={() =>
                        void act({
                          action: 'toggle-lesson',
                          id: each.id,
                          ...(tickDay && tickDay !== today ? { day: tickDay } : {}),
                        })
                      }
                    />
                    {renaming === `lesson:${each.id}` ? (
                      <input
                        className={styles.renameInline}
                        value={rename}
                        autoFocus
                        aria-label={`Rename ${each.name}`}
                        onChange={(event) => setRename(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && rename.trim()) {
                            void act({ action: 'rename', kind: 'lesson', id: each.id, name: rename });
                            setRenaming(null);
                          }
                          if (event.key === 'Escape') setRenaming(null);
                        }}
                        onBlur={() => setRenaming(null)}
                      />
                    ) : (
                      <span
                        onDoubleClick={() => {
                          setRenaming(`lesson:${each.id}`);
                          setRename(each.name);
                        }}
                        title="Double-click to rename"
                      >
                        {each.name}
                      </span>
                    )}
                  </label>

                  <span className={styles.lessonButtons}>
                    <button
                      type="button"
                      className={each.id === detailFor && !sourcesOpen ? styles.activeButton : undefined}
                      onClick={() => startDetail(each)}
                    >
                      details
                    </button>
                    <button
                      type="button"
                      className={sourcesOpen ? styles.activeButton : undefined}
                      onClick={() => {
                        setSourcesOpen(true);
                        setDetailFor(null);
                      }}
                    >
                      sources
                    </button>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => {
                        if (!confirm(`Delete “${each.name}”? Its tick goes with it.`)) return;
                        if (detailFor === each.id) setDetailFor(null);
                        void act({ action: 'remove', kind: 'lesson', id: each.id });
                      }}
                    >
                      delete
                    </button>
                  </span>
                </li>
              ))}

              <li className={styles.addLesson}>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!draft.trim()) return;
                    void act({ action: 'add-lesson', module_id: stage.id, name: draft }).then(() =>
                      setDraft(''),
                    );
                  }}
                >
                  <input
                    value={adding === `lesson:${stage.id}` ? draft : ''}
                    placeholder="+ Add a lesson"
                    aria-label="New lesson name"
                    onFocus={() => setAdding(`lesson:${stage.id}`)}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                </form>
              </li>
            </ul>
          </section>
        )}

        {/* --- the detail card, equal size, to the right ------------------- */}
        {current && stage && lesson && !sourcesOpen && (
          <section className={styles.open}>
            <header className={styles.openHead}>
              <h2>{lesson.name}</h2>
              <button type="button" className={styles.closeOpen} onClick={() => setDetailFor(null)}>
                Close
              </button>
            </header>

            {editingDetail ? (
              <>
                <textarea
                  className={styles.detailEditor}
                  value={detailDraft}
                  autoFocus
                  aria-label={`What ${lesson.name} teaches`}
                  placeholder="What this teaches. Markdown — ## headings, - bullets, **bold**."
                  onChange={(event) => setDetailDraft(event.target.value)}
                />
                <p className={styles.detailButtons}>
                  <button
                    type="button"
                    onClick={() => {
                      void act({ action: 'set-detail', id: lesson.id, detail: detailDraft }).then(
                        (result) => {
                          setEditingDetail(false);
                          if (result?.repoOwned) {
                            setError(
                              result.committed
                                ? null
                                : 'Saved here, but the repo copy did not commit — the next rebuild will overwrite it.',
                            );
                          }
                        },
                      );
                    }}
                  >
                    Save
                  </button>
                  <button type="button" onClick={() => setEditingDetail(false)}>
                    Cancel
                  </button>
                </p>
              </>
            ) : (
              <>
                <div className={styles.detailBody}>
                  {lesson.detail ? (
                    <Markdown source={lesson.detail} />
                  ) : (
                    <p className={styles.nothingYet}>
                      Nothing written. For a transcribed curriculum that is correct — the substance
                      is in the resource, and the Sources card is where it lives.
                    </p>
                  )}
                </div>
                <p className={styles.detailButtons}>
                  <button
                    type="button"
                    onClick={() => {
                      setDetailDraft(lesson.detail ?? '');
                      setEditingDetail(true);
                    }}
                  >
                    {lesson.detail ? 'Edit' : 'Write it'}
                  </button>
                  {/* The route decision lives with the lesson's substance
                      rather than on a row pressed constantly. */}
                  <label className={styles.routeSwitch}>
                    <input
                      type="checkbox"
                      checked={lesson.on_route === 1}
                      onChange={() =>
                        void act({
                          action: 'set-route',
                          id: lesson.id,
                          on: lesson.on_route !== 1,
                        })
                      }
                    />
                    on the route
                  </label>
                </p>
              </>
            )}
          </section>
        )}

        {/* --- the sources card, the same size ----------------------------- */}
        {current && stage && sourcesOpen && (
          <section className={styles.open}>
            <header className={styles.openHead}>
              <h2>{current.name} — sources</h2>
              <button type="button" className={styles.closeOpen} onClick={() => setSourcesOpen(false)}>
                Close
              </button>
            </header>

            <div className={styles.detailBody}>
              {current.sources && current.sources.length > 0 ? (
                <ul className={styles.sourceList}>
                  {current.sources.map((source) => (
                    <li key={source.id}>
                      <span className={styles.sourceTitle}>
                        {source.url ? (
                          <a href={source.url} target="_blank" rel="noreferrer">
                            {source.title}
                          </a>
                        ) : (
                          source.title
                        )}
                      </span>
                      {source.note && <span className={styles.sourceNote}>{source.note}</span>}
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => {
                          if (!confirm(`Remove “${source.title}”?`)) return;
                          void act({ action: 'remove-source', id: source.id });
                        }}
                      >
                        remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.nothingYet}>Nothing recorded yet.</p>
              )}
            </div>

            <form
              className={styles.addSource}
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const title = (form.elements.namedItem('title') as HTMLInputElement).value.trim();
                const url = (form.elements.namedItem('url') as HTMLInputElement).value.trim();
                const note = (form.elements.namedItem('note') as HTMLInputElement).value.trim();
                if (!title) return;
                void act({ action: 'add-source', curriculum_id: current.id, title, url, note }).then(
                  () => form.reset(),
                );
              }}
            >
              <input name="title" placeholder="Title — a book, a course, a syllabus" aria-label="Source title" />
              <input name="url" placeholder="URL, if it has one" aria-label="Source URL" />
              <input name="note" placeholder="Note — an edition, a volume, a shelf" aria-label="Source note" />
              <button type="submit">Add source</button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}

/**
 * Lesson detail, rendered.
 *
 * It is authored as Markdown — bullets, headings, the odd code span — and the
 * page used to print the string raw, which made the substance of a lesson a
 * wall of asterisks. That is the opposite of the point: the whole reason
 * `detail` exists is that a name "tells me what is learned conceptually, but
 * what wrist level means, what posture to use is a mystery".
 *
 * Rendered here rather than with the site's MDX pipeline, which is a server
 * component compiled at build and cannot run in the browser. A small subset is
 * enough for what these actually contain, and anything it does not understand
 * comes out as its own paragraph rather than as nothing.
 */
function Markdown({ source }: { source: string }) {
  const blocks = source.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <>
      {blocks.map((block, at) => {
        const heading = /^(#{1,4})\s+(.*)$/.exec(block);
        if (heading) {
          const level = Math.min(6, heading[1].length + 2);
          const Tag = `h${level}` as 'h3';
          return (
            <Tag key={at} className={styles.detailHeading}>
              {inline(heading[2])}
            </Tag>
          );
        }

        // A list, where every line of the block is a bullet.
        const lines = block.split('\n');
        if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
          return (
            <ul key={at} className={styles.detailList}>
              {lines.map((line, index) => (
                <li key={index}>{inline(line.replace(/^\s*[-*]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
          return (
            <ol key={at} className={styles.detailList}>
              {lines.map((line, index) => (
                <li key={index}>{inline(line.replace(/^\s*\d+[.)]\s+/, ''))}</li>
              ))}
            </ol>
          );
        }

        return <p key={at}>{inline(block)}</p>;
      })}
    </>
  );
}

/**
 * Bold, italic and code within a line.
 *
 * Split rather than replaced into HTML: building a string and injecting it
 * would mean trusting this text, and although it is his own, a renderer that
 * cannot inject is simply a better renderer.
 */
function inline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let at = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > at) out.push(text.slice(at, match.index));
    const token = match[0];
    if (token.startsWith('**')) out.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith('`')) out.push(<code key={match.index}>{token.slice(1, -1)}</code>);
    else out.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    at = match.index + token.length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}
