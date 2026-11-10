'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import LessonMarkdown, { Line } from '@/components/LessonMarkdown';
import { CARD_KINDS, NEW_PER_DAY, type Card, type CardKind, type Deck } from '@/lib/cards';
import { statusLook } from '@/lib/curriculum-card';
import { NOTE_SECTION } from '@/lib/card-note';
import { emptyScene, type Scene } from '@/lib/sketch';
import Note from './Note';
import styles from './cards.module.css';

// Two screens: the decks, and one card.
//
// Everything about this page is an answer to why Anki went unused — "it's in a
// separate window", "finding the right decks is almost impossible", "i have no
// idea how it works", "learning it takes as long as learning godot". So: it is
// in the backend, a deck is a curriculum, there is nothing to configure but
// how many new cards a day, and there are two buttons.
//
// One card is held at a time and answering it returns the next from the
// server. That keeps the queue's order a server decision — reviews before new
// cards, within the day's allowance — and means a refresh mid-session loses
// nothing, because there is nothing on the client to lose.

interface Payload {
  configured: boolean;
  today: string;
  decks: Deck[];
  card: Card | null;
  /** The card's note, as stored. Absent where nothing has been written yet. */
  note: { scene: string; height: number } | null;
}

export default function Cards() {
  const [data, setData] = useState<Payload | null>(null);
  const [deck, setDeck] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* The note being written, held here rather than in the panel: it is sent
   * with the answer, so the thing that posts it has to own it. */
  const [note, setNote] = useState<Scene>(emptyScene());
  /* How tall one section is, measured by the panel and reported back up, so
   * the server records the sections that were actually drawn. */
  const [noteSection, setNoteSection] = useState(NOTE_SECTION);
  /* Cards answered since the deck was opened, for the progress bar. */
  const [answered, setAnswered] = useState(0);
  /* Whether the pad is pulled up, on a phone. Kept across cards: someone
   * writing every card wants it to stay up. */
  const [padOpen, setPadOpen] = useState(false);
  const phone = usePhone();

  /* The note arrives with its card and is adopted in the SAME update, never in
   * an effect afterwards.
   *
   * It was an effect, and that was a real bug: the render that handed the
   * panel a new card still had the previous card's note in state, so the panel
   * counted that note's sections, and the next answer posted it back against
   * the wrong card. One card showing the one before it, sections appearing
   * from nowhere, and writing landing in neither were all this.
   *
   * A scene that will not parse becomes an empty one and is said out loud: a
   * blank panel that silently overwrites attempts already saved is worse than
   * an error message. */
  const adopt = useCallback((payload: Payload | null): Payload | null => {
    if (!payload) return payload;
    if (!payload.note) {
      setNote(emptyScene());
      return payload;
    }
    try {
      setNote(JSON.parse(payload.note.scene) as Scene);
    } catch {
      setNote(emptyScene());
      setError('The note saved against this card could not be read.');
    }
    return payload;
  }, []);

  const load = useCallback(async (which: number | null) => {
    try {
      const response = await fetch(
        `/work/api/cards${which ? `?deck=${which}` : ''}`,
        { cache: 'no-store' },
      );
      setData(adopt((await response.json()) as Payload));
    } catch {
      setError('Could not reach the cards.');
    }
  }, [adopt]);

  /* ?deck=N opens straight into a deck, which is how the gold Cards card on
   * the curriculums page arrives. Read from the location rather than with
   * useSearchParams: this is a statically exported page, so the query string
   * only exists in the browser anyway, and the hook would need a Suspense
   * boundary to say the same thing. */
  useEffect(() => {
    const asked = Number(new URLSearchParams(window.location.search).get('deck'));
    if (Number.isInteger(asked) && asked > 0) setDeck(asked);
  }, []);

  useEffect(() => {
    void load(deck);
  }, [load, deck]);

  const card = data?.card ?? null;


  /** Answer, and take whatever comes back as the next card. */
  const answer = useCallback(
    async (button: 'again' | 'good') => {
      if (!card || busy) return;
      setBusy(true);
      try {
        const response = await fetch('/work/api/cards', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            action: 'answer',
            id: card.id,
            button,
            // Saved by answering, which is the whole arrangement — there is no
            // Save button to forget. See the note handling in the endpoint.
            note: JSON.stringify(note),
            noteSection,
          }),
        });
        const result = (await response.json()) as Partial<Payload> & {
          error?: string;
          noteSaved?: boolean | null;
        };
        if (!response.ok) {
          setError(result.error ?? 'That did not work.');
          return;
        }
        // The one case where the review landed and the writing did not.
        setError(
          result.noteSaved === false
            ? 'Answered, but the note could not be saved — what you wrote is not in it.'
            : null,
        );
        setShown(false);
        if (button === 'good') setAnswered((was) => was + 1);
        setData((was) =>
          adopt(
            was
              ? {
                  ...was,
                  decks: result.decks ?? was.decks,
                  card: result.card ?? null,
                  note: result.note ?? null,
                }
              : was,
          ),
        );
      } catch {
        setError('That did not work.');
      } finally {
        setBusy(false);
      }
    },
    [adopt, busy, card, note, noteSection],
  );

  /* The keyboard, which is the point of a review session: space reveals, then
   * space again means Good. One key for the common case, because a hand that
   * has to travel is a hand that stops after fifty cards. */
  useEffect(() => {
    if (deck === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!card) return;

      /* Not while typing in the note. Space means Good everywhere on this
       * page except inside that textarea, where it has to mean a space — and
       * the shortcut that answers the card would otherwise file it away
       * mid-word. */
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-note-input]')) return;

      if (!shown) {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          setShown(true);
        }
        return;
      }

      if (event.key === '1' || event.key.toLowerCase() === 'a') {
        event.preventDefault();
        void answer('again');
      } else if (event.key === '2' || event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        void answer('good');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer, card, deck, shown]);

  if (!data) return <p className={styles.quiet}>Reading the decks…</p>;

  if (!data.configured) {
    return <p className={styles.quiet}>No database bound, so there are no cards.</p>;
  }

  if (deck === null) {
    return (
      <div className={styles.decksPage}>
        {error && <p className={styles.error}>{error}</p>}
        <Decks
          decks={data.decks}
          onPick={(id) => {
            setShown(false);
            setAnswered(0);
            setDeck(id);
          }}
          onCap={async (id, value) => {
            await fetch('/work/api/cards', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ action: 'new-per-day', curriculum_id: id, value }),
            });
            void load(null);
          }}
        />

        {data.decks.length > 0 && (
          <AddCard
            decks={data.decks}
            onAdded={() => void load(null)}
            onError={setError}
          />
        )}
      </div>
    );
  }

  const current = data.decks.find((one) => one.id === deck);
  const toGo = current ? waitingIn(current) : 0;
  /* Progress through THIS sitting: answered against answered plus what is
   * left. An Again sends a card back into the queue, so the bar can stand
   * still on a bad run — which is the truth about the session. */
  const progress = answered + toGo === 0 ? 1 : answered / (answered + toGo);

  return (
    <div className={styles.review}>
      <div className={styles.top}>
        <p className={styles.crumb}>
          <button type="button" onClick={() => setDeck(null)}>
            ← {current?.name ?? 'Decks'}
          </button>
          {current && <span className={styles.remaining}>{toGo} to go</span>}
        </p>
        <div
          className={styles.bar}
          role="progressbar"
          aria-label="Progress through this deck"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <i style={{ width: `${progress * 100}%` }} />
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>

      {card ? (
        /* His pick, 2026-11-10 (redesign page, Cards: A) — a review made for
         * thumbs. On a phone it is a column: the card big in the middle, the
         * writing pad as a strip under it that pulls up for room, and two
         * large buttons at the foot where a thumb already is. On a computer
         * the split stays — card and buttons on one side, the pad on the
         * other, side by side and equal, because halves are the only
         * arrangement tried that gives a revealed answer and the writing both
         * enough room. The grid areas in the CSS do both from one tree. */
        <div className={styles.pair}>
          <Review card={card} shown={shown} busy={busy} onAnswer={answer} />

          <div className={styles.pad} data-open={padOpen}>
            <PadHandle open={padOpen} onToggle={setPadOpen} />
            {/* Keyed, so a new card gets a new panel rather than one carrying
                the last card's tool, section and position. */}
            <Note
              key={card.id}
              scene={note}
              onChange={setNote}
              onSection={setNoteSection}
              fingerDraws={phone}
            />
          </div>

          <Buttons shown={shown} busy={busy} onShow={() => setShown(true)} onAnswer={answer} />
        </div>
      ) : (
        <div className={styles.done}>
          <p>Nothing due.</p>
          <p className={styles.quiet}>
            {current && current.locked > 0
              ? `${current.locked} card${current.locked === 1 ? '' : 's'} waiting on lessons not done yet.`
              : 'Come back tomorrow.'}
          </p>
        </div>
      )}
    </div>
  );
}

