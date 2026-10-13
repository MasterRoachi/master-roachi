'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  nextPerCurriculum,
  nextStep,
  progressOf,
  splitModules,
  type Curriculum,
  type Lesson,
  type Module,
  type Source,
  type Step,
} from '@/lib/curriculum';
import CurriculumIcon from '@/components/CurriculumIcon';
import { GOLD, scatterFor, statusLook } from '@/lib/curriculum-card';
import LessonMarkdown from '@/components/LessonMarkdown';
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

type Layer = 'stages' | 'sources' | 'grid' | 'detail';

/* How long the finishing flourish takes, in milliseconds.
 *
 * Declared here AND in the stylesheet, which is a duplication worth having:
 * the swap has to happen after the fade has finished, and the bug it fixes was
 * exactly those two numbers disagreeing — the card left the DOM at 520ms into
 * a 620ms fade and the row jumped. Change one, change the other; the CSS
 * carries the same note. */
const PEEL = 420;
const FADE = 900;
const ARRIVE = 700;
/** How long the opening card takes to reach the centre. */
const ZOOM = 940;
/**
 * How long the travelling card stays up after the layer is mounted.
 *
 * Without the overlap there is a flash: the opening dim is removed and the
 * overlay starts its OWN backdrop fade from transparent, so one frame of
 * undimmed page shows through between the two. Holding the stand-in and its
 * dim over that fade covers it, and the stand-in is already the same white
 * rectangle in the same place, so the handover is invisible.
 */
