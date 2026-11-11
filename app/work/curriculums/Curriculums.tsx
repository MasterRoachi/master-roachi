'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
import LessonMarkdown from '@/components/LessonMarkdown';
import styles from './curriculums.module.css';

// A plain list with the next lesson on each, and a drill-down behind every row.
// His pick, 2026-11-10 (redesign page, Curriculums: A).
//
// It replaces a scattered deck you paged through with arrows, an "Up next" row
// of folded cards above it, and three stacked overlays below it. Beautiful, and
// it took four taps to reach a lesson that was not next. Now:
//
//   list     every curriculum as one row, grouped Active, Paused, Done. The
//            row says where you are (stage:lesson and its title), Open goes
//            straight to that lesson, and ✓ marks it done without opening it.
//   stages   tap the row itself: the curriculum's stages, tracks, Cards,
//            Sources, the lesson search, rename, status and Ohana audience.
//   grid     one stage's lessons as numbers — a stage of thirty lessons is a
//            wall of text, and thirty numbers are a shape you can see gaps in.
//   detail   one lesson, with edit, done/undo and delete.
//
// Each step is ONE view that takes the page's place, with a back link at the
// top, rather than a dimmed layer over the layer before it. On a phone that is
// a full-screen view, which is what a detail should be there; Escape goes back
// one step, exactly as it went back one layer.
//
// Colour is the status and nothing else, and it is the colour of the WORDS,
// never a face or a fill (his ruling, 11 Nov 2026, DESIGN.md): an active
// course in the page's ink with its ring in the Learn blue, a paused one
// muted, a done one in --ok, the colour of done. lookOf() below; statusLook()'s white,
// black and gold card faces are no longer used here.
//
// ON A COMPUTER (from 900px) it is list | detail, after the CRM: the list stays
// on the left, and the step that took the page's place on a phone opens on the
// right instead, using the width. The next lesson stands out in the app's
// colour: a card at the top of the curriculum, the stage it is in, its cell.
// His call, 2026-11-10 (design pass: the public site's styling, the CRM's
// desktop layout). The phone keeps the drill-down exactly as it was.
//
// DEEP LINK: `?open=<curriculum id>` opens that curriculum's next lesson (or
// its stages when nothing is left), so the Learn home's Continue button can
// land on the lesson rather than on the list. The parameter is read once, on
// the first load, and taken out of the address so a reload shows the list.

const RING = 2 * Math.PI * 20;

