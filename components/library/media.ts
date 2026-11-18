// What a disc plays through: either a file on the site (an <audio> or <video>
// element), or a YouTube embed.
//
// Master Roachi's ruling (18 Nov 2026, through Fjord): the real collection is
// embedded from YouTube rather than downloaded. Two rules follow from
// YouTube's terms, and the library keeps both:
//   - the player is always visible, at least 200 × 200, never a hidden
//     player feeding sound: a CD's player sits in its Now playing panel, a
//     DVD's is laid over the projector screen;
//   - it is youtube-nocookie.com, the privacy-enhanced embed.
//
// The embed is driven the way YouTube's own IFrame API drives it, by
// postMessage, without loading the API script: the page's CSP lets scripts
// run only from the site itself. The player sends back its time, length and
// state, which is what the panel and the players' displays show.
//
// The CSP also has to allow the frame: frame-src https://www.youtube-nocookie.com
// in public/_headers (Fjord's, when it is wired up).

export interface Media {
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  readonly paused: boolean;
  readonly time: number;
  readonly duration: number;
  /** Called when the time, the length or the state moves. */
  onChange: () => void;
  onEnded: () => void;
  dispose(): void;
}

/** A file on the site, through an <audio> or <video> element the caller keeps. */
export function fileMedia(el: HTMLMediaElement, src: string, autoplay: boolean): Media {
  const m: Media = {
    play: () => void el.play().catch(() => m.onChange()),
    pause: () => el.pause(),
    seek: (t) => (el.currentTime = Math.max(0, Math.min(t, el.duration || t))),
    get paused() {
      return el.paused;
    },
    get time() {
      return el.currentTime || 0;
    },
    get duration() {
      return Number.isFinite(el.duration) ? el.duration : 0;
    },
    onChange: () => {},
    onEnded: () => {},
    dispose: () => {
      for (const ev of EVENTS) el.removeEventListener(ev, change);
      el.removeEventListener('ended', ended);
      el.pause();
      el.removeAttribute('src');
      el.load();
    },
  };
  const change = () => m.onChange();
  const ended = () => m.onEnded();
  for (const ev of EVENTS) el.addEventListener(ev, change);
  el.addEventListener('ended', ended);
  el.src = src;
  if (autoplay) m.play();
  return m;
}
const EVENTS = ['play', 'pause', 'loadedmetadata', 'timeupdate'] as const;

const ORIGIN = 'https://www.youtube-nocookie.com';

export interface YouTubeMedia extends Media {
  iframe: HTMLIFrameElement;
}

/**
 * A YouTube video in an embed. Put `iframe` somewhere visible. With `start`
 * and `end` (seconds) it plays only that stretch, a track cut from a
 * full-album stream, and its time and length are the track's own.
 */
export function youtubeMedia(id: string, autoplay: boolean, title: string, start = 0, end?: number): YouTubeMedia {
  const iframe = document.createElement('iframe');
  // Under the games room's cross-origin isolation (worker/library.ts), a
  // third-party frame loads only as credentialless: no cookies, which the
  // no-cookie player does not want anyway. Ignored where isolation is off.
  iframe.setAttribute('credentialless', '');
  const params = new URLSearchParams({
    enablejsapi: '1',
    autoplay: autoplay ? '1' : '0',
    playsinline: '1',
    rel: '0',
    origin: window.location.origin,
  });
  if (start) params.set('start', String(Math.floor(start)));
  if (end) params.set('end', String(Math.ceil(end)));
  iframe.src = `${ORIGIN}/embed/${encodeURIComponent(id)}?${params}`;
  // Autoplay is allowed because the click that put the disc in was the
  // reader's own, and `allow` passes that on to the frame.
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.title = title;
  iframe.style.border = '0';

  let time = 0;
  let duration = 0;
  // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued.
  let state = -1;
  let heard = false;
  let finished = false;

  const post = (o: object) => iframe.contentWindow?.postMessage(JSON.stringify(o), ORIGIN);
  const command = (func: string, args: unknown[] = []) => post({ event: 'command', func, args, id: 1, channel: 'widget' });

  // The player answers only once something has said it is listening, and it
  // may not be ready for the first few: say it until it answers.
  let tries = 0;
  const hello = window.setInterval(() => {
    if (heard || ++tries > 60) window.clearInterval(hello);
    else post({ event: 'listening', id: 1, channel: 'widget' });
  }, 250);

  const onMessage = (e: MessageEvent) => {
    if (e.origin !== ORIGIN || e.source !== iframe.contentWindow) return;
    let d: { event?: string; info?: Record<string, unknown> | number };
    try {
      d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    } catch {
      return;
    }
    heard = true;
    const info = d.info;
    let next = state;
    if (d.event === 'onStateChange' && typeof info === 'number') next = info;
    else if (info && typeof info === 'object') {
      if (typeof info.currentTime === 'number') time = info.currentTime;
      if (typeof info.duration === 'number') duration = info.duration;
      if (typeof info.playerState === 'number') next = info.playerState;
    } else return;
    const was = state;
    state = next;
    // Past its end, a track is over even if the video plays on.
    const over = end !== undefined && time >= end - 0.25 && state === 1;
    if (over) command('pauseVideo');
    m.onChange();
    if ((state === 0 && was !== 0) || (over && !finished)) {
      finished = true;
      m.onEnded();
    }
  };
  window.addEventListener('message', onMessage);

  const m: YouTubeMedia = {
    iframe,
    play: () => command('playVideo'),
    pause: () => command('pauseVideo'),
    seek: (t) => {
      finished = false;
      command('seekTo', [Math.max(0, t) + start, true]);
    },
    get paused() {
      return state !== 1 && state !== 3;
    },
    get time() {
      return Math.max(0, time - start);
    },
    get duration() {
      return Math.max(0, (end ?? duration) - start);
    },
    onChange: () => {},
    onEnded: () => {},
    dispose: () => {
      window.clearInterval(hello);
      window.removeEventListener('message', onMessage);
      iframe.remove();
    },
  };
  return m;
}