const HANDOVER = 200;

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
  /** Cards mid-peel: gold spreading, then fading out. */
  const [finishing, setFinishing] = useState<Set<number>>(new Set());
  /** Cards that have just arrived, so they can slide in rather than appear. */
  const [arriving, setArriving] = useState<Set<number>>(new Set());
  /**
   * The card being opened, and the box it started in.
   *
   * Opening is the same peel as finishing, in white, and then the card itself
   * travels to the centre and grows to the size of the layer it is becoming.
   * That needs the card's own position, which only the DOM knows — so it is
   * measured at the click and handed to a fixed-position stand-in, because an
   * element inside a scrolling grid cannot animate to the middle of the
   * viewport without leaving its parent.
   */
  const [opening, setOpening] = useState<{
    lessonId: number;
    name: string;
    from: { top: number; left: number; width: number; height: number };
  } | null>(null);

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
        truncated?: boolean;
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
  const stageAt = current ? current.modules.findIndex((one) => one.id === openStage) : -1;
  const stage = stageAt >= 0 ? current!.modules[stageAt] : null;
  /* Positions rather than names, for "Japanese › module 2 › lesson 12". The
     breadcrumb is where you are, and a stage's name is already the heading of
     the layer you came through. */
  const lessonAt = stage ? stage.lessons.findIndex((one) => one.id === openLesson) : -1;
  const lesson = lessonAt >= 0 ? stage!.lessons[lessonAt] : null;

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
   * The sticker peels, the card fades out all the way, and only then is it
   * taken out of the row and the replacement appended — which slides in from
   * the right.
   *
   * THE TIMING MATTERED AND WAS WRONG. The swap fired at 520ms against a
   * 620ms fade, so the card was pulled out of the DOM while still visible and
   * the row jumped. PEEL + FADE below is the CSS duration, and nothing moves
   * until it has run.
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
      if (replacement) {
        // Marked as arriving so it slides in; cleared once the slide is over,
        // or it would slide again on the next render.
        setArriving((before) => new Set(before).add(replacement.lesson.id));
        window.setTimeout(() => {
          setArriving((before) => {
            const next = new Set(before);
            next.delete(replacement.lesson.id);
            return next;
          });
        }, ARRIVE);
      }
    }, PEEL + FADE);

    void act({
      action: 'toggle-lesson',
      id: step.lesson.id,
      ...(tickDay && tickDay !== today ? { day: tickDay } : {}),
    });
  }

  /**
   * Open a lesson from the Up next row.
   *
   * The white sticker peels, then the card travels to the centre and grows to
   * the size of the layer it is turning into, and only then does the layer
   * itself appear. Measured from the card's real box so the move starts where
   * the card actually is rather than from an assumed position.
   */
  function openCard(step: Step, from: { top: number; left: number; width: number; height: number }) {
    setOpening({ lessonId: step.lesson.id, name: step.curriculum.name, from });

    window.setTimeout(() => {
      setOpenCurriculum(step.curriculum.id);
      setOpenStage(step.module.id);
      setOpenLesson(step.lesson.id);
      setDetailDraft(step.lesson.detail ?? '');
      setEditingDetail(false);
      setLayer('detail');
      // And only then let go of the stand-in, which is covering the overlay's
      // own fade-in. See HANDOVER.
      window.setTimeout(() => setOpening(null), HANDOVER);
    }, PEEL + ZOOM);
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
                  } ${arriving.has(step.lesson.id) ? styles.queueArriving : ''} ${
                    opening?.lessonId === step.lesson.id ? styles.queueOpening : ''
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
                    onClick={(event) => {
                      const card = event.currentTarget.parentElement;
                      if (!card) return;
                      const box = card.getBoundingClientRect();
                      openCard(step, {
                        top: box.top,
                        left: box.left,
                        width: box.width,
                        height: box.height,
                      });
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

      {/* The card on its way to becoming a layer.
          A fixed stand-in rather than the card itself: the card lives in a
          grid track and cannot travel to the middle of the viewport without
          leaving its parent, and taking it out of the row would collapse the
          row while it moved. */}
      {opening && (
        <>
          <div className={styles.openingDim} />
          <div
            className={styles.travelling}
            style={
              {
                '--from-top': `${opening.from.top}px`,
                '--from-left': `${opening.from.left}px`,
                '--from-width': `${opening.from.width}px`,
                '--from-height': `${opening.from.height}px`,
              } as React.CSSProperties
            }
            aria-hidden="true"
          />
        </>
      )}

      {/* --- layer one: the stages, dead centre --------------------------- */}
      {layer === 'stages' && current && (
        <Overlay onClose={close} label={`${current.name} stages`}>
          <div className={styles.stageCentre}>
            <p className={styles.overlayTitle}>
              <CurriculumIcon name={current.name} className={styles.titleIcon} size={46} />
              <span>{current.name}</span>
            </p>

            {/* The gold cards, which are NOT stages.
                His design — "it should also not be in the list, but a separate
                card that's the same size and shape exactly but horizontal,
                just beneath the curriculum name, above the search". So a stage
                card turned on its side, which is why the dimensions in the CSS
                are a stage's two measurements swapped rather than new ones.
                Out of the list because neither opens a stage: one leaves the
                page and the other opens a list. */}
            {(current.cards || (current.sources && current.sources.length > 0)) && (
              <div className={styles.goldRow}>
                {current.cards ? (
                  <a href={`/work/cards/?deck=${current.id}`} className={styles.cardsCard}>
                    <span className={styles.cardsMark}>★</span>
                    <span className={styles.cardsName}>Cards</span>
                    <span className={styles.cardsCount}>{current.cards}</span>
                  </a>
                ) : null}

                {current.sources && current.sources.length > 0 ? (
                  <button
                    type="button"
                    className={styles.cardsCard}
                    onClick={() => setLayer('sources')}
                  >
                    <span className={styles.cardsMark}>§</span>
                    <span className={styles.cardsName}>Sources</span>
                    <span className={styles.cardsCount}>{current.sources.length}</span>
                  </button>
                ) : null}
              </div>
            )}

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

            {/* A track runs BESIDE the route rather than on it — Japanese's
                kanji modules, worked through in parallel. White and
                horizontal, below the search, so they read as a second row of
                things rather than as stages that happen to come last. See
                splitModules() for the convention that identifies them. */}
            {splitModules(current.modules).tracks.length > 0 && (
              <div className={styles.trackRow}>
                {splitModules(current.modules).tracks.map((module) => {
                  const progress = progressOf(module);
                  return (
                    <button
                      key={module.id}
                      type="button"
                      className={styles.trackCard}
                      onClick={() => flashTo('grid', () => setOpenStage(module.id))}
                    >
                      <span className={styles.trackName}>{module.name}</span>
                      <span className={styles.trackPercent}>{progress.percent}%</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className={styles.stageFan}>
              {splitModules(current.modules).stages.map((module, at) => {
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

            </div>
          </div>
        </Overlay>
      )}

      {/* --- the sources, which belong to the whole curriculum ------------ */}
      {layer === 'sources' && current && (
        <Overlay
          onClose={close}
          label={`${current.name} sources`}
          onBack={() => setLayer('stages')}
        >
          <div className={styles.sourcesPane}>
            <p className={styles.overlayTitle}>
              <span>Sources</span>
            </p>
            <p className={styles.sourcesWhat}>
              What {current.name} is studied from. A lesson&rsquo;s own sources — the chapter, the
              page, the one video — are on the lesson.
            </p>
            {current.sources && current.sources.length > 0 ? (
              <SourceList sources={current.sources} />
            ) : (
              <p className={styles.nothingYet}>Nothing recorded yet.</p>
            )}
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
                  className={`${styles.cell} ${each.done_on ? styles.cellDone : ''}`}
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
          full
          onBack={() => {
            setLayer('grid');
            setOpenLesson(null);
          }}
        >
          <article className={styles.lessonPane}>
            {/* Where you are, top left. The STAGE is renameable here because
                the grid's header is gone and that is where it used to be; on a
                stage card it would fight the click that opens the grid. */}
            <p className={styles.lessonWhere}>
              {current.name} <span className={styles.chev}>›</span>{' '}
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
                  module {stageAt + 1}
                </span>
              )}{' '}
              <span className={styles.chev}>›</span> lesson {lessonAt + 1}
            </p>

            <h2 className={styles.lessonTitle}>
              {renaming === `lesson:${lesson.id}` ? (
                <input
                  className={styles.renameTitle}
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

            <div className={styles.lessonBody}>
              {editingDetail ? (
                <>
                  <textarea
                    className={styles.detailEditor}
                    value={detailDraft}
                    autoFocus
                    aria-label={`What ${lesson.name} teaches`}
                    placeholder="What this teaches. Markdown — ## headings, - bullets, **bold**, ![](/image.webp)."
                    onChange={(event) => setDetailDraft(event.target.value)}
                  />
                  <p className={styles.editButtons}>
                    <button
                      type="button"
                      onClick={() => {
                        void act({ action: 'set-detail', id: lesson.id, detail: detailDraft }).then(
                          (result) => {
                            setEditingDetail(false);
                            if (result?.truncated) {
                              setError(
                                'Saved, but it was cut at 32,000 characters — the end of what you wrote is not in it.',
                              );
                            } else if (result?.repoOwned && !result.committed) {
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
                  <section className={styles.lessonSection}>
                    <h3>Details</h3>
                    {lesson.detail ? (
                      <LessonMarkdown source={lesson.detail} />
                    ) : (
                      <p className={styles.nothingYet}>
                        Nothing written yet.
                      </p>
                    )}
                  </section>

                  {/* THE LESSON'S OWN SOURCES, AND ONLY THOSE.
                      The curriculum's whole list used to sit underneath, and
                      it was a bibliography — true of every lesson and pointing
                      none of them anywhere. It has its own gold card on the
                      stages screen now, which is where a list that belongs to
                      the whole curriculum belongs. */}
                  <section className={styles.lessonSection}>
                    <h3>Sources</h3>
                    {lesson.sources && lesson.sources.length > 0 ? (
                      <SourceList sources={lesson.sources} />
                    ) : (
                      <p className={styles.nothingYet}>Nothing recorded for this lesson yet.</p>
                    )}
                  </section>

                  {/* Visual examples, where applicable — which means where the
                      detail has images in it. Nothing else on a lesson carries
                      a picture, so "applicable" is literally "there are some",
                      and a heading over an empty space on every other lesson
                      would be worse than no heading. */}
                  {imagesIn(lesson.detail).length > 0 && (
                    <section className={styles.lessonSection}>
                      <h3>Visual examples</h3>
                      <div className={styles.visuals}>
                        {imagesIn(lesson.detail).map((image) => (
                          <figure key={image.src}>
                            <img src={image.src} alt={image.alt} loading="lazy" />
                            {image.alt && <figcaption>{image.alt}</figcaption>}
                          </figure>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>

            {!editingDetail && (
              <footer className={styles.lessonActions}>
                <button
                  type="button"
                  className={`${styles.roundButton} ${lesson.done_on ? styles.roundDone : ''}`}
                  title={lesson.done_on ? 'Done — click to undo' : 'Mark done'}
                  aria-label={lesson.done_on ? 'Mark not done' : 'Mark done'}
                  onClick={() =>
                    void act({
                      action: 'toggle-lesson',
                      id: lesson.id,
                      ...(tickDay && tickDay !== today ? { day: tickDay } : {}),
                    })
                  }
                >
                  ✓
                </button>
                <button
                  type="button"
                  className={styles.roundButton}
                  title={lesson.detail ? 'Edit the detail' : 'Write the detail'}
                  aria-label="Edit"
                  onClick={() => {
                    setDetailDraft(lesson.detail ?? '');
                    setEditingDetail(true);
                  }}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className={`${styles.roundButton} ${styles.roundDelete}`}
                  title="Delete this lesson"
                  aria-label="Delete"
                  onClick={() => {
                    if (!confirm(`Delete “${lesson.name}”? Its tick goes with it.`)) return;
                    void act({ action: 'remove', kind: 'lesson', id: lesson.id }).then(() => {
                      setLayer('grid');
                      setOpenLesson(null);
                    });
                  }}
                >
                  ×
                </button>
              </footer>
            )}
          </article>
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
 * A list of sources, at either grain — one lesson's or a whole curriculum's.
 *
 * The same shape for both, because they are the same rows: migration 0009
 * added a nullable `lesson_id` rather than a second table, for exactly this
 * reason.
 */
function SourceList({ sources }: { sources: Source[] }) {
  return (
    <ul className={styles.sourceList}>
      {sources.map((source) => (
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
  );
}

/**
 * The images in a lesson's detail, which is where a visual example can come
 * from — nothing else on a lesson carries a picture.
 *
 * Markdown image syntax, so writing one is `![what it shows](/path.webp)` in
 * the detail box. They are pulled OUT of the prose and shown together under
 * their own heading rather than left inline, because an example belongs beside
 * the other examples and not in the middle of a sentence about wrist height.
 */
function imagesIn(detail: string | null): { src: string; alt: string }[] {
  if (!detail) return [];
  return [...detail.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)].map((match) => ({
    alt: match[1],
    src: match[2],
  }));
}