// As style rather than attributes, because the active colours are CSS
// variables and a presentation attribute does not read var().
function Ring({ percent, ink, accent }: { percent: number; ink: string; accent: string }) {
  return (
    <svg className={styles.ring} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="20" className={styles.ringTrack} style={{ stroke: ink }} />
      <circle
        cx="24"
        cy="24"
        r="20"
        className={styles.ringFill}
        style={{ stroke: accent }}
        // From the top, not three o'clock, which is where a circle starts and
        // nobody reads a dial from.
        strokeDasharray={`${(percent / 100) * RING} ${RING}`}
        transform="rotate(-90 24 24)"
      />
      <text x="24" y="24" className={styles.ringText} style={{ fill: ink }}>
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
const STATUS_WORD: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  done: 'Done',
};
const GROUPS = ['active', 'paused', 'done'] as const;

/** Who it is for in Ohana, cycled the same way: not shared → his → hers → both. */
const AUDIENCES = [null, 'his', 'hers', 'both'] as const;
const AUDIENCE_LABEL: Record<string, string> = {
  his: 'His',
  hers: 'Hers',
  both: 'Both',
};
const nextAudience = (now: Curriculum['audience']) =>
  AUDIENCES[(AUDIENCES.indexOf(now ?? null) + 1) % AUDIENCES.length];

type Layer = 'stages' | 'sources' | 'grid' | 'detail';

/** How long a click on a row's name waits to see whether it is a double-click. */
const DOUBLE = 260;

/** A row's colours, as text: the ink and the ring's fill. CSS variables, set
 * in curriculums.module.css (--done is --ok, the colour of done). */
function lookOf(status: string) {
  if (status === 'done') return { ink: 'var(--done)', accent: 'var(--done)' };
  if (status === 'paused') return { ink: 'var(--muted)', accent: 'var(--muted)' };
  return { ink: 'var(--ink)', accent: 'var(--accent)' };
}

export default function Curriculums() {
  const [data, setData] = useState<Curriculum[] | null>(null);
  const [today, setToday] = useState('');
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  /** The lesson a row's ✓ is marking, so a second tap cannot tick the one after. */
  const [ticking, setTicking] = useState<number | null>(null);

  const root = useRef<HTMLDivElement>(null);
  const deepLinked = useRef(false);
  const nameClick = useRef<number | null>(null);

  function showLesson(one: Curriculum, moduleId: number, each: Lesson) {
    setOpenCurriculum(one.id);
    setOpenStage(moduleId);
    setOpenLesson(each.id);
    setDetailDraft(each.detail ?? '');
    setEditingDetail(false);
    setSearch('');
    setLayer('detail');
  }

  function showStages(one: Curriculum) {
    setOpenCurriculum(one.id);
    setOpenStage(null);
    setOpenLesson(null);
    setSearch('');
    setLayer('stages');
  }

  const load = useCallback(async () => {
    try {
      const response = await fetch('/work/api/curriculums', {
        cache: 'no-store',
      });
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

      // The deep link, once. Here rather than in an effect, because this is
      // the moment the curriculums it names are first known.
      if (!deepLinked.current) {
        deepLinked.current = true;
        const url = new URL(window.location.href);
        const wanted = Number(url.searchParams.get('open'));
        const one = (payload.curriculums ?? []).find((each) => each.id === wanted);
        if (one) {
          const step = nextStep(one);
          if (step) {
            setOpenCurriculum(one.id);
            setOpenStage(step.module.id);
            setOpenLesson(step.lesson.id);
            setDetailDraft(step.lesson.detail ?? '');
            setLayer('detail');
          } else {
            setOpenCurriculum(one.id);
            setLayer('stages');
          }
        }
        if (url.searchParams.has('open')) {
          url.searchParams.delete('open');
          window.history.replaceState(null, '', url.pathname + url.search + url.hash);
        }
      }
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

  const toggle = (id: number) =>
    act({
      action: 'toggle-lesson',
      id,
      ...(tickDay && tickDay !== today ? { day: tickDay } : {}),
    });

  const curriculums = useMemo(() => data ?? [], [data]);

  /* Grouped by status. Within each group the stored order stands: it is the
   * route through all the routes. */
  const groups = useMemo(
    () =>
      GROUPS.map((status) => ({
        status,
        items: curriculums.filter((one) => (GROUPS.includes(one.status) ? one.status : 'active') === status),
      })).filter((group) => group.items.length > 0),
    [curriculums],
  );

  const current = curriculums.find((one) => one.id === openCurriculum) ?? null;
  const stageAt = current ? current.modules.findIndex((one) => one.id === openStage) : -1;
  const stage = stageAt >= 0 ? current!.modules[stageAt] : null;
  /* Positions rather than names, for "Japanese › module 2 › lesson 12". */
  const lessonAt = stage ? stage.lessons.findIndex((one) => one.id === openLesson) : -1;
  const lesson = lessonAt >= 0 ? stage!.lessons[lessonAt] : null;
  /* The open curriculum's next lesson, which its view, stage and cell mark. */
  const next: Step | null = current ? nextStep(current) : null;

  /* Searching ONE curriculum, not all of them: the thing being looked for is
   * almost always inside the course already open, and Japanese alone is 118
   * lessons across four stages. */
  const hits: { module: Module; lesson: Lesson; at: number }[] = [];
  const term = search.trim().toLowerCase();
  if (current && term.length >= 2) {
    for (const module of current.modules) {
      module.lessons.forEach((each, at) => {
        if (hits.length < 40 && each.name.toLowerCase().includes(term)) hits.push({ module, lesson: each, at: at + 1 });
      });
    }
  }

  function close() {
    setLayer(null);
    setOpenCurriculum(null);
    setOpenStage(null);
    setOpenLesson(null);
    setSearch('');
    setRenaming(null);
  }

  const back = useCallback(() => {
    setRenaming(null);
    if (layer === 'detail') {
      setEditingDetail(false);
      setLayer('grid');
      setOpenLesson(null);
    } else if (layer === 'grid' || layer === 'sources') {
      setLayer('stages');
      setOpenStage(null);
    } else {
      setLayer(null);
      setOpenCurriculum(null);
      setSearch('');
    }
  }, [layer]);

  /* Escape goes back one step rather than to the list: three deep, the thing
   * wanted is almost always the step above. Not from inside a field, which
   * has its own Escape (cancel the rename, leave the search). */
  useEffect(() => {
    if (!layer) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [layer, back]);

  /* Each view starts at its top. The pane that scrolls is the page's .shell
   * wrapper (app/work/work.module.css), not this component. */
  useEffect(() => {
    root.current?.closest('.shell')?.scrollTo({ top: 0 });
  }, [layer, openStage, openLesson]);

  if (data === null) return <p className={styles.status}>Reading them…</p>;

  if (!configured) {
    return (
      <p className={styles.status}>
        Not connected. The D1 database is not bound — see <code>wrangler.jsonc</code>.
      </p>
    );
  }

  const faceOf = (one: Curriculum) => {
    const look = lookOf(one.status);
    return { '--card-ink': look.ink, '--card-accent': look.accent } as React.CSSProperties;
  };

  const renameField = (
    key: string,
    kind: 'curriculum' | 'module' | 'lesson',
    id: number,
    label: string,
    className: string,
  ) =>
    renaming === key ? (
      <input
        className={className}
        value={rename}
        autoFocus
        aria-label={`Rename ${label}`}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => setRename(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && rename.trim()) {
            void act({ action: 'rename', kind, id, name: rename });
            setRenaming(null);
          }
          if (event.key === 'Escape') setRenaming(null);
        }}
        onBlur={() => setRenaming(null)}
      />
    ) : null;

  const startRename = (key: string, name: string) => {
    setRenaming(key);
    setRename(name);
  };

  return (
    <div className={styles.page} ref={root}>
      {error && (
        <p className={styles.warn} role="alert">
          {error}
        </p>
      )}

      <div className={styles.split}>
        {/* --- the list: one row per curriculum ------------------------------
          On a phone it gives way to whatever is open; on a computer it stays
          on the left beside it. */}
        <div className={layer === null ? styles.list : styles.listBeside}>
          {curriculums.length === 0 && <p className={styles.empty}>No curriculums yet. Add the first one below.</p>}

          {groups.map((group) => (
            <section key={group.status} className={styles.group} aria-label={STATUS_WORD[group.status]}>
              <h2 className={styles.groupHead}>{STATUS_WORD[group.status]}</h2>
              <ul className={styles.rows}>
                {group.items.map((one) => {
                  const look = lookOf(one.status);
                  const progress = progressOf(one);
                  const step: Step | null = nextStep(one);
                  const where = step ? `${step.moduleAt}:${step.lessonAt}` : '';
                  const key = `curriculum:${one.id}`;

                  return (
                    <li
                      key={one.id}
                      className={`${styles.row} ${layer !== null && one.id === openCurriculum ? styles.rowOn : ''}`}
                      style={faceOf(one)}
                    >
                      {renaming === key ? (
                        <div className={styles.rowMain}>
                          <Ring percent={progress.percent} ink={look.ink} accent={look.accent} />
                          {renameField(key, 'curriculum', one.id, one.name, styles.renameRow)}
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={styles.rowMain}
                          aria-label={`${one.name}: stages and lessons`}
                          onClick={(event) => {
                            // A click on the NAME waits a beat, because a
                            // second click there renames rather than opens.
                            // Anywhere else on the row, and from the keyboard
                            // (detail 0), it opens at once.
                            const onName = (event.target as HTMLElement).closest('[data-name]');
                            if (onName && event.detail === 1) {
                              nameClick.current = window.setTimeout(() => showStages(one), DOUBLE);
                            } else if (!onName || event.detail === 0) {
                              showStages(one);
                            }
                          }}
                        >
                          <Ring percent={progress.percent} ink={look.ink} accent={look.accent} />
                          <span className={styles.rowText}>
                            <span
                              className={styles.rowName}
                              data-name
                              title="Double-click to rename"
                              onDoubleClick={() => {
                                if (nameClick.current) window.clearTimeout(nameClick.current);
                                startRename(key, one.name);
                              }}
                            >
                              {one.name}
                            </span>
                            <span className={styles.rowNext}>
                              {step ? (
                                <>
                                  Next: <b>{where}</b> · {step.lesson.name}
                                </>
                              ) : progress.total === 0 ? (
                                'No lessons yet'
                              ) : (
                                `All ${progress.total} lessons done`
                              )}
                            </span>
                          </span>
                        </button>
                      )}

                      {step && (
                        <>
                          <button
                            type="button"
                            className={styles.rowTick}
                            disabled={ticking === step.lesson.id}
                            title={`Mark ${where} ${step.lesson.name} done`}
                            aria-label={`Mark ${one.name} ${where} done`}
                            onClick={() => {
                              setTicking(step.lesson.id);
                              void toggle(step.lesson.id).finally(() => setTicking(null));
                            }}
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            className={styles.rowOpen}
                            aria-label={`Open ${one.name} ${where}: ${step.lesson.name}`}
                            onClick={() => showLesson(one, step.module.id, step.lesson)}
                          >
                            Open
                          </button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {adding ? (
            <form
              className={styles.addForm}
              onSubmit={(event) => {
                event.preventDefault();
                if (!draft.trim()) return;
                void act({ action: 'add-curriculum', name: draft }).then(() => {
                  setDraft('');
                  setAdding(false);
                });
              }}
            >
              <input
                value={draft}
                autoFocus
                placeholder="Curriculum name"
                aria-label="New curriculum name"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Escape' && setAdding(false)}
              />
              <button type="submit" className={styles.primary} disabled={!draft.trim()}>
                Add
              </button>
              <button type="button" className={styles.plain} onClick={() => setAdding(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              className={styles.addButton}
              onClick={() => {
                setAdding(true);
                setDraft('');
              }}
            >
              + New curriculum
            </button>
          )}
        </div>

        {/* --- what is open: the page's place on a phone, the right on a computer */}
        <div className={styles.main}>
          {layer === null && (
            <p className={styles.pick}>
              {curriculums.length > 0
                ? 'Pick a curriculum to see its stages and lessons.'
                : 'Add a curriculum on the left, and its stages and lessons open here.'}
            </p>
          )}

          {/* --- one curriculum: its stages ----------------------------------- */}
          {layer === 'stages' && current && (
            <View backTo="Curriculums" onBack={back}>
              <header className={styles.viewHead}>
                <CurriculumIcon name={current.name} className={styles.titleIcon} size={40} />
                <h2 className={styles.viewTitle}>
                  {renameField(
                    `curriculum:${current.id}`,
                    'curriculum',
                    current.id,
                    current.name,
                    styles.renameTitle,
                  ) ?? (
                    <span
                      title="Double-click to rename"
                      onDoubleClick={() => startRename(`curriculum:${current.id}`, current.name)}
                    >
                      {current.name}
                    </span>
                  )}
                </h2>
                <div className={styles.controls}>
                  <button
                    type="button"
                    className={styles.chip}
                    onClick={() => startRename(`curriculum:${current.id}`, current.name)}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className={styles.chip}
                    aria-label={`${current.name} is ${current.status}. Press to make it ${NEXT_STATUS[current.status] ?? 'active'}`}
                    title={`${current.status} → ${NEXT_STATUS[current.status] ?? 'active'}`}
                    onClick={() =>
                      void act({
                        action: 'set-status',
                        id: current.id,
                        status: NEXT_STATUS[current.status] ?? 'active',
                      })
                    }
                  >
                    {STATUS_MARK[current.status] ?? '▶'} {STATUS_WORD[current.status] ?? 'Active'}
                  </button>
                  <button
                    type="button"
                    className={styles.chip}
                    aria-label={`${current.name} in Ohana: ${current.audience ? AUDIENCE_LABEL[current.audience] : 'not shared'}. Press to change`}
                    title="Who it is for in Ohana"
                    onClick={() =>
                      void act({
                        action: 'set-audience',
                        id: current.id,
                        audience: nextAudience(current.audience),
                      })
                    }
                  >
                    Ohana: {current.audience ? AUDIENCE_LABEL[current.audience] : 'not shared'}
                  </button>
                </div>
              </header>

              {/* The next lesson, in the app's colour: on a computer only, where
              the list's Open button is not beside it in the same glance. */}
              {next && (
                <section className={styles.nextCard} aria-label="Next lesson">
                  <h3 className={styles.nextHead}>
                    Next lesson
                    <span>
                      {next.module.name} · {next.moduleAt}:{next.lessonAt}
                    </span>
                  </h3>
                  <p className={styles.nextName}>{next.lesson.name}</p>
                  <div className={styles.nextButtons}>
                    <button
                      type="button"
                      className={styles.primary}
                      onClick={() => showLesson(current, next.module.id, next.lesson)}
                    >
                      Open the lesson
                    </button>
                    <button
                      type="button"
                      className={styles.plain}
                      disabled={ticking === next.lesson.id}
                      onClick={() => {
                        setTicking(next.lesson.id);
                        void toggle(next.lesson.id).finally(() => setTicking(null));
                      }}
                    >
                      Mark done
                    </button>
                  </div>
                </section>
              )}

              {/* The two links that are NOT stages: one leaves the page for the
              flashcards and the other opens the curriculum's whole list of
              sources. Outlined buttons in a row of their own, apart from the
              steps. They were gold; gold is now only what done wears. */}
              {(current.cards || (current.sources && current.sources.length > 0)) && (
                <div className={styles.goldRow}>
                  {current.cards ? (
                    <a href={`/work/cards/?deck=${current.id}`} className={styles.goldChip}>
                      ★ Cards <span className={styles.count}>{current.cards}</span>
                    </a>
                  ) : null}
                  {current.sources && current.sources.length > 0 ? (
                    <button type="button" className={styles.goldChip} onClick={() => setLayer('sources')}>
                      § Sources <span className={styles.count}>{current.sources.length}</span>
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
                  onKeyDown={(event) => event.key === 'Escape' && (search ? setSearch('') : event.currentTarget.blur())}
                />
                {hits.length > 0 && (
                  <ul className={styles.hits}>
                    {hits.map((hit) => (
                      <li key={hit.lesson.id}>
                        <button type="button" onClick={() => showLesson(current, hit.module.id, hit.lesson)}>
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

              {/* Stages are steps on the route; a track runs BESIDE it (Japanese's
              kanji modules, worked through in parallel), so tracks get their
              own short list. See splitModules() for the naming convention. */}
              {(() => {
                const { stages, tracks } = splitModules(current.modules);
                const list = (modules: Module[], numbered: boolean) => (
                  <ol className={styles.stageList}>
                    {modules.map((module, at) => {
                      const progress = progressOf(module);
                      const holdsNext = next?.module.id === module.id;
                      return (
                        <li key={module.id}>
                          <button
                            type="button"
                            className={holdsNext ? styles.stageRowNext : styles.stageRow}
                            onClick={() => {
                              setOpenStage(module.id);
                              setLayer('grid');
                            }}
                          >
                            {numbered && <span className={styles.stageNumber}>{at + 1}</span>}
                            <span className={styles.stageName}>{module.name}</span>
                            <span className={styles.stageCount}>
                              {progress.total === 0
                                ? 'empty'
                                : progress.done === progress.total
                                  ? 'done'
                                  : `${progress.done} of ${progress.total}`}
                            </span>
                            {holdsNext && next && (
                              <span className={styles.stageNext}>
                                Next: lesson {next.lessonAt} · {next.lesson.name}
                              </span>
                            )}
                            <span className={styles.bar} aria-hidden="true">
                              <i style={{ width: `${progress.percent}%` }} />
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                );
                return (
                  <>
                    {list(stages, true)}
                    {tracks.length > 0 && (
                      <>
                        <h3 className={styles.subHead}>Alongside</h3>
                        {list(tracks, false)}
                      </>
                    )}
                  </>
                );
              })()}
            </View>
          )}

          {/* --- the sources, which belong to the whole curriculum ------------ */}
          {layer === 'sources' && current && (
            <View backTo={current.name} onBack={back}>
              <h2 className={styles.sectionTitle}>Sources</h2>
              <p className={styles.sourcesWhat}>
                What {current.name} is studied from. A lesson&rsquo;s own sources (the chapter, the page, the one video)
                are on the lesson.
              </p>
              {current.sources && current.sources.length > 0 ? (
                <SourceList sources={current.sources} />
              ) : (
                <p className={styles.nothingYet}>Nothing recorded yet.</p>
              )}
            </View>
          )}

          {/* --- one stage: its lessons, as a grid of numbers ----------------- */}
          {layer === 'grid' && current && stage && (
            <View backTo={current.name} onBack={back}>
              <h2 className={styles.sectionTitle}>{stage.name}</h2>
              <ol className={styles.numberGrid}>
                {stage.lessons.map((each, at) => (
                  <li key={each.id}>
                    <button
                      type="button"
                      className={`${styles.cell} ${each.done_on ? styles.cellDone : ''} ${each.id === next?.lesson.id ? styles.cellNext : ''}`}
                      title={each.name}
                      aria-label={`Lesson ${at + 1}: ${each.name}${each.done_on ? ' (done)' : ''}${each.id === next?.lesson.id ? ' (next)' : ''}`}
                      onClick={() => showLesson(current, stage.id, each)}
                    >
                      <span className={styles.cellNumber}>{at + 1}</span>
                      {/* The name beside the number, on a computer only: there is
                      room for it there, and a phone keeps the shape. */}
                      <span className={styles.cellName} aria-hidden="true">
                        {each.name}
                      </span>
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    className={`${styles.cell} ${styles.cellAdd}`}
                    title="Add a lesson"
                    aria-label="Add a lesson"
                    onClick={() => {
                      const name = prompt('Lesson name');
                      if (name?.trim())
                        void act({
                          action: 'add-lesson',
                          module_id: stage.id,
                          name,
                        });
                    }}
                  >
                    <span className={styles.cellNumber}>+</span>
                    <span className={styles.cellName} aria-hidden="true">
                      Add a lesson
                    </span>
                  </button>
                </li>
              </ol>
            </View>
          )}

          {/* --- one lesson -------------------------------------------------- */}
          {layer === 'detail' && current && stage && lesson && (
            <View backTo={stage.name} onBack={back}>
              <article className={styles.lessonPane}>
                {/* Where you are. The STAGE is renamed here, by double-click, as
                it always was. */}
                <p className={styles.lessonWhere}>
                  {current.name} <span className={styles.chev}>›</span>{' '}
                  {renameField(`module:${stage.id}`, 'module', stage.id, stage.name, styles.renameEyebrow) ?? (
                    <span
                      onDoubleClick={() => startRename(`module:${stage.id}`, stage.name)}
                      title="Double-click to rename the stage"
                    >
                      module {stageAt + 1}
                    </span>
                  )}{' '}
                  <span className={styles.chev}>›</span> lesson {lessonAt + 1}
                </p>

                <h2 className={styles.lessonTitle}>
                  {renameField(`lesson:${lesson.id}`, 'lesson', lesson.id, lesson.name, styles.renameTitle) ?? (
                    <span
                      onDoubleClick={() => startRename(`lesson:${lesson.id}`, lesson.name)}
                      title="Double-click to rename"
                    >
                      {lesson.name}
                    </span>
                  )}
                </h2>

                <div className={editingDetail ? styles.lessonBody : styles.lessonBodyWide}>
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
                          className={styles.primary}
                          onClick={() => {
                            void act({
                              action: 'set-detail',
                              id: lesson.id,
                              detail: detailDraft,
                            }).then((result) => {
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
                            });
                          }}
                        >
                          Save
                        </button>
                        <button type="button" className={styles.plain} onClick={() => setEditingDetail(false)}>
                          Cancel
                        </button>
                      </p>
                    </>
                  ) : (
                    <>
                      <section className={styles.lessonDetails}>
                        <h3>Details</h3>
                        {lesson.detail ? (
                          <LessonMarkdown source={lesson.detail} />
                        ) : (
                          <p className={styles.nothingYet}>Nothing written yet.</p>
                        )}
                      </section>

                      {/* THE LESSON'S OWN SOURCES, AND ONLY THOSE. The
                      curriculum's whole list is behind § Sources on the
                      curriculum's view, which is where a list that belongs to
                      every lesson belongs. */}
                      <section className={styles.lessonSection}>
                        <h3>Sources</h3>
                        {lesson.sources && lesson.sources.length > 0 ? (
                          <SourceList sources={lesson.sources} />
                        ) : (
                          <p className={styles.nothingYet}>Nothing recorded for this lesson yet.</p>
                        )}
                      </section>

                      {/* Visual examples, where the detail has images in it.
                      Nothing else on a lesson carries a picture, so a heading
                      over an empty space on every other lesson would be worse
                      than no heading. */}
                      {imagesIn(lesson.detail).length > 0 && (
                        <section className={styles.lessonSection}>
                          <h3>Visual examples</h3>
                          <div className={styles.visuals}>
                            {imagesIn(lesson.detail).map((image) => (
                              <figure key={image.src}>
                                {/* eslint-disable-next-line @next/next/no-img-element -- static export, and the path is whatever the lesson's Markdown names */}
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

                {/* Held to the foot of the screen, so a long lesson never pushes
                its own buttons out of reach. */}
                {!editingDetail && (
                  <footer className={styles.lessonActions}>
                    <button
                      type="button"
                      className={`${styles.roundButton} ${lesson.done_on ? styles.roundDone : ''}`}
                      title={lesson.done_on ? 'Done — press to undo' : 'Mark done'}
                      aria-label={lesson.done_on ? 'Mark not done' : 'Mark done'}
                      aria-pressed={Boolean(lesson.done_on)}
                      onClick={() => void toggle(lesson.id)}
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
                        void act({
                          action: 'remove',
                          kind: 'lesson',
                          id: lesson.id,
                        }).then(() => {
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
            </View>
          )}

          {/* A view whose curriculum, stage or lesson has gone (deleted elsewhere,
          or a stale deep link) falls back to the list rather than a blank. */}
          {layer !== null && (!current || (layer === 'grid' && !stage) || (layer === 'detail' && !lesson)) && (
            <p className={styles.status}>
              That is not here any more.{' '}
              <button type="button" className={styles.plain} onClick={close}>
                Back to the list
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * One step of the drill-down, taking the page's place on a phone and the
 * right-hand side on a computer.
 *
 * Not an overlay: on a phone a dimmed layer over a dimmed layer is three
 * stacked cards in a small window, and a full-screen view is the whole screen
 * for the thing you went in for. The back link names where it goes.
 */
function View({ backTo, onBack, children }: { backTo: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <section className={styles.view}>
      <button type="button" className={styles.back} onClick={onBack}>
        <span aria-hidden="true">‹</span> {backTo}
      </button>
      {children}
    </section>
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
