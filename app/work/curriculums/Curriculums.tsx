'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  nextPerCurriculum,
  nextStep,
  progressOf,
  type Curriculum,
  type Lesson,
  type Module,
  type Step,
} from '@/lib/curriculum';
import CurriculumIcon from '@/components/CurriculumIcon';
import { GOLD, scatterFor, statusLook } from '@/lib/curriculum-card';
import styles from './curriculums.module.css';

// A deck of cards, and a drill-down through it.
//
// The deck is a CAROUSEL rather than a pile you pick from: arrows move the
// front card, and only the front card is interactive. That is what lets the
// pile be neat — the cards behind are texture, not targets, so they no longer
// each need a visible edge to be clicked on.
//
// Colour is the status and nothing else: white active, gold done, black
// paused. It was per-name, which was handsome, and meant the one thing a
// glance at the deck could not tell you was which courses were running.
//
// Going in is three layers, each dead centre with everything behind it dimmed:
//
//   stages   the curriculum's stages, as cards
//   grid     one stage's lessons, as a near-fullscreen grid of numbers
//   detail   one lesson, with its substance and its buttons
//
// The numbers matter: a stage of thirty lessons is a wall of text, and a grid
// of thirty numbers is a shape you can see the gaps in.

const RING = 2 * Math.PI * 20;