/** What a deck has waiting today: what is due, plus new cards up to the allowance. */
function waitingIn(deck: Deck): number {
  return deck.due + Math.min(deck.fresh, deck.new_per_day ?? NEW_PER_DAY);
}

/* The phone layout, as a fact the script can read — the CSS decides the
 * layout, but the pad has to know whether a finger draws or pages (see
 * Note.tsx), and that follows the same breakpoint. */
const PHONE = '(max-width: 720px)';

function usePhone(): boolean {
  return useSyncExternalStore(
    (changed) => {
      const query = window.matchMedia(PHONE);
      query.addEventListener('change', changed);
      return () => query.removeEventListener('change', changed);
    },
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
}

/**
 * The grip at the top of the pad, on a phone only. A tap toggles it; a drag
 * up opens it and a drag down closes it, which is what a pull-up strip is
 * expected to do. On a computer the pad is a full half and this is hidden.
 */
function PadHandle({ open, onToggle }: { open: boolean; onToggle: (open: boolean) => void }) {
  const from = useRef<number | null>(null);
  const dragged = useRef(false);

  return (
    <button
      type="button"
      className={styles.padHandle}
      aria-expanded={open}
      onPointerDown={(event) => {
        from.current = event.clientY;
        dragged.current = false;
      }}
      onPointerUp={(event) => {
        if (from.current === null) return;
        const moved = event.clientY - from.current;
        from.current = null;
        if (Math.abs(moved) > 24) {
          dragged.current = true;
          onToggle(moved < 0);
        }
      }}
      onPointerCancel={() => {
        from.current = null;
      }}
      onClick={() => {
        // A drag has already decided; the click that follows it must not undo it.
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        onToggle(!open);
      }}
    >
      <span className={styles.grip} aria-hidden="true" />
      {open ? 'Give the card its room back' : 'Write here · pull up for more room'}
    </button>
  );
}

/** The decks, which are the curriculums that have cards. */
function Decks({
  decks,
  onPick,
  onCap,
}: {
  decks: Deck[];
  onPick: (id: number) => void;
  onCap: (id: number, value: number | null) => void;
}) {
  if (decks.length === 0) {
    return (
      <p className={styles.quiet}>
        No cards yet. A curriculum&rsquo;s lessons make its cards, so a deck appears when one is
        built with them.
      </p>
    );
  }

  const total = decks.reduce((sum, deck) => sum + waitingIn(deck), 0);

  return (
    <section className={styles.decksBlock}>
      <h2 className={styles.heading}>
        Decks
        <span>{total > 0 ? `${total} to review today` : 'All clear today'}</span>
      </h2>
      <ul className={styles.decks}>
        {decks.map((deck) => {
          const waiting = waitingIn(deck);
          const look = statusLook(deck.status);
          return (
            <li
              key={deck.id}
              className={styles.deck}
              // The same colours the curriculum's own card carries on the
              // other page, so a deck reads as the thing it came from rather
              // than as a row in a list — and a paused deck looks paused.
              style={
                {
                  '--deck': look.accent,
                  '--deck-ink': look.ink,
                  '--deck-face': look.background,
                } as React.CSSProperties
              }
            >
              {/* The whole row is the button (its ::after covers the row), and
                  the new-a-day box sits above that layer so it can still be
                  typed in — an input inside a button is not allowed. */}
              <button type="button" className={styles.deckOpen} onClick={() => onPick(deck.id)}>
                <span className={styles.deckName}>{deck.name}</span>
                <span className={waiting > 0 ? styles.waiting : styles.clear}>
                  {waiting > 0 ? waiting : '✓'}
                  <span className={styles.hidden}>
                    {waiting > 0 ? ' waiting' : ' nothing waiting'}
                  </span>
                </span>
              </button>
              <p className={styles.deckMeta}>
                <span>
                  {deck.due} due · {deck.fresh} new · {deck.locked} locked
                </span>
                <label>
                  New a day
                  <input
                    type="number"
                    min={0}
                    max={500}
                    inputMode="numeric"
                    defaultValue={deck.new_per_day ?? NEW_PER_DAY}
                    onBlur={(event) => {
                      const raw = event.target.value.trim();
                      onCap(deck.id, raw === '' ? null : Number(raw));
                    }}
                  />
                </label>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * A card by hand — the mining form.
 *
 * Every other card in the system is made by the lesson that teaches it. This
 * is for the ones you meet in the wild: a word from a reader, from a podcast,
 * from a conversation. A hand-added card has no lesson, so it is unlocked the
 * moment it is made.
 *
 * Folded away by default. It is the rarer of the two things done on this
 * screen, and a form sitting open above the decks would make adding cards look
 * like the point of the page rather than reviewing them.
 */
function AddCard({
  decks,
  onAdded,
  onError,
}: {
  decks: Deck[];
  onAdded: () => void;
  onError: (message: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [deck, setDeck] = useState(decks[0]?.id ?? 0);
  const [kind, setKind] = useState<CardKind>('word');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [reading, setReading] = useState('');
  const [extra, setExtra] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <p className={styles.addRow}>
        <button type="button" className={styles.addToggle} onClick={() => setOpen(true)}>
          + Add a card
        </button>
      </p>
    );
  }

  return (
    <form
      className={styles.add}
      onSubmit={async (event) => {
        event.preventDefault();
        if (!front.trim() || !back.trim() || busy) return;
        setBusy(true);
        try {
          const response = await fetch('/work/api/cards', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              action: 'add',
              curriculum_id: deck,
              kind,
              front,
              back,
              reading,
              extra,
            }),
          });
          const result = (await response.json()) as { error?: string };
          if (!response.ok) {
            onError(result.error ?? 'That did not work.');
            return;
          }
          onError(null);
          // Front and back cleared, deck and kind kept: mining is done in
          // runs, and re-choosing the same deck for every word is the kind of
          // friction that stops it being done at all.
          setFront('');
          setBack('');
          setReading('');
          setExtra('');
          onAdded();
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className={styles.addHead}>
        <span>Add a card</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close">
          ×
        </button>
      </p>

      <label>
        Deck
        <select value={deck} onChange={(event) => setDeck(Number(event.target.value))}>
          {decks.map((one) => (
            <option key={one.id} value={one.id}>
              {one.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Kind
        <select value={kind} onChange={(event) => setKind(event.target.value as CardKind)}>
          {Object.entries(CARD_KINDS).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Front
        <input
          value={front}
          onChange={(event) => setFront(event.target.value)}
          placeholder="日本"
          autoFocus
        />
      </label>

      <label>
        Back
        <input value={back} onChange={(event) => setBack(event.target.value)} placeholder="Japan" />
      </label>

      <label>
        Reading
        <input
          value={reading}
          onChange={(event) => setReading(event.target.value)}
          placeholder="にほん"
        />
      </label>

      <label className={styles.addWide}>
        Extra
        <textarea
          value={extra}
          onChange={(event) => setExtra(event.target.value)}
          placeholder="The sentence you met it in. Markdown, and [漢字]{かんじ} for ruby."
          rows={2}
        />
      </label>

      <p className={styles.addActions}>
        <button type="submit" disabled={busy || !front.trim() || !back.trim()}>
          Add
        </button>
      </p>
    </form>
  );
}

/** Past this many pixels sideways, a swipe on a revealed card answers it. */
const SWIPE = 80;

/**
 * One card: the prompt, the front, and then the answer.
 *
 * Swiping a revealed card answers it — left for Again, right for Good. Only a
 * finger swipes, and only on the card itself: the pad is a sibling of this
 * element, not inside it, so a stroke drawn on the pad can never reach these
 * handlers and turn into an answer. touch-action: pan-y in the CSS leaves an
 * up-and-down drag to scroll a long answer.
 */
function Review({
  card,
  shown,
  busy,
  onAnswer,
}: {
  card: Card;
  shown: boolean;
  busy: boolean;
  onAnswer: (button: 'again' | 'good') => void;
}) {
  const kind = CARD_KINDS[card.kind];
  const from = useRef<{ x: number; y: number; id: number } | null>(null);
  const [drag, setDrag] = useState(0);

  const lean = Math.abs(drag) < SWIPE ? undefined : drag < 0 ? 'again' : 'good';

  /* The card fills its cell, so revealing cannot change its size, and what is
   * inside it is centred vertically. The buttons are a row of their own (see
   * Buttons) so they do not move when the middle grows — that is the moment a
   * hand is already on its way to them. */
  return (
    <div
      className={styles.card}
      data-lean={lean}
      data-dragging={drag !== 0 || undefined}
      style={drag ? { transform: `translateX(${drag}px) rotate(${drag / 40}deg)` } : undefined}
      onPointerDown={(event) => {
        if (event.pointerType !== 'touch' || !shown || busy) return;
        from.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
      }}
      onPointerMove={(event) => {
        if (!from.current || event.pointerId !== from.current.id) return;
        setDrag(event.clientX - from.current.x);
      }}
      onPointerUp={(event) => {
        if (!from.current || event.pointerId !== from.current.id) return;
        const dx = event.clientX - from.current.x;
        const dy = event.clientY - from.current.y;
        from.current = null;
        setDrag(0);
        if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy) * 1.5) {
          onAnswer(dx < 0 ? 'again' : 'good');
        }
      }}
      onPointerCancel={() => {
        // The browser took the gesture for a scroll.
        from.current = null;
        setDrag(0);
      }}
    >
      <div className={styles.face}>
        <p className={styles.prompt}>{kind.prompt}</p>

        {/* Ruby-capable, which is the whole reason ruby exists: a kanji card
            showing its reading on the next line is two things to read, and the
            reading is the answer anyway. */}
        <p className={`${styles.front} ${card.kind === 'sentence' ? styles.frontSentence : ''}`}>
          <Line text={card.front} />
        </p>

        {shown && (
          <>
            {card.reading && <p className={styles.reading}>{card.reading}</p>}
            <p className={styles.meaning}>
              <Line text={card.back} />
            </p>
            {card.extra && <LessonMarkdown source={card.extra} />}
          </>
        )}
      </div>
    </div>
  );
}

/** Show, then Again and Good: large, and at the foot on a phone. */
function Buttons({
  shown,
  busy,
  onShow,
  onAnswer,
}: {
  shown: boolean;
  busy: boolean;
  onShow: () => void;
  onAnswer: (button: 'again' | 'good') => void;
}) {
  return (
    <p className={styles.buttons}>
      {!shown ? (
        <button type="button" className={styles.reveal} onClick={onShow}>
          Show <kbd>space</kbd>
        </button>
      ) : (
        <>
          <button
            type="button"
            disabled={busy}
            className={styles.again}
            onClick={() => onAnswer('again')}
          >
            Again <kbd>1</kbd>
          </button>
          <button
            type="button"
            disabled={busy}
            className={styles.good}
            onClick={() => onAnswer('good')}
          >
            Good <kbd>space</kbd>
          </button>
        </>
      )}
    </p>
  );
}
