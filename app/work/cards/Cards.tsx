'use client';

import { useCallback, useEffect, useState } from 'react';
import LessonMarkdown, { Line } from '@/components/LessonMarkdown';
import { CARD_KINDS, NEW_PER_DAY, type Card, type Deck } from '@/lib/cards';
import { statusLook } from '@/lib/curriculum-card';
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
}

export default function Cards() {
  const [data, setData] = useState<Payload | null>(null);
  const [deck, setDeck] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (which: number | null) => {
    try {
      const response = await fetch(
        `/work/api/cards${which ? `?deck=${which}` : ''}`,
        { cache: 'no-store' },
      );
      setData((await response.json()) as Payload);
    } catch {
      setError('Could not reach the cards.');
    }
  }, []);

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
          body: JSON.stringify({ action: 'answer', id: card.id, button }),
        });
        const result = (await response.json()) as Partial<Payload> & { error?: string };
        if (!response.ok) {
          setError(result.error ?? 'That did not work.');
          return;
        }
        setError(null);
        setShown(false);
        setData((was) =>
          was ? { ...was, decks: result.decks ?? was.decks, card: result.card ?? null } : was,
        );
      } catch {
        setError('That did not work.');
      } finally {
        setBusy(false);
      }
    },
    [busy, card],
  );

  /* The keyboard, which is the point of a review session: space reveals, then
   * space again means Good. One key for the common case, because a hand that
   * has to travel is a hand that stops after fifty cards. */
  useEffect(() => {
    if (deck === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!card) return;

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
      <div className={styles.page}>
        {error && <p className={styles.error}>{error}</p>}
        <Decks
          decks={data.decks}
          onPick={(id) => {
            setShown(false);
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
      </div>
    );
  }

  const current = data.decks.find((one) => one.id === deck);

  return (
    <div className={styles.page}>
      <p className={styles.crumb}>
        <button type="button" onClick={() => setDeck(null)}>
          ← {current?.name ?? 'Decks'}
        </button>
        {current && (
          <span className={styles.remaining}>
            {current.due + Math.min(current.fresh, current.new_per_day ?? NEW_PER_DAY)} to go
          </span>
        )}
      </p>

      {error && <p className={styles.error}>{error}</p>}

      {card ? (
        <Review card={card} shown={shown} busy={busy} onShow={() => setShown(true)} onAnswer={answer} />
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

  return (
    <ul className={styles.decks}>
      {decks.map((deck) => {
        const waiting = deck.due + Math.min(deck.fresh, deck.new_per_day ?? NEW_PER_DAY);
        return (
          <li key={deck.id}>
            <button
              type="button"
              className={styles.deck}
              onClick={() => onPick(deck.id)}
              // The same colours the curriculum's own card carries on the
              // other page, so a deck reads as the thing it came from rather
              // than as a row in a list — and a paused deck looks paused.
              style={
                {
                  '--deck': statusLook(deck.status).accent,
                  '--deck-ink': statusLook(deck.status).ink,
                  '--deck-face': statusLook(deck.status).background,
                } as React.CSSProperties
              }
            >
              <span className={styles.deckName}>{deck.name}</span>
              <span className={waiting > 0 ? styles.waiting : styles.clear}>
                {waiting > 0 ? waiting : '✓'}
              </span>
            </button>
            <p className={styles.deckMeta}>
              {deck.due} due · {deck.fresh} new · {deck.locked} locked
              <label>
                new/day
                <input
                  type="number"
                  min={0}
                  max={500}
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
  );
}

/** One card: the prompt, the front, and then the answer. */
function Review({
  card,
  shown,
  busy,
  onShow,
  onAnswer,
}: {
  card: Card;
  shown: boolean;
  busy: boolean;
  onShow: () => void;
  onAnswer: (button: 'again' | 'good') => void;
}) {
  const kind = CARD_KINDS[card.kind];

  return (
    <div className={styles.card}>
      <p className={styles.prompt}>{kind.prompt}</p>

      {/* The front is ruby-capable, which is the whole reason ruby exists: a
          kanji card showing its reading on the next line is two things to
          read, and the reading is the answer anyway. */}
      <p className={`${styles.front} ${card.kind === 'sentence' ? styles.frontSentence : ''}`}>
        <Line text={card.front} />
      </p>

      {!shown ? (
        <button type="button" className={styles.reveal} onClick={onShow}>
          Show <kbd>space</kbd>
        </button>
      ) : (
        <>
          <div className={styles.back}>
            {card.reading && <p className={styles.reading}>{card.reading}</p>}
            <p className={styles.meaning}>
              <Line text={card.back} />
            </p>
            {card.extra && <LessonMarkdown source={card.extra} />}
          </div>

          <p className={styles.buttons}>
            <button type="button" disabled={busy} onClick={() => onAnswer('again')}>
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
          </p>
        </>
      )}
    </div>
  );
}