function Ring({ percent, ink, accent }: { percent: number; ink: string; accent: string }) {
  return (
    <svg className={styles.ring} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="20" className={styles.ringTrack} stroke={ink} />
      <circle
        cx="24"
        cy="24"
        r="20"
        className={styles.ringFill}
        stroke={accent}
        // From the top, not three o'clock, which is where a circle starts and
        // nobody reads a dial from.
        strokeDasharray={`${(percent / 100) * RING} ${RING}`}
        transform="rotate(-90 24 24)"
      />
      <text x="24" y="24" className={styles.ringText} fill={ink}>
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

const STATUS_MARK: Record<string, string> = { active: '▶', paused: '॥', done: '✓' };

type Layer = 'stages' | 'grid' | 'detail';

export default function Curriculums() {
  const [data, setData] = useState<Curriculum[] | null>(null);
  const [today, setToday] = useState('');
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Which card is at the front of the deck. */
  const [front, setFront] = useState(0);
  const [layer, setLayer] = useState<Layer | null>(null);
  const [openCurriculum, setOpenCurriculum] = useState<number | null>(null);
  const [openStage, setOpenStage] = useState<number | null>(null);
  const [openLesson, setOpenLesson] = useState<number | null>(null);

  const [detailDraft, setDetailDraft] = useState('');
  const [editingDetail, setEditingDetail] = useState(false);
  const [search, setSearch] = useState('');
  const [tickDay, setTickDay] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [rename, setRename] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  /* The Up next row, held locally so it can refill itself.
   *
   * Seeded with one lesson per active curriculum. Finishing a card takes it
   * out and appends that curriculum's NEXT lesson at the end, which is the
   * behaviour asked for and the reason this is state rather than derived:
   * derived, the replacement would appear where the old one was. */
  const [queue, setQueue] = useState<number[] | null>(null);
  /** Cards mid-flourish: gold, then gone. */
  const [finishing, setFinishing] = useState<Set<number>>(new Set());

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

  const curriculums = data ?? [];

  /* Active first, then paused, then done — so the front of the deck is
   * something in play. Within each group the stored order stands: it is the
   * route through all the routes. */
  const deck = useMemo(() => {
    const rank = (one: Curriculum) =>
      one.status === 'active' ? 0 : one.status === 'paused' ? 1 : 2;
    return [...curriculums].sort((a, b) => rank(a) - rank(b));
  }, [curriculums]);

  /** Rotated so `front` is first, which is all the carousel is. */
  const ordered = useMemo(() => {
    if (deck.length === 0) return deck;
    const at = ((front % deck.length) + deck.length) % deck.length;
    return [...deck.slice(at), ...deck.slice(0, at)];
  }, [deck, front]);

  const current = curriculums.find((one) => one.id === openCurriculum) ?? null;
  const stage = current?.modules.find((one) => one.id === openStage) ?? null;
  const lesson = stage?.lessons.find((one) => one.id === openLesson) ?? null;

  /** Seed the queue once there is data, and whenever the row runs dry. */
  useEffect(() => {
    if (data === null) return;
    setQueue((before) => {
      if (before !== null && before.length > 0) return before;
      return nextPerCurriculum(curriculums).map((step) => step.lesson.id);
    });
  }, [data, curriculums]);

  /** The queue's lessons, resolved against the data on each render. */
  const steps = useMemo(() => {
    if (!queue) return [];
    const byLesson = new Map<number, Step>();
    for (const one of curriculums) {
      one.modules.forEach((module, m) => {
        module.lessons.forEach((each, l) => {
          byLesson.set(each.id, {
            curriculum: one,
            module,
            lesson: each,
            moduleAt: m + 1,
            lessonAt: l + 1,
          });
        });
      });
    }
    return queue.map((id) => byLesson.get(id)).filter((step): step is Step => Boolean(step));
  }, [queue, curriculums]);

  /**
   * Finish a lesson from the Up next row.
   *
   * The card goes gold, fades, and that curriculum's next lesson is appended
   * to the end of the row. The swap waits for the flourish so it is not cut
   * short by the list re-rendering under it.
   */
  function finish(step: Step) {
    setFinishing((before) => new Set(before).add(step.lesson.id));
    const already = new Set(queue ?? []);
    const replacement = nextStep(step.curriculum, already);

    window.setTimeout(() => {
      setQueue((before) => {
        const without = (before ?? []).filter((id) => id !== step.lesson.id);
        return replacement ? [...without, replacement.lesson.id] : without;
      });
      setFinishing((before) => {
        const next = new Set(before);
        next.delete(step.lesson.id);
        return next;
      });
    }, 520);

    void act({
      action: 'toggle-lesson',
      id: step.lesson.id,
      ...(tickDay && tickDay !== today ? { day: tickDay } : {}),
    });
  }

  /* Searching ONE curriculum, not all of them: the thing being looked for is
   * almost always inside the course already open, and Japanese alone is 118
   * lessons across four stages. */
  const hits = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!current || term.length < 2) return [];
    const found: { module: Module; lesson: Lesson; at: number }[] = [];
    for (const module of current.modules) {
      module.lessons.forEach((each, at) => {
        if (each.name.toLowerCase().includes(term)) found.push({ module, lesson: each, at: at + 1 });
      });
    }
    return found.slice(0, 40);
  }, [current, search]);

  /**
   * Go in a layer with a glimpse of the deck on the way.
   *
   * Asked for as "flashes to the curriculum home screen and then brings up
   * the grid". It is a beat of the page underneath between two overlays, which
   * is what stops a dimmed card being replaced by a different dimmed card with
   * nothing to say one closed and another opened.
   */
  function flashTo(next: Layer, set?: () => void) {
    setLayer(null);
    window.setTimeout(() => {
      set?.();
      setLayer(next);
    }, 190);
  }

  function close() {
    setLayer(null);
    setOpenCurriculum(null);
    setOpenStage(null);
    setOpenLesson(null);
    setSearch('');
  }

  /* Escape goes back one layer rather than closing everything: three layers
   * deep, the thing wanted is almost always the layer above. */
  useEffect(() => {
    if (!layer) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (layer === 'detail') {
        setLayer('grid');
        setOpenLesson(null);
      } else if (layer === 'grid') {
        setLayer('stages');
        setOpenStage(null);
      } else {
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [layer]);

  if (data === null) return <p className={styles.status}>Reading them…</p>;

  if (!configured) {
    return (
      <p className={styles.status}>
        Not connected. The D1 database is not bound — see <code>wrangler.jsonc</code>.
      </p>
    );
  }

  const faceOf = (one: Curriculum) => {
    const look = statusLook(one.status);
    return {
      '--card-bg': look.background,
      '--card-bg2': look.background2,
      '--card-ink': look.ink,
      '--card-accent': look.accent,
      '--card-line': look.line,
    } as React.CSSProperties;
  };

  return (
    <div className={styles.page}>
      {error && <p className={styles.warn}>{error}</p>}

      {/* --- Up next: one card per active curriculum ----------------------- */}
      {steps.length > 0 && (
        <section className={styles.queue}>
          <p className={styles.queueHead}>Up next</p>
          <ol className={styles.queueRow} style={{ '--count': steps.length } as React.CSSProperties}>
            {steps.map((step) => (
              <li key={step.lesson.id}>
                <div
                  className={`${styles.queueCard} ${
                    finishing.has(step.lesson.id) ? styles.queueDone : ''
                  }`}
                >
                  {/* Two dog-ears, and the card body itself does nothing.
                      A card that completed a lesson anywhere you clicked it
                      was one misclick from a tick you did not mean. */}
                  <button
                    type="button"
                    className={styles.foldOpen}
                    title={`Open ${step.lesson.name}`}
                    aria-label={`Open ${step.lesson.name}`}
                    onClick={() => {
                      setOpenCurriculum(step.curriculum.id);
                      setOpenStage(step.module.id);
                      setOpenLesson(step.lesson.id);
                      setDetailDraft(step.lesson.detail ?? '');
                      setEditingDetail(false);
                      setLayer('detail');
                    }}
                  />
                  <button
                    type="button"
                    className={styles.foldDone}
                    title={`Mark ${step.lesson.name} done`}
                    aria-label={`Mark ${step.lesson.name} done`}
                    onClick={() => finish(step)}
                  />
                  <div className={styles.queueBody} title={step.lesson.name}>
                    <span className={styles.queueWhat}>{step.curriculum.name}</span>
                    <span className={styles.queueWhere}>
                      {step.moduleAt}:{step.lessonAt}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* --- the deck ------------------------------------------------------ */}
      <div className={styles.deckWrap}>
        {deck.length > 1 && (
          <button
            type="button"
            className={styles.arrow}
            aria-label="Previous curriculum"
            onClick={() => setFront((at) => at - 1)}
          >
            <Chevron direction="left" />
          </button>
        )}

        <div className={styles.deck}>
          {ordered.map((one, at) => {
            const lie = scatterFor(one.name, at);
            const progress = progressOf(one);
            const isFront = at === 0;
            const look = statusLook(one.status);

            return (
              <div
                key={one.id}
                /* Only the front card is interactive. The ones behind it are
                   texture, which is what lets the pile be neat — they no
                   longer need a visible edge to be clicked on.
                   The z-index is also what stopped the deck reading backwards:
                   with none set, later elements paint over earlier ones. */
                className={`${styles.cardSlot} ${isFront ? styles.frontSlot : ''}`}
                style={
                  {
                    '--rotate': `${lie.rotate}deg`,
                    '--dx': `${lie.dx}rem`,
                    '--dy': `${lie.dy}rem`,
                    zIndex: ordered.length - at,
                  } as React.CSSProperties
                }
                aria-hidden={!isFront}
              >
                <div
                  className={`${styles.card} ${one.status !== 'active' ? styles.shelved : ''}`}
                  style={faceOf(one)}
                >
                  <button
                    type="button"
                    className={styles.cardFace}
                    tabIndex={isFront ? 0 : -1}
                    onClick={() => {
                      if (!isFront) return;
                      setOpenCurriculum(one.id);
                      setOpenStage(null);
                      setOpenLesson(null);
                      setLayer('stages');
                    }}
                  >
                    <Ring percent={progress.percent} ink={look.ink} accent={look.accent} />
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
                            void act({
                              action: 'rename',
                              kind: 'curriculum',
                              id: one.id,
                              name: rename,
                            });
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
                          if (!isFront) return;
                          setRenaming(`curriculum:${one.id}`);
                          setRename(one.name);
                        }}
                        title={isFront ? 'Double-click to rename' : undefined}
                      >
                        {one.name}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    className={styles.statusDot}
                    tabIndex={isFront ? 0 : -1}
                    aria-label={`${one.name} is ${one.status} — click to change`}
                    title={`${one.status} → ${NEXT_STATUS[one.status]}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!isFront) return;
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

          {/* The blank card, behind everything: the one never being read. */}
          <div className={`${styles.cardSlot} ${styles.addSlot}`} style={{ zIndex: 0 }}>
            {adding === 'curriculum' ? (
              <form
                className={styles.addCard}
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
                className={styles.addCard}
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

        {deck.length > 1 && (
          <button
            type="button"
            className={styles.arrow}
            aria-label="Next curriculum"
            onClick={() => setFront((at) => at + 1)}
          >
            <Chevron direction="right" />
          </button>
        )}
      </div>

      {deck.length > 1 && (
        <p className={styles.deckWhere}>
          {(((front % deck.length) + deck.length) % deck.length) + 1} of {deck.length}
        </p>
      )}

      {/* --- layer one: the stages, dead centre --------------------------- */}
      {layer === 'stages' && current && (
        <Overlay onClose={close} label={`${current.name} stages`}>
          <div className={styles.stageCentre}>
            <p className={styles.overlayTitle}>
              <CurriculumIcon name={current.name} className={styles.titleIcon} size={46} />
              <span>{current.name}</span>
            </p>

            <div className={styles.searchRow}>
              <input
                type="search"
                className={styles.search}
                value={search}
                placeholder={`Find a lesson in ${current.name}`}
                aria-label={`Find a lesson in ${current.name}`}
                onChange={(event) => setSearch(event.target.value)}
              />
              {hits.length > 0 && (
                <ul className={styles.hits}>
                  {hits.map((hit) => (
                    <li key={hit.lesson.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenStage(hit.module.id);
                          setOpenLesson(hit.lesson.id);
                          setDetailDraft(hit.lesson.detail ?? '');
                          setEditingDetail(false);
                          setLayer('detail');
                          setSearch('');
                        }}
                      >
                        <span>{hit.lesson.name}</span>
                        <span className={styles.hitIn}>
                          {hit.module.name} · lesson {hit.at}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.stageFan}>
              {current.modules.map((module, at) => {
                const progress = progressOf(module);
                return (
                  <button
                    key={module.id}
                    type="button"
                    className={styles.stageCard}
                    onClick={() => flashTo('grid', () => setOpenStage(module.id))}
                  >
                    <span className={styles.stageNumber}>{at + 1}</span>
                    <span className={styles.stageName}>{module.name}</span>
                    <span className={styles.stagePercent}>{progress.percent}%</span>
                  </button>
                );
              })}

              {adding === `module:${current.id}` ? (
                <form
                  className={`${styles.stageCard} ${styles.addStage}`}
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!draft.trim()) return;
                    void act({ action: 'add-module', curriculum_id: current.id, name: draft }).then(
                      () => {
                        setDraft('');
                        setAdding(null);
                      },
                    );
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
                </form>
              ) : (
                <button
                  type="button"
                  className={`${styles.stageCard} ${styles.addStage}`}
                  onClick={() => {
                    setAdding(`module:${current.id}`);
                    setDraft('');
                  }}
                >
                  +
                </button>
              )}
            </div>
          </div>
        </Overlay>
      )}

      {/* --- layer two: the lessons, as a grid of numbers ----------------- */}
      {layer === 'grid' && current && stage && (
        <Overlay
          onClose={close}
          label={`${stage.name} lessons`}
          full
          onBack={() => {
            setLayer('stages');
            setOpenStage(null);
          }}
        >
          {/* Nothing but the blocks.
              The header said the curriculum and the stage, which are what you
              clicked twice to get here, and carried a stages button that the
              backdrop and Escape both already do. The key explained three
              colours that are gold, grey and faded. All of it was furniture
              around the only thing on the layer. */}
          <ol className={styles.numberGrid}>
            {stage.lessons.map((each, at) => (
              <li key={each.id}>
                <button
                  type="button"
                  className={`${styles.cell} ${each.done_on ? styles.cellDone : ''} ${
                    each.on_route ? '' : styles.cellOff
                  }`}
                  title={each.name}
                  onClick={() =>
                    flashTo('detail', () => {
                      setOpenLesson(each.id);
                      setDetailDraft(each.detail ?? '');
                      setEditingDetail(false);
                    })
                  }
                >
                  {at + 1}
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                className={`${styles.cell} ${styles.cellAdd}`}
                title="Add a lesson"
                onClick={() => {
                  const name = prompt('Lesson name');
                  if (name?.trim()) void act({ action: 'add-lesson', module_id: stage.id, name });
                }}
              >
                +
              </button>
            </li>
          </ol>
        </Overlay>
      )}

      {/* --- layer three: one lesson ------------------------------------- */}
      {layer === 'detail' && current && stage && lesson && (
        <Overlay
          onClose={close}
          label={lesson.name}
          onBack={() => {
            setLayer('grid');
            setOpenLesson(null);
          }}
        >
          <div className={styles.detailCard}>
            <header className={styles.detailHead}>
              {/* The stage's name is renameable HERE because the grid's
                  header is gone and that is where it used to be. On the stage
                  card it would fight the click that opens the grid; on a
                  breadcrumb nothing else wants the gesture. */}
              <p className={styles.overlayEyebrow}>
                {current.name} ›{' '}
                {renaming === `module:${stage.id}` ? (
                  <input
                    className={styles.renameEyebrow}
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
                    title="Double-click to rename the stage"
                  >
                    {stage.name}
                  </span>
                )}
              </p>
              <h2>
                {renaming === `lesson:${lesson.id}` ? (
                  <input
                    className={styles.renameInline}
                    value={rename}
                    autoFocus
                    aria-label={`Rename ${lesson.name}`}
                    onChange={(event) => setRename(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && rename.trim()) {
                        void act({ action: 'rename', kind: 'lesson', id: lesson.id, name: rename });
                        setRenaming(null);
                      }
                      if (event.key === 'Escape') setRenaming(null);
                    }}
                    onBlur={() => setRenaming(null)}
                  />
                ) : (
                  <span
                    onDoubleClick={() => {
                      setRenaming(`lesson:${lesson.id}`);
                      setRename(lesson.name);
                    }}
                    title="Double-click to rename"
                  >
                    {lesson.name}
                  </span>
                )}
              </h2>
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
                          if (result?.repoOwned && !result.committed) {
                            setError(
                              'Saved here, but the repo copy did not commit — the next rebuild will overwrite it.',
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
                      is in the resource, and the sources below are where it lives.
                    </p>
                  )}
                </div>

                {current.sources && current.sources.length > 0 && (
                  <div className={styles.sourceBlock}>
                    <p className={styles.sourceHead}>Sources</p>
                    <ul className={styles.sourceList}>
                      {current.sources.map((source) => (
                        <li key={source.id}>
                          {source.url ? (
                            <a href={source.url} target="_blank" rel="noreferrer">
                              {source.title}
                            </a>
                          ) : (
                            source.title
                          )}
                          {source.note && <span className={styles.sourceNote}>{source.note}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className={styles.detailButtons}>
                  {/* Back-dating lives here now: it was in the grid's header,
                      and the header is gone. This is where marking done
                      happens, so it is where the day belongs. */}
                  <label className={styles.dayPick}>
                    <span>on</span>
                    <input
                      type="date"
                      value={tickDay}
                      max={today}
                      aria-label="The day to mark it done"
                      onChange={(event) => setTickDay(event.target.value || today)}
                    />
                  </label>
                  <button
                    type="button"
                    className={lesson.done_on ? styles.goldButton : undefined}
                    onClick={() =>
                      void act({
                        action: 'toggle-lesson',
                        id: lesson.id,
                        ...(tickDay && tickDay !== today ? { day: tickDay } : {}),
                      })
                    }
                  >
                    {lesson.done_on ? 'Done — undo' : 'Mark done'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDetailDraft(lesson.detail ?? '');
                      setEditingDetail(true);
                    }}
                  >
                    {lesson.detail ? 'Edit detail' : 'Write detail'}
                  </button>
                  {/* The route decision lives with the lesson's substance
                      rather than on a grid pressed constantly. */}
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
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => {
                      if (!confirm(`Delete “${lesson.name}”? Its tick goes with it.`)) return;
                      void act({ action: 'remove', kind: 'lesson', id: lesson.id }).then(() => {
                        setLayer('grid');
                        setOpenLesson(null);
                      });
                    }}
                  >
                    delete
                  </button>
                </p>
              </>
            )}
          </div>
        </Overlay>
      )}
    </div>
  );
}

/**
 * A dimmed backdrop with one thing dead centre.
 *
 * Clicking the backdrop goes back, which is what everyone expects of a dimmed
 * screen — but only the backdrop itself, so a click landing inside the card
 * does not close the card it landed in.
 */
function Overlay({
  children,
  onClose,
  onBack,
  label,
  full,
}: {
  children: React.ReactNode;
  onClose: () => void;
  onBack?: () => void;
  label: string;
  /** The near-fullscreen variant: 50px of backdrop and nothing more. */
  full?: boolean;
}) {
  return (
    <div
      className={`${styles.overlay} ${full ? styles.overlayFull : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={(event) => {
        if (event.target === event.currentTarget) (onBack ?? onClose)();
      }}
    >
      {children}
      <button type="button" className={styles.overlayClose} onClick={onClose} aria-label="Close">
        ×
      </button>
    </div>
  );
}

/** The deck's arrows. Gold, which is this page's one accent. */
function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="30" height="30">
      <path
        d={direction === 'left' ? 'M15 4 L7 12 L15 20' : 'M9 4 L17 12 L9 20'}
        fill="none"
        stroke={GOLD}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Lesson detail, rendered.
 *
 * It is authored as Markdown and the page used to print the string raw, which
 * made the substance of a lesson a wall of asterisks — the opposite of the
 * point, since `detail` exists because a name "tells me what is learned
 * conceptually, but what wrist level means, what posture to use is a mystery".
 *
 * Rendered here rather than with the site's MDX pipeline, which is a server
 * component compiled at build and cannot run in the browser. A small subset is
 * enough for what these contain, and anything it does not understand comes out
 * as its own paragraph rather than as nothing.
 */
function Markdown({ source }: { source: string }) {
  const blocks = source
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <>
      {blocks.map((block, at) => {
        const heading = /^(#{1,4})\s+(.*)$/.exec(block);
        if (heading) {
          return (
            <h3 key={at} className={styles.detailHeading}>
              {inline(heading[2])}
            </h3>
          );
        }

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
