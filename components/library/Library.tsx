'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LIBRARY_NAME, type Collection } from '@/lib/library';
import type { GameState } from './boardgame';
import type { Game } from './gamesroom';
import { createLibrary, type IndexWall, type Library as LibraryApi, type LibraryState, type MediaState } from './scene';
import styles from './Library.module.css';

// The library's canvas and the few words laid over it: its name until you
// start moving, what you are holding, a line saying what a click will do, and
// a panel for each player while a disc is in it. There are no buttons for
// handling things; everything is done by clicking the thing itself.

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d={d} fill="currentColor" />
  </svg>
);
const PREV = 'M6 5h2v14H6zM20 5v14L9 12z';
const NEXT = 'M16 5h2v14h-2zM4 5v14l11-7z';
const PLAY = 'M7 4v16l13-8z';
const PAUSE = 'M6 4h4v16H6zM14 4h4v16h-4z';
const EJECT = 'M12 5l7 9H5zM5 16h14v3H5z';

const mmss = (s: number) => {
    // Hours once there are any: a lecture or an episode runs past sixty minutes.
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = String(Math.floor(s % 60)).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
  };

function Panel({
  label,
  m,
  act,
  prefix,
  frameHost,
}: {
  label: string;
  m: MediaState;
  act: (id: string) => void;
  prefix: 'cd' | 'dvd';
  /** Where the YouTube player goes, when it plays through one: YouTube's terms want it seen. */
  frameHost?: (el: HTMLDivElement | null) => void;
}) {
  const isCd = prefix === 'cd';
  return (
    <section className={styles.panel} aria-label={label}>
      <p className={styles.kind}>{label}</p>
      {m.embedded && frameHost && <div ref={frameHost} className={styles.frame} />}
      <p className={styles.track}>{isCd ? `${m.track + 1}. ${m.tracks[m.track]}` : m.title}</p>
      <p className={styles.by}>{isCd ? `${m.title} · ${m.by}` : m.by}</p>
      {m.credit && (
        <p className={styles.credit}>
          {isCd ? 'Recording' : 'Lecture'}:{' '}
          {m.credit.url ? (
            <a href={m.credit.url} target="_blank" rel="noopener noreferrer">
              {m.credit.name}
            </a>
          ) : (
            m.credit.name
          )}
          {m.credit.video && (
            <>
              {' · '}
              <a href={m.credit.video} target="_blank" rel="noopener noreferrer">
                Watch on YouTube
              </a>
            </>
          )}
          {!!m.credit.also?.length && (
            <span className={styles.note}>
              {' · Also posted by '}
              {m.credit.also.map((x, i) => (
                <span key={x.url}>
                  {i > 0 && ', '}
                  <a href={x.url} target="_blank" rel="noopener noreferrer">
                    {x.name}
                  </a>
                </span>
              ))}
            </span>
          )}
        </p>
      )}
      <div className={styles.controls}>
        {isCd && (
          <button type="button" onClick={() => act('prev-track')} aria-label="Previous track">
            {icon(PREV)}
          </button>
        )}
        <button type="button" onClick={() => act(isCd ? 'play' : 'dvd-play')} aria-label={m.playing ? 'Pause' : 'Play'}>
          {icon(m.playing ? PAUSE : PLAY)}
        </button>
        {isCd && (
          <button type="button" onClick={() => act('next-track')} aria-label="Next track">
            {icon(NEXT)}
          </button>
        )}
        <button type="button" onClick={() => act(`eject-${prefix}`)} aria-label="Eject">
          {icon(EJECT)}
        </button>
        <span className={styles.time}>
          {mmss(m.time)} / {mmss(m.duration)}
        </span>
      </div>
      {isCd && m.tracks.length > 1 && (
        <ol className={styles.list}>
          {m.tracks.map((t, i) => (
            <li key={i}>
              <button type="button" className={i === m.track ? styles.current : undefined} onClick={() => act(`track:${i}`)}>
                {t}
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** The games room's panel while a game is in: what it is, how it is doing, and the way out. */
function ArcadePanel({ a, act }: { a: NonNullable<LibraryState['arcade']>; act: (id: string) => void }) {
  return (
    <section className={styles.panel} aria-label="Now playing">
      <p className={styles.kind}>Now playing · {a.console}</p>
      <p className={styles.track}>{a.title}</p>
      <p className={styles.by} aria-live="polite">
        {a.status}
      </p>
      <p className={styles.credit}>Click the screen first. Arrow keys move; Z and X are the main buttons; Enter is Start. A controller works too.</p>
      <div className={styles.gameButtons}>
        {!a.handheld && (
          <button type="button" onClick={() => act('arcade-full')}>
            Full screen
          </button>
        )}
        <button type="button" onClick={() => act('arcade-stop')}>
          Get up
        </button>
      </div>
    </section>
  );
}

/** The games table's panel: which game, how hard, and how it stands. */
function GamePanel({ g, act }: { g: GameState; act: (id: string) => void }) {
  return (
    <section className={styles.panel} aria-label="Games table">
      <p className={styles.kind}>Games table</p>
      <div className={styles.choice} role="group" aria-label="Game">
        <button type="button" aria-pressed={g.kind === 'chess'} onClick={() => act('game-chess')}>
          Chess
        </button>
        <button type="button" aria-pressed={g.kind === 'checkers'} onClick={() => act('game-checkers')}>
          Checkers
        </button>
      </div>
      <div className={styles.choice} role="group" aria-label="How hard">
        {['Easy', 'Medium', 'Hard'].map((name, i) => (
          <button key={name} type="button" aria-pressed={g.level === i} onClick={() => act(`game-level:${i}`)}>
            {name}
          </button>
        ))}
      </div>
      <p className={styles.track} aria-live="polite">
        {g.status}
      </p>
      <p className={styles.by}>You play {g.kind === 'chess' ? 'white' : 'the ivory men'}, from the near side, and move first.</p>
      <div className={styles.gameButtons}>
        <button type="button" onClick={() => act('game-new')}>
          {g.over ? 'Play again' : 'New game'}
        </button>
        <button type="button" onClick={() => act('game-leave')}>
          Stand up
        </button>
      </div>
    </section>
  );
}

export default function Library({ collection, games }: { collection: Collection; games: Game[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<LibraryApi | null>(null);
  const [state, setState] = useState<LibraryState | null>(null);
  const [started, setStarted] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [index, setIndex] = useState<IndexWall[]>([]);
  // Built once per mount. A new copy of the same collection (a refresh of the
  // page's data) must not tear the library down and lose what you are holding.
  const first = useRef(collection);
  const firstGames = useRef(games);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const lib = createLibrary(canvas, first.current, setState, firstGames.current);
    api.current = lib;
    setIndex(lib.index);
    // A handle for driving the library from a test browser. Development only.
    if (process.env.NODE_ENV !== 'production') (window as unknown as { __library?: LibraryApi }).__library = lib;
    return () => {
      lib.dispose();
      api.current = null;
    };
  }, []);

  const act = (id: string) => api.current?.act(id);
  const go = (target: number) => {
    setIndexOpen(false);
    setStarted(true);
    act(`goto:${target}`);
    canvasRef.current?.focus({ preventScroll: true });
  };
  // A stable ref callback, so the frame is not taken out and put back on every render.
  const cdHost = useCallback((el: HTMLDivElement | null) => api.current?.setCdHost(el), []);
  const named = started || indexOpen || (!!state && state.mode !== 'walk');

  return (
    <div className={styles.library}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        tabIndex={0}
        aria-label={`${LIBRARY_NAME}: a long hall shelved floor to ceiling, with videos round a projector screen, books opposite, music and podcasts at the ends. Drag to look around, W A S D to walk, click anything to take it down, or open the Index to go straight to a section. Escape steps back.`}
        onPointerDown={() => setStarted(true)}
        onKeyDown={() => setStarted(true)}
      />

      <h1 className={`${styles.name} ${named ? styles.gone : ''}`}>{LIBRARY_NAME}</h1>

      {state?.hover && !state.busy && (
        <div className={styles.held} aria-hidden="true">
          <p className={styles.kind}>{state.hover.kind}</p>
          <h2 className={styles.title}>{state.hover.title}</h2>
          {state.hover.subtitle && <p className={styles.by}>{state.hover.subtitle}</p>}
          {state.hover.place && <p className={styles.page}>{state.hover.place}</p>}
        </div>
      )}

      {state?.item && state.mode !== 'walk' && (
        <div className={styles.held}>
          <p className={styles.kind}>{({ cd: 'CD', vinyl: 'Single', dvd: 'DVD', book: 'Book' } as const)[state.item.kind]}</p>
          <h2 className={styles.title}>{state.item.title}</h2>
          <p className={styles.by}>{state.item.subtitle}</p>
          {state.page && <p className={styles.page}>{state.page}</p>}
        </div>
      )}

      {state && !state.busy && (
        <p className={styles.hint} aria-live="polite">
          {state.hint}
          {state.mode !== 'walk' && <span className={styles.esc}> · Esc steps back</span>}
        </p>
      )}

      <nav className={styles.indexNav} aria-label="Index">
        <button type="button" className={styles.indexButton} aria-expanded={indexOpen} onClick={() => setIndexOpen((o) => !o)}>
          Index
        </button>
        {indexOpen && (
          <div className={styles.index}>
            {index.map((w) => (
              <section key={w.wall}>
                <h2 className={styles.indexWall}>{w.wall}</h2>
                {w.sections.map((sec) => (
                  <div key={sec.title} className={styles.indexSection}>
                    <button type="button" className={styles.indexSectionTitle} onClick={() => go(sec.target)}>
                      {sec.title}
                    </button>
                    <ul>
                      {sec.groups.map((g) => (
                        <li key={g.title}>
                          <button type="button" onClick={() => go(g.target)}>
                            {g.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </nav>

      <div className={styles.panels}>
        {state?.cd && <Panel label="Now playing" m={state.cd} act={act} prefix="cd" frameHost={cdHost} />}
        {state?.dvd && <Panel label="Now showing" m={state.dvd} act={act} prefix="dvd" />}
        {state?.game && <GamePanel g={state.game} act={act} />}
        {state?.arcade && <ArcadePanel a={state.arcade} act={act} />}
      </div>
    </div>
  );
}
